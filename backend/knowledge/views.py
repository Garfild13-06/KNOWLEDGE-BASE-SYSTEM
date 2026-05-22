from django.conf import settings
from django.db.models import F, Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.viewsets import ModelViewSet
from django.core.files.storage import default_storage

from .audit import log_action
from .export_utils import article_to_markdown, build_section_zip, simple_html_export
from .models import (
    Article,
    ArticleComment,
    ArticleVersion,
    Section,
    UserArticleState,
)
from .permissions import KnowledgeBasePermission, user_can_edit
from .search import MIN_SEARCH_LENGTH, build_article_search_queryset
from .semantic import semantic_similar_articles, update_article_embedding
from .serializers import (
    ArticleCommentSerializer,
    ArticleSerializer,
    ArticleSearchResultSerializer,
    ArticleVersionSerializer,
    SectionSerializer,
    _attach_prefetched_children,
)
from .tenancy import filter_by_organization, get_request_organization
from .versioning import create_article_version
from .webhooks import dispatch_webhook
from .wiki_links import extract_wiki_titles, find_backlinks, resolve_wiki_links
import os as os_module

MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024
ALLOWED_UPLOAD_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.svg'}


def _user_fields_on_create(request):
    if request.user.is_authenticated:
        return {'created_by': request.user}
    return {}


def _user_fields_on_update(request):
    if request.user.is_authenticated:
        return {'updated_by': request.user}
    return {}


def _published_filter_for_request(queryset, request):
    if request.user.is_authenticated and user_can_edit(request.user):
        return queryset
    return queryset.filter(is_published=True, status=Article.STATUS_PUBLISHED)


class TenantMixin:
    def get_organization(self):
        return get_request_organization(self.request)

    def filter_tenant(self, queryset):
        return filter_by_organization(queryset, self.request)


