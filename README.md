# Knowledge Base System

Веб-приложение для корпоративной базы знаний: иерархия разделов, статьи с rich-text, поиск, версии, роли и изоляция по организациям.

**Стек:** Django 5 + DRF + PostgreSQL · React 18 + Vite + MUI · Docker Compose · JWT

---

## Возможности

| Область | Что умеет |
|---------|-----------|
| **Контент** | Разделы (дерево), статьи с TinyMCE, вложения, хлебные крошки |
| **Поиск** | Глобальный поиск по заголовку и тексту, фильтры (раздел, автор, даты) |
| **Версии** | История изменений статьи, просмотр и откат к прошлой версии |
| **Доступ** | JWT, роли (читатель / редактор / администратор), гостевое чтение |
| **Организации** | Multi-tenancy: данные изолированы по `Organization` |
| **OAuth** | Вход через Google (опционально, при настройке env) |
| **Безопасность** | DOMPurify для HTML, защита upload, CORS и DEBUG из переменных окружения |

---

## Быстрый старт (Docker)

**Требования:** [Docker](https://www.docker.com/) и Docker Compose.

```bash
git clone https://github.com/Garfild13-06/KNOWLEDGE-BASE-SYSTEM.git
cd KNOWLEDGE-BASE-SYSTEM

cp backend/.env.example backend/.env
# Заполните SECRET_KEY, DB_PASSWORD и при необходимости VITE_TINYMCE_API_KEY

docker compose up --build -d
```

| Сервис | URL |
|--------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Админка Django | http://localhost:8000/admin/ |

**Первый вход:**

```bash
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py setup_kb_roles
```

Подробный production-гайд: [docs/DEPLOY.md](docs/DEPLOY.md)

---

## Локальная разработка

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # настройте PostgreSQL или используйте Docker для db

python manage.py migrate
python manage.py setup_kb_roles
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env              # VITE_API_URL оставьте пустым — работает vite proxy
npm run dev                       # http://localhost:3000
```

Прокси Vite перенаправляет `/api`, `/sections`, `/articles` и др. на `http://localhost:8000`.

### Тесты и CI

```bash
cd backend && python manage.py test knowledge
cd frontend && npm run build
```

CI: [.github/workflows/ci.yml](.github/workflows/ci.yml)

---

## Аутентификация

### Логин / пароль (JWT)

```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your-password"}'
```

Ответ: `access` и `refresh`. Для запросов с правом записи:

```http
Authorization: Bearer <access_token>
```

### Профиль и организация

```bash
curl http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer <access_token>"
```

Присоединение к организации:

```bash
curl -X POST http://localhost:8000/api/auth/join-organization/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"organization_slug": "default"}'
```

### Google OAuth

1. Настройте OAuth Client в Google Cloud Console.
2. Добавьте в `backend/.env`:

```env
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8000/api/auth/google/callback/
FRONTEND_URL=http://localhost:5173
```

3. На странице входа появится кнопка **«Войти через Google»**.

Детали: [docs/OAUTH.md](docs/OAUTH.md)

---

## Роли

| Роль | Права |
|------|--------|
| **Читатель** | Просмотр разделов и статей |
| **Редактор** | Создание и редактирование контента |
| **Администратор** | Всё выше + откат версий |

Группы Django: `KB Reader`, `KB Editor`, `KB Admin`. Синхронизация с профилем:

```bash
python manage.py setup_kb_roles
```

---

## API (основное)

Базовый URL: `http://localhost:8000`

### Разделы и статьи

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/sections/` | Список разделов (`?parent=<id>` — дочерние) |
| `POST` | `/sections/` | Создать раздел (нужен JWT, роль редактор+) |
| `GET` | `/sections/{id}/` | Раздел с `description`, метаданными |
| `GET` | `/tree_sections/` | Дерево всех разделов |
| `GET` | `/articles/` | Статьи (`?section=<id>`) |
| `POST` | `/articles/` | Создать статью |
| `GET` | `/articles/{id}/` | Статья |
| `PUT` | `/articles/{id}/` | Обновить (создаётся версия в истории) |
| `DELETE` | `/articles/{id}/` | Удалить |

### Поиск

```http
GET /articles/search/?q=docker&section=1&author=admin&date_from=2025-01-01&date_to=2025-12-31
```

Минимум 2 символа в `q`. Ответ: `{ "results": [...], "query": "...", "count": N }`.

### Версии статьи

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/articles/{id}/versions/` | Список версий |
| `POST` | `/articles/{id}/restore/` | Откат: `{"version_id": 3}` |

### Прочее

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/api/token/` | Получить JWT |
| `POST` | `/api/token/refresh/` | Обновить access |
| `GET` | `/api/auth/me/` | Текущий пользователь |
| `GET` | `/api/auth/providers/` | Доступные OAuth-провайдеры |
| `POST` | `/uploads/` | Загрузка изображений для редактора (JWT) |

**Пример создания статьи:**

```bash
curl -X POST http://localhost:8000/articles/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Новая статья", "content": "<p>Текст</p>", "section": 1}'
```

---

## Переменные окружения

Шаблон: [backend/.env.example](backend/.env.example), [frontend/.env.example](frontend/.env.example)

| Переменная | Назначение |
|------------|------------|
| `SECRET_KEY` | Секрет Django |
| `DEBUG` | `True` / `False` |
| `ALLOWED_HOSTS` | Список хостов через запятую |
| `DB_*` | Подключение к PostgreSQL |
| `CORS_ALLOWED_ORIGINS` | Origins для фронтенда |
| `VITE_API_URL` | Базовый URL API при сборке фронта (`/` для Docker) |
| `VITE_TINYMCE_API_KEY` | Ключ редактора TinyMCE |
| `GOOGLE_OAUTH_*` | OAuth (опционально) |
| `FRONTEND_URL` | URL фронта для редиректа после OAuth |

---

## Структура проекта

```
KNOWLEDGE-BASE-SYSTEM/
├── backend/
│   ├── knowledge/           # Модели, API, permissions, search, versioning
│   ├── backend/             # settings, urls
│   ├── manage.py
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # UI, поиск, история версий
│   │   ├── contexts/        # Auth, Folders, ViewType
│   │   ├── pages/
│   │   └── services/        # api, articles, auth
│   └── Dockerfile
├── docs/
│   ├── DEPLOY.md            # Production-деплой
│   ├── OAUTH.md             # Настройка Google OAuth
│   └── ROADMAP.md           # Roadmap и статус волн P1–P3
├── .github/workflows/ci.yml
├── docker-compose.yml
└── README.md
```

---

## Документация

- [docs/DEPLOY.md](docs/DEPLOY.md) — деплой в production
- [docs/OAUTH.md](docs/OAUTH.md) — OAuth / SSO
- [docs/ROADMAP.md](docs/ROADMAP.md) — статус волн P1–P3
- [docs/PACKAGES.md](docs/PACKAGES.md) — **пакеты доработок A–F** (следующий этап)

---

## Как внести вклад

1. Создайте ветку: `git checkout -b feature/my-feature`
2. Внесите изменения и убедитесь, что проходят тесты.
3. Откройте Pull Request в [репозиторий](https://github.com/Garfild13-06/KNOWLEDGE-BASE-SYSTEM).

---

## Лицензия

Open Source.
