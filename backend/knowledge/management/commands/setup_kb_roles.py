from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand

from knowledge.constants import ROLE_ADMIN, ROLE_EDITOR, ROLE_READER
from knowledge.models import UserProfile
from knowledge.tenancy import get_default_organization

GROUP_ROLE_MAP = {
    'KB Reader': ROLE_READER,
    'KB Editor': ROLE_EDITOR,
    'KB Admin': ROLE_ADMIN,
}


class Command(BaseCommand):
    help = 'Создаёт группы ролей KB и синхронизирует UserProfile.role'

    def handle(self, *args, **options):
        organization = get_default_organization()
        for group_name in GROUP_ROLE_MAP:
            Group.objects.get_or_create(name=group_name)
            self.stdout.write(self.style.SUCCESS(f'Группа: {group_name}'))

        for profile in UserProfile.objects.select_related('user').all():
            user = profile.user
            if user.is_superuser:
                profile.role = ROLE_ADMIN
            elif user.groups.filter(name='KB Admin').exists():
                profile.role = ROLE_ADMIN
            elif user.groups.filter(name='KB Editor').exists():
                profile.role = ROLE_EDITOR
            elif user.groups.filter(name='KB Reader').exists():
                profile.role = ROLE_READER
            profile.organization = profile.organization or organization
            profile.save()
            self.stdout.write(f'Профиль {user.username}: {profile.role}')

        self.stdout.write(self.style.SUCCESS('Роли настроены.'))
