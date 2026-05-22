# Production-деплой Knowledge Base System

## Быстрый старт (Docker)

### 1. Переменные окружения

```bash
cp backend/.env.example backend/.env
```

Заполните минимум:

```env
SECRET_KEY=<длинный-случайный-ключ>
DEBUG=False
ALLOWED_HOSTS=your-domain.com,backend
DB_HOST=db
DB_PASSWORD=<надёжный-пароль>
CORS_ALLOWED_ORIGINS=https://your-domain.com
FRONTEND_URL=https://your-domain.com
```

Корневой `.env` для Docker Compose:

```env
POSTGRES_USER=kb_admin
POSTGRES_PASSWORD=<тот-же-пароль>
POSTGRES_DB=knowledge_base
VITE_TINYMCE_API_KEY=<ключ-tinymce>
```

### 2. Запуск

```bash
docker compose up --build -d
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Админка: http://localhost:8000/admin/

### 3. Первый администратор

```bash
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py setup_kb_roles
```

Назначьте пользователю группу **KB Admin** в админке или установите `role=admin` в UserProfile.

## Google OAuth (опционально)

1. Создайте OAuth Client в [Google Cloud Console](https://console.cloud.google.com/).
2. Redirect URI: `https://your-domain.com/api/auth/google/callback/`
3. В `backend/.env`:

```env
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URI=https://your-domain.com/api/auth/google/callback/
FRONTEND_URL=https://your-domain.com
```

Подробнее: [docs/OAUTH.md](./OAUTH.md)

## CI

GitHub Actions (`.github/workflows/ci.yml`) запускает:

- `python manage.py test knowledge`
- `npm run build` (frontend)

## Миграции при обновлении

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py setup_kb_roles
```

## Цепочка PR для мержа

| PR | Волна |
|----|-------|
| #20 | P1 — безопасность, JWT, env |
| #21 | P2 — поиск, метаданные, CI |
| #22 | P3 — версии, роли, multi-tenancy |

Рекомендуется смержить **#22** в `main` (содержит все волны).
