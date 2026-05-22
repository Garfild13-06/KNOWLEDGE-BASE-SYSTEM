import os
import re

import requests
from django.contrib.auth import get_user_model
from django.shortcuts import redirect
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .constants import ROLE_EDITOR
from .models import Organization, UserProfile
from .permissions import get_user_role, user_can_edit, user_is_admin
from .serializers import JoinOrganizationSerializer, OrganizationSerializer
from .tenancy import get_default_organization, get_request_organization

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


def _unique_username(base):
    safe = re.sub(r'[^\w.@+-]', '_', base)[:140] or 'user'
    username = safe
    counter = 1
    while User.objects.filter(username=username).exists():
        username = f'{safe}_{counter}'
        counter += 1
    return username


def _ensure_user_profile(user):
    organization = get_default_organization()
    UserProfile.objects.get_or_create(
        user=user,
        defaults={'organization': organization, 'role': ROLE_EDITOR},
    )


def _jwt_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token), str(refresh)


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
                '&access_type=online'
                f'&scope={scope.replace(" ", "%20")}'
            )
            providers.append({
                'id': 'google',
                'name': 'Google',
                'auth_url': auth_url,
            })
        return Response({'providers': providers})


class GoogleOAuthCallbackView(APIView):
    """Обмен authorization code на JWT и редирект на фронтенд."""

    authentication_classes = []
    permission_classes = []

    def get(self, request):
        error = request.query_params.get('error')
        if error:
            return redirect(self._frontend_error(error))

        code = request.query_params.get('code')
        if not code:
            return Response({'detail': 'Параметр code обязателен'}, status=status.HTTP_400_BAD_REQUEST)

        client_id = os.getenv('GOOGLE_OAUTH_CLIENT_ID', '').strip()
        client_secret = os.getenv('GOOGLE_OAUTH_CLIENT_SECRET', '').strip()
        redirect_uri = os.getenv(
            'GOOGLE_OAUTH_REDIRECT_URI',
            'http://localhost:8000/api/auth/google/callback/',
        )
        if not client_id or not client_secret:
            return Response(
                {'detail': 'Google OAuth не настроен на сервере'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            token_response = requests.post(
                'https://oauth2.googleapis.com/token',
                data={
                    'code': code,
                    'client_id': client_id,
                    'client_secret': client_secret,
                    'redirect_uri': redirect_uri,
                    'grant_type': 'authorization_code',
                },
                timeout=15,
            )
            token_response.raise_for_status()
            access_token = token_response.json()['access_token']

            userinfo_response = requests.get(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                headers={'Authorization': f'Bearer {access_token}'},
                timeout=15,
            )
            userinfo_response.raise_for_status()
            userinfo = userinfo_response.json()
        except requests.RequestException as exc:
            return redirect(self._frontend_error('oauth_exchange_failed'))

        email = userinfo.get('email')
        if not email:
            return redirect(self._frontend_error('email_not_provided'))

        user = User.objects.filter(email=email).first()
        if not user:
            username = _unique_username(email.split('@')[0])
            user = User.objects.create_user(
                username=username,
                email=email,
                password=User.objects.make_random_password(),
                first_name=userinfo.get('given_name', '')[:30],
                last_name=userinfo.get('family_name', '')[:150],
            )
        _ensure_user_profile(user)

        access, refresh = _jwt_tokens_for_user(user)
        return redirect(self._frontend_success(access, refresh))

    def _frontend_success(self, access, refresh):
        base = os.getenv('FRONTEND_URL', 'http://localhost:5173').rstrip('/')
        return redirect(f'{base}/oauth/callback?access={access}&refresh={refresh}')

    def _frontend_error(self, code):
        base = os.getenv('FRONTEND_URL', 'http://localhost:5173').rstrip('/')
        return redirect(f'{base}/oauth/callback?error={code}')
