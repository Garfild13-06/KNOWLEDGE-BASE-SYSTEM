from rest_framework.permissions import BasePermission, SAFE_METHODS

from .constants import ROLE_ADMIN, ROLE_EDITOR, ROLE_HIERARCHY, ROLE_READER


def get_user_role(user):
    if not user or not user.is_authenticated:
        return None
    if user.is_superuser:
        return ROLE_ADMIN
    from .models import UserProfile

    try:
        profile = UserProfile.objects.get(user_id=user.pk)
        return profile.role
    except UserProfile.DoesNotExist:
        profile = getattr(user, 'profile', None)
        if profile:
            return profile.role
    if user.groups.filter(name='KB Admin').exists():
        return ROLE_ADMIN
    if user.groups.filter(name='KB Editor').exists():
        return ROLE_EDITOR
    if user.groups.filter(name='KB Reader').exists():
        return ROLE_READER
    return ROLE_EDITOR


def user_can_edit(user):
    role = get_user_role(user)
    if user and user.is_superuser:
        return True
    return role in (ROLE_EDITOR, ROLE_ADMIN)


def user_is_admin(user):
    role = get_user_role(user)
    if user and user.is_superuser:
        return True
    return role == ROLE_ADMIN


class KnowledgeBasePermission(BasePermission):
    """Чтение для всех; запись — редактор и выше."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_authenticated and user_can_edit(request.user)


class IsKnowledgeAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and user_is_admin(request.user)
