from django.conf import settings
from django.db.models import Q
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.core.files.storage import default_storage
import os

from .models import Section, Article
from .serializers import (
    SectionSerializer,
    ArticleSerializer,
    ArticleSearchResultSerializer,
    _attach_prefetched_children,
)

MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024
ALLOWED_UPLOAD_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.svg'}
MIN_SEARCH_LENGTH = 2
SEARCH_RESULTS_LIMIT = 25


def _user_fields_on_create(request):
    if request.user.is_authenticated:
        return {'created_by': request.user}
    return {}


def _user_fields_on_update(request):
    if request.user.is_authenticated:
        return {'updated_by': request.user}
    return {}


class SectionViewSet(ModelViewSet):
    queryset = Section.objects.select_related('created_by').all()
    serializer_class = SectionSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(**_user_fields_on_create(self.request))

    def get_queryset(self):
        parent_id = self.request.query_params.get('parent')
        if parent_id:
            return Section.objects.filter(parent_id=parent_id)
        return super().get_queryset()


class ArticleViewSet(ModelViewSet):
    queryset = Article.objects.select_related('section', 'created_by', 'updated_by').all()
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(**_user_fields_on_create(self.request))

    def perform_update(self, serializer):
        serializer.save(**_user_fields_on_update(self.request))

    def get_queryset(self):
        queryset = super().get_queryset()
        section_id = self.request.query_params.get('section')
        if section_id:
            queryset = queryset.filter(section_id=section_id)
        return queryset.order_by('-updated_at')

    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        query = request.query_params.get('q', '').strip()
        if len(query) < MIN_SEARCH_LENGTH:
            return Response({'results': []})

        articles = (
            Article.objects.filter(
                Q(title__icontains=query) | Q(content__icontains=query)
            )
            .select_related('section', 'created_by')
            .order_by('-updated_at')[:SEARCH_RESULTS_LIMIT]
        )
        serializer = ArticleSearchResultSerializer(
            articles, many=True, context={'query': query}
        )
        return Response({'results': serializer.data})


def _validate_upload(file_obj):
    ext = os.path.splitext(file_obj.name)[1].lower()
    if ext not in ALLOWED_UPLOAD_EXTENSIONS:
        return f'Тип файла не разрешён: {ext}'
    if file_obj.size > MAX_UPLOAD_SIZE_BYTES:
        return 'Файл слишком большой (максимум 5 МБ)'
    return None


class TinyMCEUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'Файл не передан'}, status=400)

        error = _validate_upload(file)
        if error:
            return Response({'error': error}, status=400)

        file_name = default_storage.save(os.path.join('uploads', file.name), file)
        file_url = request.build_absolute_uri(settings.MEDIA_URL + file_name)
        return Response({'location': file_url})


class TreeSectionsView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        all_sections = list(Section.objects.select_related('created_by').all())
        _attach_prefetched_children(all_sections)
        root_sections = [s for s in all_sections if s.parent_id is None]
        serializer = SectionSerializer(root_sections, many=True)
        return Response(serializer.data)
