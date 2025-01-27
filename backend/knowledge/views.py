from rest_framework import generics
from .models import Section, Article
from .serializers import SectionSerializer, ArticleSerializer

class SectionListCreateAPIView(generics.ListCreateAPIView):
    queryset = Section.objects.all()
    serializer_class = SectionSerializer

class ArticleListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = ArticleSerializer

    def get_queryset(self):
        queryset = Article.objects.all()
        section_id = self.request.query_params.get('section')  # Получаем параметр section из запроса
        if section_id:
            queryset = queryset.filter(section_id=section_id)  # Фильтруем статьи по разделу
        return queryset

class SectionDetailAPIView(generics.RetrieveAPIView):
    queryset = Section.objects.all()
    serializer_class = SectionSerializer

class ArticleDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer