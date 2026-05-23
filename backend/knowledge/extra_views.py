import difflib
import time
from datetime import timedelta

from django.db.models import Count, F, Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from .ai_service import (
    ai_available,
    generate_draft_from_outline,
    quality_check,
    rag_answer,
    summarize_article,
)
from .article_templates import ARTICLE_TEMPLATES
from .audit import log_action
from .export_utils import article_to_markdown, build_section_zip, simple_html_export
from .features import (
    ai_enabled,
    gamification_enabled,
    get_feature_flags_payload,
    graph_view_enabled,
    public_portal_enabled,
    semantic_search_enabled,
)
from .models import (
    Article,
    ArticleComment,
    AuditLog,
    Section,
    UserArticleState,
    WebhookSubscription,
)
from .permissions import IsKnowledgeAdmin, KnowledgeBasePermission, user_can_edit, user_is_admin
from .search import MIN_SEARCH_LENGTH, build_article_search_queryset
from .semantic import semantic_similar_articles, update_article_embedding
from .serializers import (
    ArticleSearchResultSerializer,
    ArticleSerializer,
    AuditLogSerializer,
    WebhookSubscriptionSerializer,
)
from .tenancy import filter_by_organization, get_request_organization
from .webhooks import dispatch_webhook
from .wiki_links import extract_wiki_titles, find_backlinks, resolve_wiki_links

_AI_RATE_BUCKETS = {}
AI_RATE_LIMIT_PER_HOUR = 30


def _ai_rate_ok(user):
    uid = getattr(user, 'id', None) or 'guest'
    now = time.time()
    bucket = [t for t in _AI_RATE_BUCKETS.get(uid, []) if now - t < 3600]
    if len(bucket) >= AI_RATE_LIMIT_PER_HOUR:
        return False
    bucket.append(now)
    _AI_RATE_BUCKETS[uid] = bucket
    return True


class TenantAPIView:
    def get_organization(self):
        return get_request_organization(self.request)

    def filter_tenant(self, queryset):
        return filter_by_organization(queryset, self.request)


class HealthView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        db_ok = True
        try:
            Section.objects.exists()
        except Exception:
            db_ok = False
        return Response({
            'status': 'ok' if db_ok else 'degraded',
            'database': db_ok,
            'version': '1.0.0',
        })


class DashboardView(TenantAPIView, APIView):
    permission_classes = [KnowledgeBasePermission]

    def get(self, request):
        org = self.get_organization()
        now = timezone.now()
        stale_before = now - timedelta(days=90)

        base = Article.objects.filter(organization=org)
        if not request.user.is_authenticated:
            base = base.filter(is_published=True, status=Article.STATUS_PUBLISHED)
        elif not user_can_edit(request.user):
            base = base.filter(is_published=True)

        recent = base.order_by('-updated_at')[:8]
        popular = base.filter(is_published=True).order_by('-view_count', '-updated_at')[:8]
        stale = base.filter(is_published=True, updated_at__lt=stale_before).order_by('updated_at')[:8]

        drafts = Article.objects.none()
        if request.user.is_authenticated and user_can_edit(request.user):
            drafts = Article.objects.filter(
                organization=org,
                created_by=request.user,
                status=Article.STATUS_DRAFT,
            ).order_by('-updated_at')[:8]

        bookmarks = Article.objects.none()
        if request.user.is_authenticated:
            bookmark_ids = UserArticleState.objects.filter(
                user=request.user,
                is_bookmarked=True,
                article__organization=org,
            ).values_list('article_id', flat=True)
            bookmarks = base.filter(id__in=bookmark_ids)[:8]

        payload = {
            'recent': ArticleSerializer(recent, many=True, context={'request': request}).data,
            'popular': ArticleSerializer(popular, many=True, context={'request': request}).data,
            'stale': ArticleSerializer(stale, many=True, context={'request': request}).data,
            'my_drafts': ArticleSerializer(drafts, many=True, context={'request': request}).data,
            'bookmarks': ArticleSerializer(bookmarks, many=True, context={'request': request}).data,
            'stats': {
                'articles_total': base.count(),
                'sections_total': Section.objects.filter(organization=org).count(),
                'drafts_total': Article.objects.filter(
                    organization=org, status=Article.STATUS_DRAFT
                ).count(),
            },
        }
        if gamification_enabled(org) and request.user.is_authenticated:
            payload['gamification'] = {
                'points': Article.objects.filter(
                    organization=org, created_by=request.user
                ).count() * 10,
                'level': min(10, Article.objects.filter(
                    organization=org, created_by=request.user
                ).count() // 5 + 1),
            }
        return Response(payload)


class ArticleTemplatesView(APIView):
    permission_classes = [KnowledgeBasePermission]

    def get(self, request):
        templates = [
            {'key': key, 'name': data['name'], 'content': data['content']}
            for key, data in ARTICLE_TEMPLATES.items()
        ]
        return Response({'templates': templates})


class PublicDocsView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, org_slug, article_slug):
        try:
            from .models import Organization

            org = Organization.objects.get(slug=org_slug, is_active=True)
        except Organization.DoesNotExist:
            return Response({'detail': 'Не найдено'}, status=status.HTTP_404_NOT_FOUND)

        if not public_portal_enabled(org):
            return Response({'detail': 'Публичный портал отключён'}, status=status.HTTP_403_FORBIDDEN)

        try:
            article = Article.objects.select_related('section').get(
                organization=org,
                slug=article_slug,
                is_published=True,
                section__is_public=True,
            )
        except Article.DoesNotExist:
            return Response({'detail': 'Статья не найдена'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'title': article.title,
            'content': article.content,
            'section': article.section.name,
            'updated_at': article.updated_at,
        })