class SectionViewSet(TenantMixin, ModelViewSet):
    queryset = Section.objects.select_related('created_by', 'organization').all()
    serializer_class = SectionSerializer
    permission_classes = [KnowledgeBasePermission]

    def get_queryset(self):
        queryset = self.filter_tenant(super().get_queryset())
        parent_id = self.request.query_params.get('parent')
        if parent_id:
            queryset = queryset.filter(parent_id=parent_id)
        now = timezone.now()
        return queryset.filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now))

    def perform_create(self, serializer):
        section = serializer.save(
            organization=self.get_organization(),
            **_user_fields_on_create(self.request),
        )
        log_action(self.request, 'create', 'section', section.id)

    @action(detail=True, methods=['get'], url_path='export')
    def export_section(self, request, pk=None):
        section = self.get_object()
        articles = Article.objects.filter(section=section, organization=section.organization)
        if not request.user.is_authenticated or not user_can_edit(request.user):
            articles = articles.filter(is_published=True)
        data = build_section_zip(section, articles)
        response = HttpResponse(data, content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="section-{section.id}.zip"'
        return response


class ArticleViewSet(TenantMixin, ModelViewSet):
    queryset = Article.objects.select_related(
        'section', 'created_by', 'updated_by', 'organization'
    ).all()
    serializer_class = ArticleSerializer
    permission_classes = [KnowledgeBasePermission]

    def get_queryset(self):
        queryset = self.filter_tenant(super().get_queryset())
        queryset = _published_filter_for_request(queryset, self.request)
        section_id = self.request.query_params.get('section')
        if section_id:
            queryset = queryset.filter(section_id=section_id)
        status_filter = self.request.query_params.get('status')
        if status_filter and self.request.user.is_authenticated and user_can_edit(self.request.user):
            queryset = queryset.filter(status=status_filter)
        return queryset.order_by('-updated_at')

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        Article.objects.filter(pk=instance.pk).update(view_count=F('view_count') + 1)
        instance.refresh_from_db()
        if request.user.is_authenticated:
            UserArticleState.objects.update_or_create(
                user=request.user,
                article=instance,
                defaults={'last_read_at': timezone.now()},
            )
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_create(self, serializer):
        data = serializer.validated_data
        status_val = data.get('status', Article.STATUS_PUBLISHED)
        is_pub = status_val == Article.STATUS_PUBLISHED
        article = serializer.save(
            organization=self.get_organization(),
            is_published=is_pub,
            **_user_fields_on_create(self.request),
        )
        create_article_version(article, self.request.user, change_summary='Создание')
        update_article_embedding(article)
        log_action(self.request, 'create', 'article', article.id)
        dispatch_webhook(self.get_organization(), 'article.created', {'id': article.id, 'title': article.title})

    def perform_update(self, serializer):
        article = self.get_object()
        create_article_version(article, self.request.user, change_summary='Редактирование')
        article = serializer.save(**_user_fields_on_update(self.request))
        update_article_embedding(article)
        log_action(self.request, 'update', 'article', article.id)
        dispatch_webhook(self.get_organization(), 'article.updated', {'id': article.id, 'title': article.title})

    def perform_destroy(self, instance):
        aid = instance.id
        title = instance.title
        org = instance.organization
        instance.delete()
        log_action(self.request, 'delete', 'article', aid)
        dispatch_webhook(org, 'article.deleted', {'id': aid, 'title': title})

    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        query = request.query_params.get('q', '').strip()
        if len(query) < MIN_SEARCH_LENGTH:
            return Response({'results': [], 'query': query})

        filters = {
            'organization': self.get_organization(),
            'section_id': request.query_params.get('section'),
            'author': request.query_params.get('author', '').strip(),
            'date_from': request.query_params.get('date_from'),
            'date_to': request.query_params.get('date_to'),
        }
        if not user_can_edit(request.user):
            filters['published_only'] = True
        articles = build_article_search_queryset(request, query, filters)
        serializer = ArticleSearchResultSerializer(
            articles, many=True, context={'query': query}
        )
        related = []
        if len(query) >= 3:
            words = query.lower().split()
            for word in words[:3]:
                if len(word) > 3:
                    related.append(word)
        return Response({
            'results': serializer.data,
            'query': query,
            'count': len(serializer.data),
            'related_queries': related[:3],
        })

    @action(detail=True, methods=['get'], url_path='versions')
    def versions(self, request, pk=None):
        article = self.get_object()
        versions = article.versions.select_related('created_by').all()
        serializer = ArticleVersionSerializer(versions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='restore')
    def restore_version(self, request, pk=None):
        if not user_can_edit(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        version_id = request.data.get('version_id')
        if not version_id:
            return Response({'detail': 'version_id обязателен'}, status=status.HTTP_400_BAD_REQUEST)
        article = self.get_object()
        try:
            version = article.versions.get(pk=version_id)
        except ArticleVersion.DoesNotExist:
            return Response({'detail': 'Версия не найдена'}, status=status.HTTP_404_NOT_FOUND)

        create_article_version(article, request.user, change_summary=f'Перед откатом к v{version.version_number}')
        article.title = version.title
        article.content = version.content
        article.save()
        if request.user.is_authenticated:
            article.updated_by = request.user
            article.save(update_fields=['updated_by'])

        serializer = ArticleSerializer(article, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='version-diff')
    def version_diff(self, request, pk=None):
        article = self.get_object()
        v1_id = request.query_params.get('from')
        v2_id = request.query_params.get('to')
        if not v1_id or not v2_id:
            return Response({'detail': 'from и to обязательны'}, status=400)
        try:
            v1 = article.versions.get(pk=v1_id)
            v2 = article.versions.get(pk=v2_id)
        except ArticleVersion.DoesNotExist:
            return Response({'detail': 'Версия не найдена'}, status=404)
        import difflib

        diff = list(difflib.unified_diff(
            (v1.content_plain or '').splitlines(),
            (v2.content_plain or '').splitlines(),
            lineterm='',
        ))
        return Response({
            'from_version': v1.version_number,
            'to_version': v2.version_number,
            'diff': '\n'.join(diff),
        })

    @action(detail=True, methods=['post'], url_path='publish')
    def publish(self, request, pk=None):
        if not user_can_edit(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        article = self.get_object()
        article.status = Article.STATUS_PUBLISHED
        article.is_published = True
        article.save()
        log_action(request, 'publish', 'article', article.id)
        dispatch_webhook(self.get_organization(), 'article.published', {'id': article.id})
        return Response(ArticleSerializer(article, context={'request': request}).data)

    @action(detail=True, methods=['post'], url_path='submit-review')
    def submit_review(self, request, pk=None):
        if not user_can_edit(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        article = self.get_object()
        article.status = Article.STATUS_IN_REVIEW
        article.is_published = False
        article.save()
        return Response(ArticleSerializer(article, context={'request': request}).data)

    @action(detail=True, methods=['get'], url_path='export')
    def export_article(self, request, pk=None):
        article = self.get_object()
        fmt = request.query_params.get('format', 'markdown')
        if fmt == 'html':
            content = simple_html_export(article)
            return HttpResponse(content, content_type='text/html; charset=utf-8')
        content = article_to_markdown(article)
        response = HttpResponse(content, content_type='text/markdown; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{article.slug or article.id}.md"'
        return response

    @action(detail=True, methods=['get'], url_path='backlinks')
    def backlinks(self, request, pk=None):
        article = self.get_object()
        linked = find_backlinks(self.get_organization(), article)
        serializer = ArticleSerializer(linked, many=True, context={'request': request})
        titles = extract_wiki_titles(article.content)
        resolved = resolve_wiki_links(self.get_organization(), titles)
        return Response({'backlinks': serializer.data, 'outgoing': resolved})

    @action(detail=True, methods=['get'], url_path='similar')
    def similar(self, request, pk=None):
        article = self.get_object()
        similar = semantic_similar_articles(self.get_organization(), article)
        serializer = ArticleSerializer(similar, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post'], url_path='comments')
    def comments(self, request, pk=None):
        article = self.get_object()
        if request.method == 'GET':
            qs = article.comments.select_related('author').all()
            return Response(ArticleCommentSerializer(qs, many=True).data)
        if not request.user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        serializer = ArticleCommentSerializer(data={
            'article': article.id,
            'body': request.data.get('body', ''),
        })
        serializer.is_valid(raise_exception=True)
        serializer.save(author=request.user, article=article)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='bookmark')
    def bookmark(self, request, pk=None):
        if not request.user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        article = self.get_object()
        state, _ = UserArticleState.objects.get_or_create(user=request.user, article=article)
        state.is_bookmarked = request.data.get('bookmarked', not state.is_bookmarked)
        state.save(update_fields=['is_bookmarked'])
        return Response({'is_bookmarked': state.is_bookmarked})


def _validate_upload(file_obj):
    ext = os_module.path.splitext(file_obj.name)[1].lower()
    if ext not in ALLOWED_UPLOAD_EXTENSIONS:
        return f'Тип файла не разрешён: {ext}'
    if file_obj.size > MAX_UPLOAD_SIZE_BYTES:
        return 'Файл слишком большой (максимум 5 МБ)'
    return None


class TinyMCEUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated, KnowledgeBasePermission]

    def post(self, request, *args, **kwargs):
        if not user_can_edit(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'Файл не передан'}, status=400)

        error = _validate_upload(file)
        if error:
            return Response({'error': error}, status=400)

        file_name = default_storage.save(os_module.path.join('uploads', file.name), file)
        file_url = request.build_absolute_uri(settings.MEDIA_URL + file_name)
        return Response({'location': file_url})


class TreeSectionsView(TenantMixin, APIView):
    permission_classes = [KnowledgeBasePermission]

    def get(self, request):
        queryset = self.filter_tenant(Section.objects.select_related('created_by', 'organization'))
        now = timezone.now()
        queryset = queryset.filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now))
        all_sections = list(queryset)
        _attach_prefetched_children(all_sections)
        root_sections = [s for s in all_sections if s.parent_id is None]
        serializer = SectionSerializer(root_sections, many=True)
        return Response(serializer.data)
