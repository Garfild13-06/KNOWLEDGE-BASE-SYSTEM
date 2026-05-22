import os

from django.conf import settings


def _env_bool(name, default=False):
    return os.getenv(name, str(default)).lower() in ('1', 'true', 'yes')


def org_settings(organization):
    if organization is None:
        return {}
    return organization.settings or {}


def feature_enabled(organization, key, env_var=None, default=False):
    org_value = org_settings(organization).get(key)
    if org_value is not None:
        return bool(org_value)
    if env_var:
        return _env_bool(env_var, default)
    return default


def ai_enabled(organization):
    return feature_enabled(organization, 'enable_ai', 'KB_ENABLE_AI', False)


def semantic_search_enabled(organization):
    return feature_enabled(
        organization, 'enable_semantic_search', 'KB_ENABLE_SEMANTIC_SEARCH', False
    )


def gamification_enabled(organization):
    return feature_enabled(organization, 'enable_gamification', 'KB_ENABLE_GAMIFICATION', False)


def graph_view_enabled(organization):
    return feature_enabled(organization, 'enable_graph_view', 'KB_ENABLE_GRAPH_VIEW', False)


def public_portal_enabled(organization):
    return feature_enabled(organization, 'enable_public_portal', 'KB_ENABLE_PUBLIC_PORTAL', True)


def get_feature_flags_payload(organization):
    return {
        'enable_ai': ai_enabled(organization),
        'enable_semantic_search': semantic_search_enabled(organization),
        'enable_gamification': gamification_enabled(organization),
        'enable_graph_view': graph_view_enabled(organization),
        'enable_public_portal': public_portal_enabled(organization),
    }
