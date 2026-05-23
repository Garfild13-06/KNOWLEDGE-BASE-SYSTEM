from django.contrib.auth.models import Group, User
from django.core.management.base import BaseCommand

from knowledge.constants import ROLE_ADMIN, ROLE_EDITOR, ROLE_READER
from knowledge.models import UserProfile
from knowledge.tenancy import get_default_organization

LAN_TEST_USERS = [
    {
        'username': 'kb_admin',
        'password': 'admin123',
        'role': ROLE_ADMIN,
        'group': 'KB Admin',
        'email': 'admin@lan.test',
    },
    {
        'username': 'kb_editor',
        'password': 'editor123',
        'role': ROLE_EDITOR,
        'group': 'KB Editor',
        'email': 'editor@lan.test',
    },
    {
        'username': 'kb_reader',
        'password': 'reader123',
        'role': ROLE_READER,
        'group': 'KB Reader',
        'email': 'reader@lan.test',
    },
]


class Command(BaseCommand):
    help = 'Создаёт тестовых пользователей для проверки в локальной сети (LAN)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset-passwords',
            action='store_true',
            help='Сбросить пароли существующих тестовых пользователей',
        )

    def handle(self, *args, **options):
        organization = get_default_organization()
        reset = options['reset_passwords']

        for spec in LAN_TEST_USERS:
            group, _ = Group.objects.get_or_create(name=spec['group'])
            user, created = User.objects.get_or_create(
                username=spec['username'],
                defaults={'email': spec['email']},
            )
            if created or reset:
                user.set_password(spec['password'])
                user.save()
            user.groups.clear()
            user.groups.add(group)

            profile, _ = UserProfile.objects.get_or_create(
                user=user,
                defaults={'organization': organization, 'role': spec['role']},
            )
            profile.organization = organization
            profile.role = spec['role']
            profile.save()

            action = 'создан' if created else 'обновлён'
            self.stdout.write(
                self.style.SUCCESS(
                    f"{spec['username']} ({spec['role']}) — {action}, пароль: {spec['password']}"
                )
            )

        self.stdout.write(self.style.WARNING('Только для локального тестирования. Не используйте в production.'))
