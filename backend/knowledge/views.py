from django.conf import settings
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.viewsets import ModelViewSet
from django.core.files.storage import default_storage

from .models import Article, ArticleVersion, Section
from .permissions import KnowledgeBasePermission, user_can_edit
from .search import MIN_SEARCH_LENGTH, build_article_search_queryset
from .serializers import (
    ArticleSerializer,
    ArticleSearchResultSerializer,
    ArticleVersionSerializer,
    SectionSerializer,
    _attach_prefetched_children,
)
from .tenancy import filter_by_organization, get_request_organization
from .versioning import create_article_version
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
        return queryset

    def perform_create(self, serializer):
        serializer.save(
            organization=self.get_organization(),
            **_user_fields_on_create(self.request),
        )


class ArticleViewSet(TenantMixin, ModelViewSet):
    queryset = Article.objects.select_related(
        'section', 'created_by', 'updated_by', 'organization'
    ).all()
    serializer_class = ArticleSerializer
    permission_classes = [KnowledgeBasePermission]

    def get_queryset(self):
        queryset = self.filter_tenant(super().get_queryset())
        section_id = self.request.query_params.get('section')
        if section_id:
            queryset = queryset.filter(section_id=section_id)
        return queryset.order_by('-updated_at')

    def perform_create(self, serializer):
        article = serializer.save(
            organization=self.get_organization(),
            **_user_fields_on_create(self.request),
        )
        create_article_version(article, self.request.user, change_summary='Создание')

    def perform_update(self, serializer):
        article = self.get_object()
        create_article_version(article, self.request.user, change_summary='Редактирование')
        serializer.save(**_user_fields_on_update(self.request))

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
        articles = build_article_search_queryset(request, query, filters)
        serializer = ArticleSearchResultSerializer(
            articles, many=True, context={'query': query}
        )
        return Response({
            'results': serializer.data,
            'query': query,
            'count': len(serializer.data),
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

        serializer = ArticleSerializer(article)
        return Response(serializer.data)


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
        all_sections = list(queryset)
        _attach_prefetched_children(all_sections)
        root_sections = [s for s in all_sections if s.parent_id is None]
        serializer = SectionSerializer(root_sections, many=True)
        return Response(serializer.data)
