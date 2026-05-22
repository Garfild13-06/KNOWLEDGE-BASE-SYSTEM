from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from .constants import ROLE_EDITOR
from .models import UserProfile
from .tenancy import get_default_organization

User = get_user_model()


@receiver(post_save, sender=User)
def ensure_user_profile(sender, instance, created, **kwargs):
    if not created:
        return
    organization = get_default_organization()
    UserProfile.objects.get_or_create(
        user=instance,
        defaults={'organization': organization, 'role': ROLE_EDITOR},
    )
