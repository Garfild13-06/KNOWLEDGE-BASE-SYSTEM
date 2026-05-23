# Анализ жизнеспособности проекта

Документ фиксирует фактическое состояние кодовой базы Knowledge Base System, выявленные пробелы и **минимальный план работ (MVP-Production)**, после которого продукт можно вывести в реальную эксплуатацию у первого заказчика.

> Состояние на момент анализа: ветка `main`, последний коммит `4a89c9e` (merge PR #57). Backend-тесты (`python manage.py test knowledge`) — **18/18 OK**. Frontend `npm run build` — **OK** (614 KB JS). `npm run lint` — **107 проблем (101 ошибка)**.

---

## 1. Что уже работает

| Слой | Готовность | Комментарий |
|------|------------|-------------|
| Модель данных | ✅ 90 % | `Organization`, `Section` (дерево), `Article` (status/slug/views), версии, комментарии, аудит, webhooks, embeddings, bookmarks |
| Аутентификация | ✅ 80 % | JWT (SimpleJWT), Google OAuth callback, `/api/auth/me/`, мульти-tenancy через `UserProfile.organization` |
| Контент | ✅ 85 % | CRUD статей и разделов, версионирование с откатом и diff, шаблоны (How-to / Incident / ADR), wiki-ссылки `[[...]]`, экспорт MD/HTML/ZIP |
| Поиск | ✅ 75 % | Полнотекстовый (PG SearchVector + fallback на `icontains`), фильтры, сниппеты, TF-косинус для «похожие» |
| UI | ✅ 70 % | React 18 + MUI 6, тёмная тема, дашборд, граф, OAuth-страница, дерево разделов в Sidebar |
| Опциональные фичи | ✅ 60 % | AI (OpenAI-совместимый клиент), webhooks (HMAC), audit log, sandbox-разделы, bookmarks, публичный портал (JSON) |
| Docker / CI | ✅ 65 % | Compose (db + backend + frontend nginx), отдельный LAN-overlay, GitHub Actions с тестами и сборкой фронта |

Базовый сценарий «логин → создать раздел → создать статью с шаблоном → опубликовать → найти → откатить версию» работоспособен и покрыт автотестами.

---

## 2. Сводка пробелов по серьёзности

| Серьёзность | Кол-во пунктов | Влияние |
|--------------|----------------|---------|
| **P0 — Блокирующие production** | 9 | Запуск в реальном окружении небезопасен / частично сломан |
| **P1 — Критические для жизнеспособности** | 11 | Рабочее использование возможно, но без них продукт «сырой» |
| **P2 — Качество, DX и масштабирование** | 12 | Долг, тормозящий развитие |
| **P3 — Косметика и улучшения** | 7 | Полировка UX |

Полный список — в разделах 3–6.

---

## 3. P0 — Блокирующие production

### 3.1. Безопасность

| ID | Проблема | Где | Что сделать |
|----|----------|-----|-------------|
| P0-1 | `DEBUG=True` по умолчанию в `backend/.env.example` и `settings.py`. Любая забытая переменная — утечка трейсбека. | `backend/backend/settings.py:22`, `backend/.env.example:2` | Сменить дефолт на `False`. В dev задавать явно. Добавить `SECURE_*` заголовки при `DEBUG=False`. |
| P0-2 | JWT access token живёт **1 день**, refresh — **2 дня**. Это инверсия (refresh должен быть длиннее) и удлиняет окно компрометации. | `backend/backend/settings.py:171-174` | Access ≈ 15–30 мин, refresh — 7–30 дней. Включить `BLACKLIST_AFTER_ROTATION` и `ROTATE_REFRESH_TOKENS`. |
| P0-3 | Нет rate-limiting на `/api/token/` (брут-форс) и общий троттлинг DRF. AI-троттлинг (`_AI_RATE_BUCKETS`) — словарь в памяти процесса, неработоспособен с `gunicorn --workers 3`. | `backend/knowledge/extra_views.py:54-66`, settings | Включить `DEFAULT_THROTTLE_CLASSES` DRF (anon/user/login). AI-троттлинг перенести на cache (Redis) или БД. |
| P0-4 | `GoogleOAuthCallbackView` редиректит на фронт с `access` и `refresh` **в query string** — токены попадают в историю браузера, Referer и логи прокси. | `backend/knowledge/auth_views.py:210-216` | Использовать httpOnly-cookie + одноразовый exchange-код, либо `postMessage` на странице callback. |
| P0-5 | `User.objects.make_random_password()` удалён в Django 5.x (на момент анализа метод существует, но deprecated). При обновлении Django сломается OAuth. | `backend/knowledge/auth_views.py:201` | Заменить на `secrets.token_urlsafe(32)` или `BaseUserManager().make_random_password()` с обёрткой. |
| P0-6 | Webhook secret хранится **в открытом виде** (`CharField`). Утечка БД = утечка всех webhook-секретов. | `backend/knowledge/models.py:188-196` | Хранить hash или зашифрованное значение (django-fernet). Минимум — `write_only` уже сделан в сериализаторе. |

### 3.2. Корректность поведения

| ID | Проблема | Где | Что сделать |
|----|----------|-----|-------------|
| P0-7 | `Article.is_published` имеет дефолт `True` и `status='published'`. Любая прямая `Article.objects.create(...)` без явного статуса автоматически публикует статью — это противоречит заявленному жизненному циклу `draft → in_review → published`. | `backend/knowledge/models.py:90-91` | Дефолт `is_published=False`, `status='draft'`. Явно публиковать через `perform_create` / `publish()`. Обновить миграцию + UI. |
| P0-8 | `ImportArticlesView` создаёт статьи через `Article.objects.create()`, минуя `perform_create` → **нет** версии, embedding, audit log и webhook-события. | `backend/knowledge/extra_views.py:328-343` | Вынести общую процедуру `create_article(...)` в сервис и вызывать из ViewSet и Import. |
| P0-9 | `KnowledgeBasePermission` не реализует `has_object_permission`. Помощники `section_access.user_has_section_write/read` написаны, но **нигде не подключены**. → object-level ACL заявлен (D4), но фактически отсутствует. Любой редактор организации может писать в любой раздел. | `backend/knowledge/permissions.py:43-49`, `backend/knowledge/section_access.py` | Внедрить `has_object_permission` в `SectionViewSet` и `ArticleViewSet`, фильтровать `get_queryset` через `filter_sections_for_user`. |

---

## 4. P1 — Критические для жизнеспособности

### 4.1. Эксплуатация и устойчивость

| ID | Проблема | Действие |
|----|----------|----------|
| P1-1 | `dispatch_webhook` — синхронный HTTP в request-цикле (`requests.post(timeout=10)`). Один зависший подписчик задерживает каждый CRUD на статью на 10 с × N. | Перевести на Celery/RQ + Redis или хотя бы `threading.Thread`. Добавить ретраи и dead-letter. |
| P1-2 | Backend-Dockerfile запускает gunicorn от **root**. Стандартный аудит безопасности это отметит. | Добавить `RUN useradd app && chown -R app /app` и `USER app`. Использовать multi-stage с минимальным образом. |
| P1-3 | Нет `.dockerignore` → в образ копируется `media/`, `__pycache__`, локальные `.env*`, `test_db.sqlite3`. | Добавить `backend/.dockerignore` и `frontend/.dockerignore`. |
| P1-4 | `docker-compose.yml`: переменные `${POSTGRES_*:-default}` интерполируются Compose из корневого `.env`, а не из `backend/.env` (env_file загружается **внутри** контейнера). Если пользователь сменит `DB_PASSWORD` только в `backend/.env`, БД создаётся со старым паролем — backend не подключится. | Перенести `POSTGRES_*` в корневой `.env` (или явно подставлять `${DB_PASSWORD}` в обоих местах). Документировать. |
| P1-5 | Нет HTTPS-инструкций, нет reverse-proxy шаблона (Caddy / Traefik / nginx + LE). `docs/DEPLOY.md` всего 90 строк и упоминает только локальный запуск. | Добавить `docs/DEPLOY.md` раздел про reverse-proxy, certbot/Caddy, и пример `docker-compose.prod.yml`. |
| P1-6 | Нет процедуры бэкапа PostgreSQL и медиа-файлов. Том `postgres_data` единственный, без снапшотов. | Скрипт `scripts/backup.sh` (`pg_dump` + tar `media`) и cron-пример. Раздел в DEPLOY.md. |
| P1-7 | Нет логирования и мониторинга. `LOGGING` в `settings.py` отсутствует — Django пишет в stdout дефолтным форматом. Нет request-id, нет интеграции с Sentry/OpenTelemetry. | Добавить структурированный JSON-логгер, `request_id` middleware, опциональный `SENTRY_DSN`. |

### 4.2. Функциональные пробелы

| ID | Проблема | Действие |
|----|----------|----------|
| P1-8 | `PublicDocsView` возвращает **JSON**, а не HTML. Для «публичного портала» (D5/E2 в roadmap) это бесполезно: нет SEO, sitemap, robots, OG-тегов, человекочитаемых URL. | Рендерить Django-шаблон `public_article.html` + `sitemap.xml` + `robots.txt`. Опционально — server-side рендеринг страницы фронтом. |
| P1-9 | `KnowledgeGraphView` строит N+1: для каждой статьи фильтрует уже извлечённый queryset по title. На 300 статьях — 300 SQL-запросов. | Один запрос → словарь `{title.lower(): article}`. |
| P1-10 | DRF без глобальной пагинации. `TreeSectionsView`, `/articles/`, `/sections/`, `AuditLog` отдают всё разом. | `DEFAULT_PAGINATION_CLASS = PageNumberPagination`, `PAGE_SIZE = 50`. Адаптировать фронт. |
| P1-11 | Семантический поиск использует TF-cosine на чистом Python. На org с >1000 статей — заметная задержка и плохая релевантность. | Подключить `pgvector` (миграция + ANN-индекс) и эмбеддинги OpenAI/локальной модели. Уже заявлено как Пакет B1. |

---

## 5. P2 — Качество кода, DX, тесты

| ID | Проблема | Действие |
|----|----------|----------|
| P2-1 | **Frontend lint полностью красный** (107 проблем). В CI не запускается. | Поправить `eslint.config.js` (jsx-runtime требует не импортировать `React`), убрать неиспользуемые импорты, добавить `process` в `globals.node`. Добавить `npm run lint` в CI. |
| P2-2 | **Нет фронтенд-тестов** вообще. Ни Vitest, ни Jest, ни Playwright. | Минимум: Vitest + RTL для критичных компонентов (Auth, ArticleDetails, поиск). Желательно Playwright e2e (E1 в roadmap). |
| P2-3 | Backend-тесты гоняются только на SQLite (`if 'test' in sys.argv`). Реальные сценарии (полнотекстовый PG-поиск, JSONB-настройки) не покрыты. | Доп. job в CI: тесты на PostgreSQL service container. |
| P2-4 | Нет тестов на: AI endpoints, экспорт ZIP, public portal, webhooks delivery, audit log, sandbox TTL, bookmarks, backlinks/wiki, organization isolation на запись, версии diff, restore с правами читателя. | Дописать 10–15 кейсов; покрытие должно быть ≥ 70 %. |
| P2-5 | `get_user_role()` для пользователя без `UserProfile` возвращает `ROLE_EDITOR` по умолчанию. Это эскалация прав для свежесозданных пользователей до того, как сработает signal. | Возвращать `ROLE_READER` или `None`. |
| P2-6 | Огромный bundle (614 KB gzipped 198 KB). В `package.json` одновременно установлены `tinymce`, `ckeditor5`, `ckeditor5-premium-features`, `jodit-react`, `bootstrap` — используется только TinyMCE. | Удалить неиспользуемые. Включить code-splitting для редактора (`React.lazy`). |
| P2-7 | `ArticleDetailsPage` загружает дерево хлебных крошек **рекурсивно** запросами (`fetchBreadcrumbs`). Для глубоких разделов — N запросов. | Backend endpoint `/sections/{id}/breadcrumbs/` или включить `path` в сериализатор. |
| P2-8 | `ArticleSerializer` отдаёт **полный HTML** статьи в листингах (`/articles/?section=`). На длинных статьях это лишний трафик. | Создать `ArticleListSerializer` без `content`, оставить полный только в retrieve. |
| P2-9 | Дубль роутов: `/articles/`, `/sections/`, `/uploads/`, `/tree_sections/`, `/docs/...` — на корне, остальное — под `/api/`. Несогласованно для клиентов и публичного API. | Перенести всё под `/api/v1/`, оставить алиасы со старых путей deprecated на 1–2 релиза. |
| P2-10 | `DEFAULT_PERMISSION_CLASSES` не задан — каждый view вынужден явно указывать `permission_classes`. Случайно созданный view откроется анонимно. | Установить дефолтом `IsAuthenticated`, явно `AllowAny` где нужно. |
| P2-11 | Нет `setup.cfg`/`pyproject.toml`, `ruff`/`black`/`isort`. Стиль не проверяется. | Добавить `ruff` + pre-commit + job в CI. |
| P2-12 | `requirements.txt` без верхней границы версий (например, `Django==5.1.5` зафиксирован, но `requests==2.32.3`). Ок. Но нет dev-requirements (тесты, линтеры). | Разделить `requirements.txt` и `requirements-dev.txt`, либо использовать `pip-tools`/`poetry`/`uv`. |

---

## 6. P3 — Полировка

1. README местами противоречив: dev-frontend на `:3000`, Docker — на `:5173`. Уточнить таблицу.
2. `OAUTH.md` показывает `.env` без `GOOGLE_OAUTH_CLIENT_SECRET` в первом примере — кто-то скопирует и не настроит callback.
3. `admin.py` регистрирует только `Section` и `Article`. Нет `Organization`, `UserProfile`, `ArticleVersion`, `WebhookSubscription`, `AuditLog`, `SectionPermission` — администрирование возможно только через ORM/shell.
4. `PUBLIC_PORTAL` страница на фронте отсутствует (роут `/docs/...` обрабатывает только бэкенд).
5. `Header.jsx` не показывает признак «черновик/ревью» в навигации; шильдик статуса есть только на странице статьи.
6. На странице 404 нет кастомного шаблона.
7. Нет favicon-набора (есть `index.html`, но `public/` минимальный).

---

## 7. План работ — путь к жизнеспособности

Минимальный набор, после которого продукт можно отдавать первому реальному заказчику. Разбит на три волны; пакеты A–F из существующего roadmap **не отменяются** — но без выполнения пунктов ниже их добавление преждевременно.

### Волна V1 «Production-safety» (закрывает все P0)

Технически: правки в 1 backend-приложении + конфиги, без новых сервисов.

1. **Безопасные дефолты** (P0-1, P0-2, P0-10): `DEBUG=False`, ужесточить JWT, добавить `SECURE_*` (HSTS, content-type, X-Frame), CSRF для admin.
2. **OAuth callback через httpOnly-cookie** (P0-4) + замена `make_random_password` (P0-5).
3. **Жизненный цикл статьи** (P0-7): дефолт draft, миграция, обновить UI и тесты.
4. **Единый `create_article` сервис** (P0-8): импорт, ViewSet и API создают статьи одинаково.
5. **Object-level ACL** (P0-9): `has_object_permission`, фильтрация `get_queryset`, тесты на чужой раздел.
6. **Throttling** (P0-3): DRF-троттлы для anon/user/login + Redis-бэкенд для AI-лимита.
7. **Webhook secret hashing** (P0-6).

Готовность: все P0 закрыты, тесты дополнены кейсами на безопасность, CI зелёный. После этой волны проект безопасен для боевой эксплуатации одной организации.

### Волна V2 «Operability» (закрывает P1)

Подключает новые системные компоненты, но не меняет UX.

1. **Celery/RQ + Redis** (P1-1) для webhooks и AI-троттлинга. Добавить service в `docker-compose.yml`.
2. **Hardened Docker** (P1-2, P1-3): non-root, `.dockerignore`, multi-stage backend.
3. **Production compose + reverse-proxy** (P1-5): `docker-compose.prod.yml`, Caddy/Traefik с автоматическим Let's Encrypt, обновлённый `DEPLOY.md`.
4. **Бэкапы** (P1-6): скрипт + cron + раздел в DEPLOY.md.
5. **Логи и Sentry** (P1-7): `LOGGING` JSON, request-id middleware, опциональный `SENTRY_DSN`.
6. **Compose env-fix** (P1-4): убрать рассинхрон `POSTGRES_*` ↔ `DB_PASSWORD`.
7. **Публичный портал HTML** (P1-8): рендеринг шаблона, `sitemap.xml`, `robots.txt`.
8. **Граф O(N)** (P1-9), пагинация DRF (P1-10).

Готовность: проект разворачивается одной командой на чистом VPS с HTTPS, делает ежедневные бэкапы, шлёт ошибки в Sentry. Можно подписывать SLA.

### Волна V3 «Quality bar» (закрывает приоритетные P2)

1. **Frontend lint в CI** (P2-1) и его прохождение.
2. **Backend-тесты на PostgreSQL** в CI (P2-3) + дописать пробелы (P2-4).
3. **Frontend Vitest + Playwright e2e** (P2-2) — login, CRUD, поиск, откат.
4. **Bundle-чистка** (P2-6): убрать ckeditor5/jodit/bootstrap, lazy-load TinyMCE → ожидаемо −40 % JS.
5. **API под `/api/v1/`** (P2-9) и `ArticleListSerializer` (P2-8) — для совместимости с будущими интеграциями.
6. **`ruff`/`black`/`pre-commit`** (P2-11).

Готовность: проект пригоден для роста команды разработки и подключения внешних интеграторов.

### Волна V4 — далее по существующему roadmap

После V1–V3 имеет смысл возвращаться к Пакетам B (pgvector), C (RAG), D (коллаборация и интеграции), F (граф/sandbox/геймификация). До этого их добавление будет «строительством на песке».

---

## 8. Оценка трудоёмкости (без календаря)

| Волна | Объём правок | Подсистемы | Зависимости |
|-------|--------------|-------------|-------------|
| V1 | ~1500 строк (3–5 PR) | settings, permissions, models, migrations, viewsets, tests | Только Django/DRF; новых сервисов не требует |
| V2 | ~2000 строк + Compose/инфра (4–6 PR) | docker, celery, redis, шаблоны, sentry, public portal | Появляются Redis и Celery worker как обязательные сервисы |
| V3 | ~1000 строк + конфиги (3–4 PR) | CI, lint, тесты, bundle | Зависит от стабильности V1/V2 |

«Минимальная коммерческая жизнеспособность» наступает по завершении **V1 + V2** (пп. 1–8 в каждой). V3 повышает уверенность в долгосрочной поддержке.

---

## 9. Риски, не закрываемые этим планом

- Нет **multi-region** репликации БД и нет stateless-frontend cache → одна точка отказа.
- Нет **rate-limiting на уровне инфры** (только DRF). При DDoS DRF не спасёт.
- TinyMCE — **проприетарная** зависимость, без `VITE_TINYMCE_API_KEY` редактор покажет водяной знак. Для on-prem заказчика стоит рассмотреть self-hosted-сборку или замену на TipTap.
- Нет **GDPR/152-ФЗ инструментов**: экспорт данных пользователя, удаление по запросу, политика хранения.
- Нет **формализованной модели угроз** (STRIDE/LINDDUN) — рекомендуется провести до запуска у внешнего заказчика.

Эти риски следует закрывать после V1–V3 в зависимости от профиля заказчика.
