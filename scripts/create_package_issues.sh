#!/bin/bash
# Создаёт GitHub Issues для пакетов A–F.
set -euo pipefail

create_issue() {
  local title="$1"
  local body="$2"
  local labels="${3:-enhancement}"
  gh issue create --title "$title" --body "$body" --label "$labels"
}

# Метки package-* можно добавить вручную в GitHub (Settings → Labels)
DEFAULT_LABEL="enhancement"

echo "=== Пакет A ==="
create_issue "[Пакет A1] Тёмная тема" \
"MUI light/dark, переключатель в Header, сохранение предпочтения.

**Критерии:** тема применяется ко всему приложению; после перезагрузки выбор сохранён." \
"$DEFAULT_LABEL"

create_issue "[Пакет A2] Черновики и публикация статей" \
"Поле \`is_published\`, кнопки «Сохранить черновик» / «Опубликовать». Читатели и гости видят только опубликованные.

**Критерии:** фильтр в API; UI-индикатор статуса на карточках." \
"$DEFAULT_LABEL"

create_issue "[Пакет A3] Шаблоны статей (How-to, Incident, ADR)" \
"Выбор шаблона при создании → презаполненный TinyMCE + подсказки по разделам.

**Критерии:** минимум 3 шаблона; можно начать с пустого." \
"$DEFAULT_LABEL"

create_issue "[Пакет A4] Wiki-ссылки и backlinks" \
"Синтаксис \`[[название статьи]]\`, автолинк при сохранении, страница «Кто ссылается».

**Критерии:** битые ссылки подсвечиваются; обратные ссылки на странице статьи." \
"$DEFAULT_LABEL"

create_issue "[Пакет A5] Экспорт Markdown и PDF" \
"Экспорт одной статьи или zip раздела (MD + вложения).

**Критерии:** кнопка на странице статьи и в меню раздела." \
"$DEFAULT_LABEL"

create_issue "[Пакет A6] Дашборд на главной" \
"Виджеты: недавние, часто открываемые, устаревшие (>90 дней), мои черновики.

**Критерии:** данные из API; персонализация для авторизованных." \
"$DEFAULT_LABEL"

echo "=== Пакет B ==="
create_issue "[Пакет B1] Семантический поиск (pgvector)" \
"Эмбеддинги \`content_plain\`, индекс при save, endpoint \`/articles/semantic-search/\`.

**Критерии:** работает в PostgreSQL; fallback для SQLite в тестах." \
"$DEFAULT_LABEL"

create_issue "[Пакет B2] Блок «Похожие статьи»" \
"Top-N по эмбеддингу в сайдбаре ArticleDetailsPage.

**Критерии:** не показывать текущую статью; учёт organization." \
"$DEFAULT_LABEL"

create_issue "[Пакет B3] Meilisearch (опциональный движок)" \
"Docker-сервис Meilisearch, синхронизация индекса, переключатель ENGINE в settings.

**Критерии:** документация в DEPLOY.md; dev без Meili — pgvector." \
"$DEFAULT_LABEL"

create_issue "[Пакет B4] UX поиска: подсветка и синонимы" \
"Подсветка в snippet, словарь синонимов org, история запросов пользователя.

**Критерии:** улучшение существующего ArticleSearch." \
"$DEFAULT_LABEL"

echo "=== Пакет C ==="
create_issue "[Пакет C1] RAG Q&A по базе организации" \
"Чат-виджет: вопрос → ответ с цитатами из статей своей Organization.

**Критерии:** только свой tenant; лог запросов; env API key." \
"$DEFAULT_LABEL"

create_issue "[Пакет C2] AI-суммаризация статьи" \
"Кнопка «Краткое содержание» → bullet list, кэш по version_id.

**Критерии:** явная пометка «сгенерировано ИИ»." \
"$DEFAULT_LABEL"

create_issue "[Пакет C3] Генерация черновика из плана" \
"Textarea outline → LLM → вставка в RichTextEditor как черновик.

**Критерии:** только editor+; не автопубликовать." \
"$DEFAULT_LABEL"

create_issue "[Пакет C4] AI-проверка качества контента" \
"Предупреждения: битые ссылки, мало текста, дата «последнее обновление» старая.

**Критерии:** панель на странице редактирования." \
"$DEFAULT_LABEL"

echo "=== Пакет D ==="
create_issue "[Пакет D1] Комментарии и @mentions" \
"Треды к статье, упоминание @user, email/in-app уведомление.

