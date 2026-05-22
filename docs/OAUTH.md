# OAuth / SSO (P3)

## Текущая реализация

- **Multi-tenancy:** модель `Organization`, профиль пользователя `UserProfile` с привязкой к организации.
- **Присоединение к организации:** `POST /api/auth/join-organization/` с телом `{"organization_slug": "default"}`.
- **Профиль:** `GET /api/auth/me/` — роль, организация, `can_edit`.
- **Провайдеры:** `GET /api/auth/providers/` — список OAuth-провайдеров, если заданы переменные окружения.

## Google OAuth (опционально)

Добавьте в `backend/.env`:

```env
GOOGLE_OAUTH_CLIENT_ID=your-client-id
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8000/api/auth/google/callback/
```

После настройки `GET /api/auth/providers/` вернёт URL для редиректа на Google.

> Полный callback-обмен кодом на JWT можно подключить через `django-allauth` или `mozilla-django-oidc` в следующей итерации.

## Роли

| Роль | Права |
|------|--------|
| Читатель (`reader`) | Только чтение |
| Редактор (`editor`) | CRUD статей и разделов |
| Администратор (`admin`) | Редактор + откат версий, смена организации |

Инициализация групп:

```bash
python manage.py setup_kb_roles
```
