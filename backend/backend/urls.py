from django.contrib import admin
from django.urls import path
from knowledge.views import *


urlpatterns = [
    path('admin/', admin.site.urls),
    path('sections/', SectionListCreateAPIView.as_view(), name='section-list'),
    path('sections/<int:pk>/', SectionDetailAPIView.as_view(), name='section-detail'),
    path('articles/', ArticleListCreateAPIView.as_view(), name='article-list'),
    path('articles/<int:pk>/', ArticleDetailAPIView.as_view(), name='article-detail'),  # Новый эндпоинт
]