class KnowledgeGraphView(TenantAPIView, APIView):
    permission_classes = [KnowledgeBasePermission]

    def get(self, request):
        org = self.get_organization()
        if not graph_view_enabled(org):
            return Response({'detail': 'Граф отключён'}, status=status.HTTP_403_FORBIDDEN)

        articles = self.filter_tenant(
            Article.objects.filter(organization=org, is_published=True)
        ).select_related('section')[:300]

        nodes = []
        edges = []
        for article in articles:
            nodes.append({
                'id': f'article-{article.id}',
                'label': article.title,
                'type': 'article',
                'section_id': article.section_id,
            })
            for title in extract_wiki_titles(article.content):
                target = articles.filter(title__iexact=title.strip()).first()
                if target:
                    edges.append({
                        'source': f'article-{article.id}',
                        'target': f'article-{target.id}',
                        'type': 'wiki_link',
                    })

        return Response({'nodes': nodes, 'edges': edges})


class SemanticSearchView(TenantAPIView, APIView):
    permission_classes = [KnowledgeBasePermission]

    def get(self, request):
        org = self.get_organization()
        if not semantic_search_enabled(org):
            return Response(
                {'detail': 'Семантический поиск отключён. KB_ENABLE_SEMANTIC_SEARCH=true'},
                status=status.HTTP_403_FORBIDDEN,
            )
        query = request.query_params.get('q', '').strip()
        if len(query) < MIN_SEARCH_LENGTH:
            return Response({'results': [], 'query': query})

        filters = {'organization': org}
        articles = list(build_article_search_queryset(request, query, filters)[:30])
        query_vec = None
        from .semantic import build_embedding_vector

        query_vec = build_embedding_vector(query)
        from .semantic import _cosine
        from .models import ArticleEmbedding

        scored = []
        for article in articles:
            try:
                vec = article.embedding.vector
            except ArticleEmbedding.DoesNotExist:
                from .semantic import build_embedding_vector as bev

                vec = bev(article.content_plain)
            scored.append((_cosine(query_vec, vec), article))
        scored.sort(key=lambda row: row[0], reverse=True)
        ordered = [row[1] for row in scored]
        serializer = ArticleSearchResultSerializer(
            ordered, many=True, context={'query': query}
        )
        return Response({'results': serializer.data, 'query': query, 'mode': 'semantic'})


