from .models import AuditLog


def log_action(request, action, entity_type, entity_id, details=None):
    from .tenancy import get_request_organization

    organization = get_request_organization(request)
    user = request.user if request.user.is_authenticated else None
    ip = request.META.get('REMOTE_ADDR')
    AuditLog.objects.create(
        organization=organization,
        user=user,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details or {},
        ip_address=ip,
    )
