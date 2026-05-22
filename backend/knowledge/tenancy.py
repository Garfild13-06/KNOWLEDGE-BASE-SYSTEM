from .constants import DEFAULT_ORG_SLUG
from .models import Organization


def get_default_organization():
    org, _ = Organization.objects.get_or_create(
        slug=DEFAULT_ORG_SLUG,
        defaults={'name': 'Основная организация'},
    )
    return org


def get_request_organization(request):
    if not request.user.is_authenticated:
        return get_default_organization()

    profile = getattr(request.user, 'profile', None)
    if profile and profile.organization_id:
        return profile.organization
    return get_default_organization()


def filter_by_organization(queryset, request):
    organization = get_request_organization(request)
    if organization is None:
        return queryset.none()
    return queryset.filter(organization=organization)
