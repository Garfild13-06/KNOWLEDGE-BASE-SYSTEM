# Knowledge Base System

Корпоративная база знаний: дерево разделов, статьи с rich-text (TinyMCE), поиск, версии, роли, изоляция по организациям и набор опциональных возможностей (AI, семантика, публичный портал).

**Стек:** Django 5 · DRF · JWT · PostgreSQL · React 18 · Vite · MUI · Docker Compose

**Репозиторий:** [Garfild13-06/KNOWLEDGE-BASE-SYSTEM](https://github.com/Garfild13-06/KNOWLEDGE-BASE-SYSTEM)

---

## Содержание

- [Быстрый старт (Docker)](#быстрый-старт-docker)
- [Возможности](#возможности)
- [Интерфейс](#интерфейс)
- [Локальная разработка](#локальная-разработка)
- [Аутентификация](#аутентификация)
- [Роли](#роли)
- [API](#api)
- [Переменные окружения](#переменные-окружения)
- [Структура проекта](#структура-проекта)
- [Документация](#документация)

---

## Быстрый старт (Docker)

**Нужно:** [Docker](https://www.docker.com/) и Docker Compose v2.

### 1. Клонирование и конфигурация

```bash
git clone https://github.com/Garfild13-06/KNOWLEDGE-BASE-SYSTEM.git
cd KNOWLEDGE-BASE-SYSTEM

cp backend/.env.example backend/.env
cp .env.example .env
```

В `backend/.env` обязательно задайте:

```env
SECRET_KEY=длинный-случайный-ключ
DB_PASSWORD=надёжный-пароль
```

Остальное можно оставить по умолчанию для локального запуска.

### 2. Запуск

```bash
docker compose up --build -d
docker compose ps
curl -s http://localhost:8000/api/health/
```

Ожидаемый ответ health: `{"status":"ok","database":true,...}`.

### 3. Первый пользователь

```bash
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py setup_kb_roles
```

### Адреса

| Сервис | URL |
|--------|-----|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:8000 |
| **Health** | http://localhost:8000/api/health/ |
| **Django Admin** | http://localhost:8000/admin/ |

Остановка: `docker compose down`. Данные PostgreSQL сохраняются в volume `postgres_data`.

### Тестирование в локальной сети (LAN)

Скрипт поднимает проект на `0.0.0.0`, отключает ограничения CORS и создаёт тестовых пользователей. Доступ с телефона/другого ПК в той же Wi‑Fi/LAN — по IP компьютера-хоста.

```bash
chmod +x scripts/run-lan-test.sh
./scripts/run-lan-test.sh
```

| Логин | Пароль | Роль |
|-------|--------|------|
| `kb_admin` | `admin123` | Администратор |
| `kb_editor` | `editor123` | Редактор |
| `kb_reader` | `reader123` | Читатель |

- Остановка: `./scripts/run-lan-test.sh --stop`
- Режим без Docker (dev): `./scripts/run-lan-test.sh --dev`
- Конфиг генерируется в `backend/.env.lan` (в `.gitignore`)

**Только для локальной сети.** Не используйте в production и не открывайте порты в интернет.

Подробный production-гайд: [docs/DEPLOY.md](docs/DEPLOY.md)

---

## Возможности

### Базовые (всегда доступны)

| Область | Описание |
|---------|----------|
| **Контент** | Иерархия разделов, статьи с TinyMCE, вложения, хлебные крошки |
| **Поиск** | По заголовку и тексту, фильтры: раздел, автор, даты |
| **Версии** | История изменений, откат к прошлой версии, diff двух версий |
| **Доступ** | JWT, роли (читатель / редактор / администратор), гостевое чтение опубликованного |
| **Организации** | Multi-tenancy: данные изолированы по `Organization` |
| **OAuth** | Google (при настройке `GOOGLE_OAUTH_*`) |
| **Безопасность** | DOMPurify на фронте, лимиты upload, CORS и `DEBUG` из env |

### Расширенные (пакеты A–F, см. [docs/PACKAGES.md](docs/PACKAGES.md))

| Область | Описание | Включение |
|---------|----------|-----------|
| **UX** | Тёмная тема, черновики и публикация, шаблоны (How-to, Incident, ADR), wiki `[[статья]]`, экспорт MD/HTML, дашборд | всегда в UI |
| **Умный поиск** | Похожие статьи, семантический endpoint | `KB_ENABLE_SEMANTIC_SEARCH=true` |
| **AI** | Суммаризация, RAG «спроси базу», линтер качества | `KB_ENABLE_AI=true` + `OPENAI_API_KEY` |
| **Коллаборация** | Комментарии, ревью (`draft` → `in_review` → `published`), webhooks, batch-импорт | webhooks — роль admin |
| **Публичный портал** | Статичные статьи без JWT | `section.is_public=true` + опубликованная статья |
| **Инфра** | Health, audit log, CI (backend + frontend build) | `/api/health/`, `/api/audit/` |
| **Креатив** | Граф связей, закладки, песочница с TTL | `KB_ENABLE_GRAPH_VIEW`, `KB_SANDBOX_TTL_HOURS` |

Тяжёлые функции (**AI**, семантика, геймификация) по умолчанию **выключены** — включаются только через переменные окружения или `Organization.settings` в JSON.

### Жизненный цикл статьи

| `status` | Кто видит | Действия редактора |
|----------|-----------|-------------------|
| `draft` | Автор и редакторы | Редактирование, «На ревью», «Опубликовать» |
| `in_review` | Редакторы | Правки, публикация |
| `published` | Все (в т.ч. гости) | Обычный просмотр |

Гости и читатели видят только `is_published=true` и `status=published`.

---

## Интерфейс

| Страница | Путь | Назначение |
|----------|------|------------|
| Папки + дашборд | `/` | Обзор: недавние, популярные, черновики |
| Раздел | `/sections/:id` | Подразделы и статьи, создание с шаблоном |
| Статья | `/articles/:id` | Просмотр, версии, комментарии, экспорт, AI (если включён) |
| Все статьи | `/articles` | Список |
| Граф | `/graph` | Связи по wiki-ссылкам (если `enable_graph_view`) |
| Вход | `/login` | JWT и OAuth |

Переключатель **светлая / тёмная тема** — в шапке (сохраняется в `localStorage`).

---

## Локальная разработка

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# DB_HOST=localhost и пароль PostgreSQL, либо только db в Docker:
# docker compose up -d db

python manage.py migrate
python manage.py setup_kb_roles
python manage.py createsuperuser
python manage.py runserver
```

Тесты (SQLite, без PostgreSQL):

```bash
SECRET_KEY=test DEBUG=True python manage.py test knowledge -v 2
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL пустой — работает proxy Vite
npm run dev            # http://localhost:3000
```

Прокси dev-сервера: `/api`, `/sections`, `/articles`, `/tree_sections`, `/uploads`, `/docs` → `http://localhost:8000`.

Сборка:

```bash
npm run build
```

### CI

При push и PR на `main` / `cursor/**` запускается [.github/workflows/ci.yml](.github/workflows/ci.yml): backend-тесты и `npm run build`.

---

## Аутентификация

### JWT (логин / пароль)

```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your-password"}'
```

Ответ: `access`, `refresh`. Заголовок для защищённых запросов:

```http
Authorization: Bearer <access_token>
```

Обновление access:

```bash
curl -X POST http://localhost:8000/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "<refresh_token>"}'
```

### Профиль и флаги возможностей

```bash
curl http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer <access_token>"
```

В ответе: `role`, `can_edit`, `is_admin`, `organization`, **`features`** (`enable_ai`, `enable_semantic_search`, …).

Присоединение к организации:

```bash
curl -X POST http://localhost:8000/api/auth/join-organization/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"organization_slug": "default"}'
```

### Google OAuth

1. OAuth Client в [Google Cloud Console](https://console.cloud.google.com/).
2. В `backend/.env`:

```env
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8000/api/auth/google/callback/
FRONTEND_URL=http://localhost:5173
```

3. На странице входа — «Войти через Google».

Подробнее: [docs/OAUTH.md](docs/OAUTH.md)

---

## Роли

| Роль | Права |
|------|--------|
| **Читатель** | Просмотр опубликованного контента |
| **Редактор** | Создание и редактирование, черновики, комментарии |
| **Администратор** | Всё выше + webhooks, audit log, откат версий |

Группы Django: `KB Reader`, `KB Editor`, `KB Admin`.

```bash
python manage.py setup_kb_roles
# или в Docker:
docker compose exec backend python manage.py setup_kb_roles
```

---

## API

Базовый URL: `http://localhost:8000`  
Формат: JSON. Чтение разделов/статей — без токена (с фильтром по публикации). Запись — JWT + роль редактор+.

### Разделы

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/sections/` | Список (`?parent=<id>`) |
| `POST` | `/sections/` | Создать (JWT, редактор+) |
| `GET/PUT/PATCH/DELETE` | `/sections/{id}/` | CRUD |
| `GET` | `/sections/{id}/export/` | ZIP с Markdown статей раздела |
| `GET` | `/tree_sections/` | Полное дерево |

Поля раздела: `name`, `description`, `parent`, `is_public`, `expires_at` (песочница).

### Статьи

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/articles/` | Список (`?section=`, `?status=` для редакторов) |
| `POST` | `/articles/` | Создать |
| `GET/PUT/PATCH/DELETE` | `/articles/{id}/` | CRUD (+ счётчик просмотров на GET) |
| `GET` | `/articles/search/?q=` | Поиск (мин. 2 символа, фильтры `section`, `author`, `date_from`, `date_to`) |
| `GET` | `/articles/{id}/versions/` | История версий |
| `POST` | `/articles/{id}/restore/` | Откат: `{"version_id": 3}` |
| `GET` | `/articles/{id}/version-diff/?from=&to=` | Diff двух версий |
| `POST` | `/articles/{id}/publish/` | Опубликовать |
| `POST` | `/articles/{id}/submit-review/` | Отправить на ревью |
| `GET` | `/articles/{id}/export/?format=markdown\|html` | Экспорт |
| `GET` | `/articles/{id}/backlinks/` | Обратные и исходящие wiki-ссылки |
| `GET` | `/articles/{id}/similar/` | Похожие (нужен `KB_ENABLE_SEMANTIC_SEARCH`) |
| `GET/POST` | `/articles/{id}/comments/` | Комментарии |
| `POST` | `/articles/{id}/bookmark/` | Закладка: `{"bookmarked": true}` |

Поля статьи: `title`, `slug`, `content`, `section`, `status`, `is_published`, `template_key`, `view_count`, …

**Пример черновика:**

```bash
curl -X POST http://localhost:8000/articles/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "How-to deploy",
    "content": "<p>Шаги...</p>",
    "section": 1,
    "status": "draft",
    "template_key": "howto"
  }'
```

### Сервисные endpoints

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/health/` | Состояние сервиса и БД |
| `GET` | `/api/dashboard/` | Дашборд (недавние, популярные, черновики, …) |
| `GET` | `/api/templates/` | Шаблоны статей |
| `GET` | `/api/search/semantic/?q=` | Семантический поиск (флаг env) |
| `POST` | `/api/ai/` | AI: `action`: `summarize`, `rag`, `draft`, `lint` |
| `POST` | `/api/import/` | Batch-импорт: `section_id`, `articles[]` |
| `GET` | `/api/graph/` | Узлы и рёбра графа wiki |
| `POST` | `/api/sandbox/` | Временный раздел (TTL из env) |
| `GET` | `/api/audit/` | Журнал аудита (admin) |
| `GET/POST/...` | `/webhooks/` | Подписки на события (admin) |
| `GET` | `/docs/{org_slug}/{article_slug}/` | Публичная статья (без JWT) |

### Auth и загрузки

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/api/token/` | Получить JWT |
| `POST` | `/api/token/refresh/` | Обновить access |
| `GET` | `/api/auth/me/` | Текущий пользователь + `features` |
| `GET` | `/api/auth/providers/` | OAuth-провайдеры |
| `GET` | `/api/auth/google/callback/` | Callback Google → редирект на фронт |
| `POST` | `/uploads/` | Загрузка файлов в редактор (JWT, редактор+) |

**AI (пример суммаризации):**

```bash
curl -X POST http://localhost:8000/api/ai/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"action": "summarize", "article_id": 1}'
```

---

## Переменные окружения

Шаблоны: [backend/.env.example](backend/.env.example), [.env.example](.env.example) (Docker Compose), [frontend/.env.example](frontend/.env.example).

### Backend (основные)

| Переменная | Назначение | По умолчанию |
|------------|------------|--------------|
| `SECRET_KEY` | Секрет Django | — (обязательно) |
| `DEBUG` | Режим отладки | `True` |
| `ALLOWED_HOSTS` | Хосты через запятую | `localhost,...` |
| `DB_ENGINE`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | PostgreSQL | см. `.env.example` |
| `CORS_ALLOWED_ORIGINS` | Origins фронтенда | локальные dev |
| `GOOGLE_OAUTH_*`, `FRONTEND_URL` | OAuth Google | опционально |

### Флаги возможностей (`KB_*`)

| Переменная | Назначение | По умолчанию |
|------------|------------|--------------|
| `KB_ENABLE_AI` | AI-ассистент | `false` |
| `KB_ENABLE_SEMANTIC_SEARCH` | Похожие статьи / семантика | `false` |
| `KB_ENABLE_GAMIFICATION` | Очки на дашборде | `false` |
| `KB_ENABLE_GRAPH_VIEW` | Страница «Граф» | `true` в Docker |
| `KB_ENABLE_PUBLIC_PORTAL` | Публичный `/docs/...` | `true` |
| `KB_SANDBOX_TTL_HOURS` | TTL песочницы | `72` |
| `OPENAI_API_KEY` | Ключ OpenAI-совместимого API | — |
| `OPENAI_MODEL` | Модель | `gpt-4o-mini` |
| `OPENAI_BASE_URL` | Base URL API | `https://api.openai.com/v1` |

Переопределение на уровне организации: поле `Organization.settings` (JSON), например `{"enable_ai": true}`.

### Frontend (сборка)

| Переменная | Назначение |
|------------|------------|
| `VITE_API_URL` | Базовый URL API (`/` в Docker/nginx) |
| `VITE_TINYMCE_API_KEY` | Ключ TinyMCE Cloud |

---

## Структура проекта

```
KNOWLEDGE-BASE-SYSTEM/
├── backend/
│   ├── knowledge/
│   │   ├── models.py          # Organization, Section, Article, версии, комментарии, …
│   │   ├── views.py           # REST: разделы, статьи
│   │   ├── extra_views.py     # dashboard, health, AI, graph, …
│   │   ├── features.py        # флаги KB_* и org.settings
│   │   ├── search.py          # полнотекстовый поиск
│   │   ├── semantic.py        # эмбеддинги TF-cosine
│   │   ├── ai_service.py      # OpenAI (опционально)
│   │   └── migrations/
│   ├── backend/               # settings, urls
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/        # поиск, дашборд, ArticleExtras, …
│   │   ├── contexts/          # Auth, Theme, Folders, ViewType
│   │   └── pages/
│   └── Dockerfile + nginx.conf
├── docs/
│   ├── DEPLOY.md
│   ├── OAUTH.md
│   ├── ROADMAP.md             # волны P1–P3
│   └── PACKAGES.md            # пакеты A–F
├── .github/workflows/ci.yml
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Документация

| Файл | Содержание |
|------|------------|
| [docs/DEPLOY.md](docs/DEPLOY.md) | Production-деплой |
| [docs/OAUTH.md](docs/OAUTH.md) | Google OAuth / SSO |
| [docs/ROADMAP.md](docs/ROADMAP.md) | История волн P1–P3 |
| [docs/PACKAGES.md](docs/PACKAGES.md) | Пакеты доработок A–F (Issues #23–#56) |
| [scripts/run-lan-test.sh](scripts/run-lan-test.sh) | Запуск для тестов в LAN |
| [backend/.env.lan.example](backend/.env.lan.example) | Шаблон env для LAN-режима |

---

## Как внести вклад

1. Ветка: `git checkout -b feature/my-feature`
2. Тесты: `python manage.py test knowledge` и `npm run build`
3. Pull Request в [репозиторий](https://github.com/Garfild13-06/KNOWLEDGE-BASE-SYSTEM)

---

## Лицензия

Open Source.
