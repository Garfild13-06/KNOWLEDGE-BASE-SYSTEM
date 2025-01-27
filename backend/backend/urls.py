from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from knowledge.views import SectionViewSet, ArticleViewSet

router = DefaultRouter()
router.register(r'sections', SectionViewSet, basename='section')
router.register(r'articles', ArticleViewSet, basename='article')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include(router.urls)),  # Подключаем все маршруты из DefaultRouter
]
