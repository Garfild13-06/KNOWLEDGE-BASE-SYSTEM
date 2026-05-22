#!/bin/bash
# Creates GitHub issues from roadmap. Run from repo root.
set -euo pipefail
REPO="${1:-}"

create_issue() {
  local title="$1"
  local body="$2"
  local labels="$3"
  if [[ -n "$REPO" ]]; then
    gh issue create --repo "$REPO" --title "$title" --body "$body" --label "$labels"
  else
    gh issue create --title "$title" --body "$body" --label "$labels"
  fi
}

# P0 — Critical
create_issue "[P0] Санитизация HTML при отображении статей (XSS)" \
"**Проблема:** \`dangerouslySetInnerHTML\` в ArticleDetailsPage без очистки HTML.

**Решение:** DOMPurify (или bleach на backend) перед рендером.

**Критерии приёмки:**
- [ ] HTML из редактора отображается без выполнения скриптов
- [ ] Базовое форматирование (заголовки, списки, ссылки) сохраняется" \
"bug"

create_issue "[P0] Защита эндпоинтов загрузки файлов" \
"**Проблема:** TinyMCEUploadView без permission_classes — анонимная загрузка.

**Решение:** IsAuthenticated на upload; валидация типов/размера файлов.

**Критерии приёмки:**
- [ ] POST /uploads/ без токена → 401
- [ ] Загрузка работает для авторизованных пользователей" \
"bug"

create_issue "[P0] Секреты и DEBUG в production" \
"**Проблема:** DEBUG=True в коде, CORS_ALLOW_ALL_ORIGINS, пароль БД в docker-compose, API-ключ TinyMCE в репозитории.

**Решение:** Настройки через env; .env.example; убрать секреты из compose.

**Критерии приёмки:**
- [ ] DEBUG читается из переменной окружения
- [ ] CORS настраивается списком origins
- [ ] Пароли не в git" \
"bug"

# P1 — Wave 1 (partially in current PR)
create_issue "[P1] SectionSerializer: поле description не отдаётся API" \
"**Проблема:** UI отправляет description, но serializer fields не включают description.

**Критерии приёмки:**
- [ ] GET /sections/{id}/ возвращает description
- [ ] Описание отображается на карточках и странице раздела" \
"bug"

create_issue "[P1] JWT: refresh token и единый HTTP-клиент" \
"**Проблема:** refresh_token не сохраняется при login; AuthContext использует отдельный axios.

**Критерии приёмки:**
- [ ] login сохраняет access + refresh
- [ ] Интерцептор обновляет access при 401
- [ ] Все запросы идут через api.js" \
"enhancement"

create_issue "[P1] ProtectedRoute и скрытие действий для гостей" \
"**Проблема:** Кнопки CRUD видны без авторизации.

**Критерии приёмки:**
- [ ] Гость видит только чтение
- [ ] Создание/редактирование/удаление только для авторизованных" \
"enhancement"

create_issue "[P1] VITE_API_URL и конфигурация для Docker" \
"**Проблема:** baseURL захардкожен localhost:8000.

**Критерии приёмки:**
- [ ] api.js использует import.meta.env.VITE_API_URL
- [ ] .env.example для frontend
- [ ] docker-compose передаёт URL при сборке" \
"enhancement"

create_issue "[P1] Исправить bind gunicorn в docker-compose" \
"**Проблема:** \`gunicorn --bind backend:8000\` — неверный адрес.

**Критерии приёмки:**
- [ ] gunicorn слушает 0.0.0.0:8000
- [ ] backend доступен из контейнера frontend" \
"bug"

# P2 — Short term
create_issue "[P2] Полнотекстовый поиск по статьям" \
"Поиск по title и content (plain text из HTML). Endpoint + UI в Header/Sidebar.

**Критерии:** debounce, подсветка, переход к статье." \
"enhancement"

create_issue "[P2] Метаданные: created_at, updated_at, author" \
"Добавить поля в модели, миграции, отображение в UI, сортировка." \
"enhancement"

create_issue "[P2] Оптимизация дерева разделов (N+1)" \
"prefetch_related / annotate / единый queryset для tree_sections." \
"enhancement"

create_issue "[P2] Базовые автотесты API и CI" \
"pytest/django tests для sections/articles/auth; GitHub Actions lint+test." \
"enhancement"

create_issue "[P2] Редактор при создании статьи" \
"RichTextEditor в диалоге создания вместо TextField." \
"enhancement"

create_issue "[P2] Синхронизация сайдбара после CRUD разделов" \
"Обновление FolderTree после создания подпапки без перезагрузки." \
"enhancement"

# P3 — Long term
create_issue "[P3] История версий статей" \
"Версионирование, diff, откат." \
"enhancement"

create_issue "[P3] Роли и права (читатель/редактор/админ)" \
"Django groups + object-level permissions для разделов." \
"enhancement"

create_issue "[P3] Расширенный поиск (Meilisearch/Elasticsearch)" \
"Индексация, фильтры, релевантность." \
"enhancement"

create_issue "[P3] SSO / OAuth и multi-tenancy" \
"Корпоративный вход, изолированные базы знаний." \
"enhancement"

echo "Done creating issues."
