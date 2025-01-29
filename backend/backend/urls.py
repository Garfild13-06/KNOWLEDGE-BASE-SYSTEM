from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from knowledge.views import SectionViewSet, ArticleViewSet, FileUploadView

router = DefaultRouter()
router.register(r'sections', SectionViewSet, basename='section')
router.register(r'articles', ArticleViewSet, basename='article')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include(router.urls)),
    path("api/uploads/", FileUploadView.as_view(), name="file-upload"),
]

# Добавляем маршруты для медиа-файлов (только в режиме разработки)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
