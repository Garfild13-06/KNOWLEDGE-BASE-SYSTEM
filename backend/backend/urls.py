from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from knowledge.views import SectionViewSet, ArticleViewSet, TinyMCEUploadView, TreeSectionsView
from knowledge.auth_views import (
    MeView,
    JoinOrganizationView,
    AuthProvidersView,
    GoogleOAuthCallbackView,
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r'sections', SectionViewSet, basename='section')
router.register(r'articles', ArticleViewSet, basename='article')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include(router.urls)),
    path("uploads/", TinyMCEUploadView.as_view(), name="tinymce-upload"),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view()),
    path('api/auth/me/', MeView.as_view(), name='auth_me'),
    path('api/auth/join-organization/', JoinOrganizationView.as_view(), name='auth_join_org'),
    path('api/auth/providers/', AuthProvidersView.as_view(), name='auth_providers'),
    path('api/auth/google/callback/', GoogleOAuthCallbackView.as_view(), name='google_oauth_callback'),
    path('tree_sections/', TreeSectionsView.as_view(), name='tree_sections'),

]

# Добавляем маршруты для медиа-файлов (только в режиме разработки)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