class AIAssistView(TenantAPIView, APIView):
    permission_classes = [IsAuthenticated, KnowledgeBasePermission]

    def post(self, request):
        org = self.get_organization()
        if not ai_enabled(org):
            return Response({'error': 'AI отключён (KB_ENABLE_AI)'}, status=status.HTTP_403_FORBIDDEN)
        if not _ai_rate_ok(request.user):
            return Response({'error': 'Превышен лимит запросов AI'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        action_type = request.data.get('action', 'summarize')
        if action_type == 'summarize':
            article_id = request.data.get('article_id')
            article = Article.objects.filter(pk=article_id, organization=org).first()
            if not article:
                return Response({'detail': 'Статья не найдена'}, status=404)
            result = summarize_article(org, article.title, article.content_plain)
            return Response(result)

        if action_type == 'draft':
            outline = request.data.get('outline', '')
            result = generate_draft_from_outline(org, outline)
            return Response(result)

        if action_type == 'rag':
            question = request.data.get('question', '')
            articles = self.filter_tenant(
                Article.objects.filter(organization=org, is_published=True)
            )[:20]
            contexts = [
                f'{a.title}: {(a.content_plain or "")[:500]}' for a in articles
            ]
            result = rag_answer(org, question, contexts)
            return Response(result)

        if action_type == 'lint':
            content = request.data.get('content_plain', '')
            return Response({'issues': quality_check(content), 'ai_available': ai_available(org)})

        return Response({'detail': 'Неизвестное действие'}, status=400)


class ImportArticlesView(TenantAPIView, APIView):
    permission_classes = [IsAuthenticated, KnowledgeBasePermission]

    def post(self, request):
        if not user_can_edit(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        items = request.data.get('articles', [])
        section_id = request.data.get('section_id')
        org = self.get_organization()
        try:
            section = Section.objects.get(pk=section_id, organization=org)
        except Section.DoesNotExist:
            return Response({'detail': 'Раздел не найден'}, status=404)

        created = []
        for item in items[:50]:
            title = (item.get('title') or 'Импорт').strip()[:255]
            content = item.get('content', '<p></p>')
            article = Article.objects.create(
                title=title,
                content=content,
                section=section,
                organization=org,
                created_by=request.user,
                status=Article.STATUS_DRAFT,
                is_published=False,
            )
            created.append(article.id)
        log_action(request, 'import', 'section', section.id, {'count': len(created)})
        return Response({'created_ids': created, 'count': len(created)})


class WebhookSubscriptionViewSet(TenantAPIView, ModelViewSet):
    serializer_class = WebhookSubscriptionSerializer
    permission_classes = [IsKnowledgeAdmin]

    def get_queryset(self):
        return WebhookSubscription.objects.filter(organization=self.get_organization())

    def perform_create(self, serializer):
        serializer.save(organization=self.get_organization())


class AuditLogView(TenantAPIView, APIView):
    permission_classes = [IsKnowledgeAdmin]

    def get(self, request):
        logs = AuditLog.objects.filter(
            organization=self.get_organization()
        ).select_related('user')[:100]
        return Response(AuditLogSerializer(logs, many=True).data)


class SandboxSectionView(TenantAPIView, APIView):
    """Создание временного раздела-песочницы (TTL из env KB_SANDBOX_TTL_HOURS)."""
    permission_classes = [IsAuthenticated, KnowledgeBasePermission]

    def post(self, request):
        import os

        if not user_can_edit(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        hours = int(os.getenv('KB_SANDBOX_TTL_HOURS', '72'))
        org = self.get_organization()
        section = Section.objects.create(
            name=request.data.get('name', 'Песочница'),
            description='Временный раздел',
            organization=org,
            created_by=request.user,
            expires_at=timezone.now() + timedelta(hours=hours),
        )
        log_action(request, 'sandbox_create', 'section', section.id, {'ttl_hours': hours})
        from .serializers import SectionSerializer

        return Response(SectionSerializer(section).data, status=status.HTTP_201_CREATED)
