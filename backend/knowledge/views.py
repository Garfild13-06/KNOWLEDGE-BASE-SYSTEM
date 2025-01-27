from rest_framework.viewsets import ModelViewSet
from .models import Section, Article
from .serializers import SectionSerializer, ArticleSerializer
import logging

logger = logging.getLogger(__name__)
class SectionViewSet(ModelViewSet):
    """
    ViewSet для управления разделами (полками).
    """
    queryset = Section.objects.all()
    serializer_class = SectionSerializer

    def get_queryset(self):
        parent_id = self.request.query_params.get('parent')
        if parent_id:
            return Section.objects.filter(parent_id=parent_id)
        return super().get_queryset()
    
    def list(self, request, *args, **kwargs):
        logger.info(f"Запрос от: {request.META.get('REMOTE_ADDR')}")
        return super().list(request, *args, **kwargs)



class ArticleViewSet(ModelViewSet):
    """
    ViewSet для управления статьями (книгами).
    """
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer

    def get_queryset(self):
        section_id = self.request.query_params.get('section')
        if section_id:
            return Article.objects.filter(section_id=section_id)
        return super().get_queryset()
