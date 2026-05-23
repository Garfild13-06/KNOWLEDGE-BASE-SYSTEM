from .constants import ROLE_ADMIN
from .models import SectionPermission
from .permissions import get_user_role, user_can_edit


def user_has_section_write(user, section):
    if not user or not user.is_authenticated:
        return False
    if get_user_role(user) == ROLE_ADMIN or user.is_superuser:
        return True
    if not user_can_edit(user):
        return False
    perms = SectionPermission.objects.filter(section=section, user=user)
    if not perms.exists():
        return True
    return perms.filter(permission=SectionPermission.PERM_WRITE).exists()


def user_has_section_read(user, section):
    if section.is_public:
        return True
    if not user or not user.is_authenticated:
        return section.is_public
    if get_user_role(user) == ROLE_ADMIN or user.is_superuser:
        return True
    perms = SectionPermission.objects.filter(section=section, user=user)
    if not perms.exists():
        return True
    return perms.filter(permission__in=[SectionPermission.PERM_READ, SectionPermission.PERM_WRITE]).exists()


def filter_sections_for_user(queryset, user):
    if user and user.is_authenticated:
        role = get_user_role(user)
        if role == ROLE_ADMIN or user.is_superuser:
            return queryset
    restricted_ids = SectionPermission.objects.values_list('section_id', flat=True).distinct()
    if not restricted_ids:
        return queryset
    if not user or not user.is_authenticated:
        return queryset.filter(is_public=True)
    allowed = SectionPermission.objects.filter(user=user).values_list('section_id', flat=True)
    return queryset.filter(id__in=allowed) | queryset.exclude(id__in=restricted_ids)
