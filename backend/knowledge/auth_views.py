import os

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .constants import ROLE_EDITOR
from .models import Organization, UserProfile
from .permissions import get_user_role, user_can_edit, user_is_admin
from .serializers import JoinOrganizationSerializer, OrganizationSerializer, UserMeSerializer
from .tenancy import get_request_organization

User = get_user_model()


def build_me_payload(user, request=None):
    organization = get_request_organization(request) if request else None
    if user.is_authenticated:
        profile = getattr(user, 'profile', None)
        if profile:
            organization = profile.organization
        role = get_user_role(user)
    else:
        role = None

    role_display_map = dict(UserProfile._meta.get_field('role').choices)
    return {
        'id': user.id,
        'username': user.username,
        'role': role,
        'role_display': role_display_map.get(role, ''),
        'can_edit': user_can_edit(user),
        'is_admin': user_is_admin(user),
        'organization': OrganizationSerializer(organization).data if organization else None,
    }


class MeView(APIView):
    def get(self, request):
        if not request.user.is_authenticated:
            org = get_request_organization(request)
            return Response({
                'id': None,
                'username': None,
                'role': None,
                'role_display': 'Гость',
                'can_edit': False,
                'is_admin': False,
                'organization': OrganizationSerializer(org).data,
            })
        return Response(build_me_payload(request.user, request))


class JoinOrganizationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = JoinOrganizationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        slug = serializer.validated_data['organization_slug']
        try:
            organization = Organization.objects.get(slug=slug, is_active=True)
        except Organization.DoesNotExist:
            return Response(
                {'detail': 'Организация не найдена'},
                status=status.HTTP_404_NOT_FOUND,
            )

        profile, _ = UserProfile.objects.get_or_create(
            user=request.user,
            defaults={'organization': organization, 'role': ROLE_EDITOR},
        )
        profile.organization = organization
        profile.save(update_fields=['organization'])
        return Response(build_me_payload(request.user, request))


class AuthProvidersView(APIView):
    """Список доступных провайдеров входа (OAuth)."""

    def get(self, request):
        providers = []
        google_client = os.getenv('GOOGLE_OAUTH_CLIENT_ID', '').strip()
        if google_client:
            redirect_uri = os.getenv(
                'GOOGLE_OAUTH_REDIRECT_URI',
                'http://localhost:8000/api/auth/google/callback/',
            )
            scope = 'openid email profile'
            auth_url = (
                'https://accounts.google.com/o/oauth2/v2/auth'
                f'?client_id={google_client}'
                f'&redirect_uri={redirect_uri}'
                '&response_type=code'
                f'&scope={scope.replace(" ", "%20")}'
            )
            providers.append({
                'id': 'google',
                'name': 'Google',
                'auth_url': auth_url,
            })
        return Response({'providers': providers})
