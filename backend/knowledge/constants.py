ROLE_READER = 'reader'
ROLE_EDITOR = 'editor'
ROLE_ADMIN = 'admin'

ROLE_CHOICES = [
    (ROLE_READER, 'Читатель'),
    (ROLE_EDITOR, 'Редактор'),
    (ROLE_ADMIN, 'Администратор'),
]

ROLE_HIERARCHY = {
    ROLE_READER: 1,
    ROLE_EDITOR: 2,
    ROLE_ADMIN: 3,
}

DEFAULT_ORG_SLUG = 'default'
DEFAULT_ORG_NAME = 'Основная организация'
