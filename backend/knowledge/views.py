from django.conf import settings  # Импортируем настройки проекта
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.viewsets import ModelViewSet
from .models import Section, Article
from .serializers import SectionSerializer, ArticleSerializer, TreeSectionSerializer
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.http import JsonResponse
import os


class SectionViewSet(ModelViewSet):
    """
    ViewSet для управления разделами (полками).
    """
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]  # Чтение для всех, изменение — для авторизованных

    def post_queryset(self):
        parent_id = self.request.query_params.get('parent')
        if parent_id:
            return Section.objects.filter(parent_id=parent_id)
        return super().get_queryset()


class ArticleViewSet(ModelViewSet):
    """
    ViewSet для управления статьями (книгами).
    """
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]  # Чтение для всех, изменение — для авторизованных

    def get_queryset(self):
        section_id = self.request.query_params.get('section')
        if section_id:
            return Article.objects.filter(section_id=section_id)
        return super().get_queryset()


class FileUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        print("🔹 request.FILES.keys():", request.FILES.keys())  # Логируем переданные файлы

        if not request.FILES:
            return Response({"success": False, "message": "Файл не передан"}, status=400)

        file_key = next(iter(request.FILES.keys()))  # Получаем первый ключ из request.FILES
        file_obj = request.FILES[file_key]  # Используем правильный ключ
        file_path = default_storage.save(f"{file_obj.name}", file_obj)
        full_url = request.build_absolute_uri(settings.MEDIA_URL + file_obj.name)

        return Response({
            "success": True,
            "data": {"files": [full_url]}
        })


class TinyMCEUploadView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request, *args, **kwargs):
        file = request.FILES["file"]
        file_name = default_storage.save(os.path.join("uploads", file.name), file)
        file_url = request.build_absolute_uri(settings.MEDIA_URL + file_name)

        return Response({"location": file_url})

class TreeSectionsView(APIView):
    def get(self, request):
        # Получаем корневые разделы
        root_sections = Section.objects.filter(parent__isnull=True)
        # Сериализуем их вместе с дочерними разделами
        serializer = SectionSerializer(root_sections, many=True)
        return Response(serializer.data)