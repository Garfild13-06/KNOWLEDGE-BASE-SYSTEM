from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from knowledge.views import SectionViewSet, ArticleViewSet, TinyMCEUploadView, TreeSectionsView
from knowledge.extra_views import (
    HealthView,
    DashboardView,
    ArticleTemplatesView,
    PublicDocsView,
    KnowledgeGraphView,
    SemanticSearchView,
    AIAssistView,
    ImportArticlesView,
    WebhookSubscriptionViewSet,
    AuditLogView,
    SandboxSectionView,
)
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
router.register(r'webhooks', WebhookSubscriptionViewSet, basename='webhook')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include(router.urls)),
    path('uploads/', TinyMCEUploadView.as_view(), name='tinymce-upload'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view()),
    path('api/auth/me/', MeView.as_view(), name='auth_me'),
    path('api/auth/join-organization/', JoinOrganizationView.as_view(), name='auth_join_org'),
    path('api/auth/providers/', AuthProvidersView.as_view(), name='auth_providers'),
    path('api/auth/google/callback/', GoogleOAuthCallbackView.as_view(), name='google_oauth_callback'),
    path('tree_sections/', TreeSectionsView.as_view(), name='tree_sections'),
    path('api/health/', HealthView.as_view(), name='health'),
    path('api/dashboard/', DashboardView.as_view(), name='dashboard'),
    path('api/templates/', ArticleTemplatesView.as_view(), name='article_templates'),
    path('api/search/semantic/', SemanticSearchView.as_view(), name='semantic_search'),
    path('api/ai/', AIAssistView.as_view(), name='ai_assist'),
    path('api/import/', ImportArticlesView.as_view(), name='import_articles'),
    path('api/audit/', AuditLogView.as_view(), name='audit_log'),
    path('api/graph/', KnowledgeGraphView.as_view(), name='knowledge_graph'),
    path('api/sandbox/', SandboxSectionView.as_view(), name='sandbox_section'),
    path(
        'docs/<slug:org_slug>/<slug:article_slug>/',
        PublicDocsView.as_view(),
        name='public_docs',
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
