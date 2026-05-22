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

## Callback (реализовано)

`GET /api/auth/google/callback/` — обмен `code` на JWT и редирект:

```
{FRONTEND_URL}/oauth/callback?access=...&refresh=...
```

Фронтенд сохраняет токены и перенаправляет на главную.

### Переменные

```env
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8000/api/auth/google/callback/
FRONTEND_URL=http://localhost:5173
```

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