**Критерии:** CRUD комментариев; markdown-lite." \
"$DEFAULT_LABEL"

create_issue "[Пакет D2] Workflow: ревью и статусы" \
"draft → in_review → published; назначение ревьюера.

**Критерии:** только admin/reviewer может публиковать (настраиваемо)." \
"$DEFAULT_LABEL"

create_issue "[Пакет D3] Diff версий side-by-side" \
"UI сравнения двух ArticleVersion (html diff).

**Критерии:** выбор версий из истории." \
"$DEFAULT_LABEL"

create_issue "[Пакет D4] Права на уровне раздела" \
"SectionPermission: user/group → read/write на поддереве.

**Критерии:** наследование прав от parent; тесты API." \
"$DEFAULT_LABEL"

create_issue "[Пакет D5] Публичный портал документации" \
"\`is_public\` разделы, маршрут /docs/{org}/{slug}, SEO meta, без JWT.

**Критерии:** отдельный layout; не показывать private." \
"$DEFAULT_LABEL"

create_issue "[Пакет D6] Webhooks для событий" \
"Подписки org на publish/update/delete → HMAC POST.

**Критерии:** админка или API управления webhook URL." \
"$DEFAULT_LABEL"

create_issue "[Пакет D7] Интеграция Slack / Microsoft Teams" \
"Бот: поиск статьи, ссылка, опционально create from message.

**Критерии:** документация setup; один мессенджер в MVP." \
"$DEFAULT_LABEL"

create_issue "[Пакет D8] Импорт Confluence / Notion" \
"CLI или UI upload zip → разделы и статьи.

**Критерии:** сохранение иерархии; отчёт об ошибках." \
"$DEFAULT_LABEL"

echo "=== Пакет E ==="
create_issue "[Пакет E1] E2E тесты Playwright" \
"Сценарии: login, CRUD раздел/статья, поиск, история версий.

**Критерии:** job в CI; headless." \
"$DEFAULT_LABEL"

create_issue "[Пакет E2] Preview environment на PR" \
"GitHub Actions: поднять compose, comment с URL preview.

**Критерии:** опционально для fork." \
"$DEFAULT_LABEL"

create_issue "[Пакет E3] Audit log действий" \
"Модель AuditEntry: user, action, entity, timestamp, IP.

**Критерии:** просмотр admin; не дублировать ArticleVersion." \
"$DEFAULT_LABEL"

create_issue "[Пакет E4] Healthcheck и метрики" \
"GET /health/, /ready/; опционально prometheus_client.

**Критерии:** docker healthcheck использует endpoint." \
"$DEFAULT_LABEL"

create_issue "[Пакет E5] 2FA и rate limiting" \
"django-otp или TOTP для staff; throttle на login и search.

**Критерии:** документация для admin." \
"$DEFAULT_LABEL"

create_issue "[Пакет E6] Актуализация закрытых Issues P1–P3" \
"Закрыть #5–#19 если реализовано в #20–#22; таблица в ROADMAP.

**Критерии:** нет дублирующих open issues." \
"$DEFAULT_LABEL"

echo "=== Пакет F ==="
create_issue "[Пакет F1] Граф знаний" \
"Интерактивная визуализация статей и связей (react-force-graph / vis.js).

**Критерии:** фильтр по org; клик → статья." \
"$DEFAULT_LABEL"

create_issue "[Пакет F2] 3D-вид «библиотека»" \
"Альтернативный ViewType: полки в Three.js.

**Критерии:** fallback на grid при WebGL off." \
"$DEFAULT_LABEL"

create_issue "[Пакет F3] Закладки и «прочитано»" \
"UserArticleState: bookmark, last_read_at, progress.

**Критерии:** страница «Мои закладки»." \
"$DEFAULT_LABEL"

create_issue "[Пакет F4] Sandbox-разделы с TTL" \
"Раздел expires_at; cron архивации в «/_archive».

**Критерии:** предупреждение за 7 дней до TTL." \
"$DEFAULT_LABEL"

create_issue "[Пакет F5] Геймификация (опционально)" \
"Бейджи, «статья недели»; флаг org.enable_gamification=false по умолчанию.

**Критерии:** не мешает корпоративному стилю." \
"$DEFAULT_LABEL"

create_issue "[Пакет F6] Голосовая заметка → статья" \
"Upload audio → Whisper API → черновик статьи.

**Критерии:** лимит размера; только editor+." \
"$DEFAULT_LABEL"

echo ""
echo "Готово. См. docs/PACKAGES.md"
