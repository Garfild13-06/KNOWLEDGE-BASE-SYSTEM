# Идеи доработок и развития

Документ дополняет существующие:

- **[VIABILITY-ANALYSIS.md](./VIABILITY-ANALYSIS.md)** — что нужно сделать, чтобы продукт можно было выводить в production (волны V1–V3).
- **[ROADMAP.md](./ROADMAP.md)** + **[PACKAGES.md](./PACKAGES.md)** — пакеты A–F: уже запланированный функциональный рост (UX, поиск, AI, коллаборация, инфра, креатив).

Здесь — **более широкий горизонт**: что ещё можно встраивать после закрытия базы, чтобы продукт стал конкурентоспособным относительно Notion / Confluence / Outline / BookStack / Coda и приобрёл собственное лицо.

Порядок разделов отражает логические «слои» — от платформы и контента к продуктовым и бизнес-функциям. Внутри раздела пункты отсортированы примерно по соотношению ценность/трудозатраты (сверху — выгоднее).

---

## 1. Платформа и архитектура

| Идея | Зачем | Реализация |
|------|-------|------------|
| **Frontend → TypeScript** | Типобезопасность, IDE-DX, безопасный рефакторинг, контракты с API | Поэтапно: `vite` уже поддерживает TS; начать с `services/`, `contexts/`, новых компонентов; типы из OpenAPI-схемы |
| **OpenAPI / Swagger** | Контракт API, автогенерация SDK, ускорение интеграций | `drf-spectacular` → `/api/schema/` + `/api/docs/` |
| **API под `/api/v1/`** | Возможность ломающих изменений без боли клиентов | См. P2-9 в `VIABILITY-ANALYSIS.md` |
| **Async-задачи** | Webhooks, AI-вызовы, индексация, экспорт ZIP, рассылка уведомлений — всё это вне request-цикла | Celery + Redis (или RQ для простоты). Уже частично планируется в V2 |
| **Кэш горячих ответов** | `/tree_sections/`, `/api/dashboard/`, `/api/graph/` пересчитывают одно и то же десятки раз | Redis + cache-key с инвалидацией по `Article.save` / `Section.save` сигналам |
| **Read replicas PG** | Готовность к росту: searches и dashboards направлять на реплику | `DATABASE_ROUTERS` + `using='replica'` |
| **Outbox-паттерн для event-bus** | Гарантированная доставка webhooks/Slack/Teams без потерь | Таблица `outbox_events` + Celery worker + ack/retry/DLQ |
| **Feature-flags не из env, а из БД** | Прод-флипы без redeploy, A/B, постепенный rollout | unleash-server (open-source) или своя `FeatureFlag` модель |
| **Health/readiness отдельно** | Liveness != readiness; k8s/orchestration friendly | `/api/healthz/` (live) + `/api/readyz/` (db, cache, queue) |
| **Структурированные ID** | `Section`/`Article` ID — последовательные `1,2,3` → утечка размера и порядка создания | Опц. ULID/UUID7 как публичный идентификатор; внутренний — оставить BigInt |

---

## 2. Редактор и контент

Редактор — главная «точка соприкосновения» пользователя с продуктом. Сейчас базовый TinyMCE с тулбаром.

| Идея | Конкуренты, у которых это есть |
|------|-------------------------------|
| **Real-time co-editing** (несколько курсоров, presence, live preview) — Yjs + Hocuspocus или Liveblocks; альтернатива редактору — Tiptap (open-source, на ProseMirror) | Notion, Confluence Cloud, Google Docs |
| **Slash-меню** (`/heading`, `/code`, `/table`, `/callout`, `/embed`) | Notion, Coda, Outline |
| **Mermaid-диаграммы** в коде (`mermaid` блок) — sequence, flowchart, gantt | GitLab, GitHub Wiki, BookStack |
| **Excalidraw / TLDraw** для рисованных схем прямо в статье | Notion (Excalidraw via embed), Outline |
| **KaTeX/MathJax** для формул `$$E=mc^2$$` | HackMD, Wiki.js |
| **Подсветка кода + copy-to-clipboard + язык-бейдж** | Все современные wiki |
| **Drag-and-drop файлов в редактор + drag для reorder блоков** | Notion |
| **Transclusion / переиспользуемые блоки** (`{{include:слаг-статьи}}`) — DRY для контента | Notion (synced blocks), Confluence (excerpts) |
| **Snippets / шаблоны блоков** на уровне организации | Notion, Coda |
| **Автокомплит wiki-ссылок** при наборе `[[…` (выпадающий список статей с поиском) | Obsidian, Logseq, Notion |
| **Эмодзи-пикер с поиском** | Все |
| **Раздельный режим «фокус» (full-screen, без сайдбара)** | Notion, Outline |
| **Автосохранение черновика** в IndexedDB при потере связи + восстановление при возврате | Google Docs |
| **Track changes / suggested edits** для ревью без перезаписи | Google Docs, Confluence |

> **Стратегический выбор**: TinyMCE → Tiptap. Tiptap построен на ProseMirror (как Notion), open-source MIT, лучшая API для расширений и совместного редактирования, без ограничений лицензии. Цена — миграция HTML → ProseMirror JSON и переписывание плагинов. Имеет смысл, когда понадобится real-time co-editing.

---

## 3. Совместная работа

| Идея | Описание |
|------|----------|
| **Presence-индикаторы** | Аватарки тех, кто сейчас читает/редактирует статью |
| **Reactions на комментариях** | 👍 ❤️ 🚀 + кастомные эмодзи; полезно для лёгкой обратной связи |
| **Mentions `@username`** | Парсинг при сохранении комментария → in-app + email уведомление; с предложением автокомплита |
| **Threads в комментариях** | Replies, разрешение треда, фильтр «открытые / решённые» |
| **Subscribe to article** | Получать уведомления при изменении / новом комментарии / публикации |
| **Approve workflow** | Несколько ревьюеров с явным «approve», статья публикуется только при N апрувах |
| **Inline-комментарии** | Выделить параграф → оставить замечание; Loom для wiki |
| **Tasks внутри статей** | `[ ] Сделать X — @user — to: 2026-06-01`; парсинг и сводка по всем статьям |
| **Голосование «актуально / устарело»** | Лёгкая обратная связь от читателей, помогает приоритизировать обновления |
| **«Полезно? да / нет»** в конце статьи | Анонимный signal качества, тренд по времени |

---

## 4. Поиск и навигация

| Идея | Профит |
|------|--------|
| **Faceted-поиск** (фильтры слева: автор, теги, разделы, статусы, период) | Базовая фича современного поиска |
| **Saved searches + email-алерты** | «Уведомлять, когда появляется статья с тегом `incident`» |
| **Synonyms / org-словарь** | «к8с» = «k8s» = «kubernetes» — настраивается админом организации |
| **Typo-tolerant** | `pg_trgm` или Meilisearch (B3 в roadmap) |
| **Multi-language stemming** | Корректный поиск по русским словоформам (PG `russian` config + nice tokenizer) |
| **OCR для PDF/изображений** | Поиск по содержимому вложений; tesseract или AWS Textract |
| **Cmd-K палитра** | Универсальный поиск+навигация, как в Linear/Slack/Notion |
| **Shortcut-схема** | `g h` (home), `g g` (graph), `c` (create), `/` (search) — как в GitHub/Linear |
| **Breadcrumbs за один запрос** | Сейчас рекурсивные fetch на каждый уровень |
| **Recent + Recently viewed** | История на пользователя, sidebar-виджет |
| **Pin / закреплённые в разделе** | Поднять важные статьи наверх |
| **«Что новое»** | Лента изменений в организации с фильтрами |

---

## 5. AI и автоматизация

Существующий AI-ассистент — базовый (summarize / draft / RAG / lint). Можно сделать значительно больше.

| Идея | Эффект |
|------|--------|
| **RAG с цитированием** | Ответ агента содержит явные ссылки `[1] [2]` на параграфы статей с подсветкой источника при ховере |
| **Auto-tagging при создании** | LLM предлагает теги на основе содержимого; пользователь принимает/отклоняет |
| **Дедупликация** | «Эта статья на 87% похожа на «X» — объединить или сослаться?» (на embeddings) |
| **Knowledge gap detection** | Анализ запросов поиска без хороших результатов → дашборд «нужны статьи про…» |
| **Stale-detection v2** | Не только по `updated_at`, но и по обновлениям связанных артефактов (Slack/GitHub-ссылок) |
| **Translation on-demand** | Статья на русском → on-the-fly английская версия с ручной правкой и сохранением |
| **Image alt-text** | Авто-генерация для accessibility |
| **Voice-to-draft** | Whisper для надиктовки черновика на телефоне |
| **«Ask the doc» виджет** | Embeddable JS-виджет для встраивания в чужие сайты — ChatGPT-стиль ответы из публичной части базы |
| **AI-онбординг бот** | Отвечает только из базы знаний организации; «спроси про процессы» |
| **Авто-changelog** | LLM суммирует diff версий «что изменилось»; красиво в `version-diff` |
| **Anti-hallucination** | Принуждать модель к «не нашёл в базе» вместо выдумывания |

> Желательно поддерживать не только OpenAI, но и self-hosted LLM (Ollama, vLLM с Mistral/Qwen/Llama) — для on-prem заказчиков.

---

## 6. Интеграции

Корпоративная wiki без интеграций — мёртвая.

| Категория | Конкретно |
|-----------|-----------|
| **Чаты** | Slack / MS Teams / Mattermost / Telegram — slash-команда поиска, посты при `article.published`, уведомления о mentions, бот-RAG |
| **Импорт** | Confluence (XML bulk export), Notion (Markdown export), Google Docs (Drive API), BookStack, Outline, Obsidian vaults |
| **Экспорт** | Confluence (для миграций обратно), статичный HTML-сайт (Hugo/MkDocs), PDF-книга всего раздела |
| **Issue-трекеры** | Jira / Linear / YouTrack — двусторонняя ссылка статей и задач, авто-changelog в статье |
| **Git** | GitHub / GitLab — превью PR, авто-связь коммитов с упомянутыми статьями (`Refs KB-123`) |
| **Iaas / PaaS** | Webhook-receiver для GitHub Actions / GitLab CI: «build документации при пуше в репо» |
| **Calendar / meetings** | Авто-создание заметок встречи из календаря (Google Calendar / Outlook) |
| **Public API + SDK** | Python / TypeScript / Go SDK; OAuth-приложения; PAT для скриптов |
| **Browser extension** | Chrome / Firefox для clipping веб-страниц прямо в раздел |
| **Zapier / Make / n8n** | Триггеры (`article.published`) и actions (`create_article`) — мгновенное расширение интеграций |

---

## 7. Безопасность и комплаенс

| Уровень | Идея |
|---------|------|
| **Аутентификация** | SAML 2.0 + OIDC (Keycloak / Auth0 / Azure AD / Okta) поверх существующего Google OAuth; **2FA TOTP** для admin |
| **Авторизация** | IP allow-list; время доступа (рабочие часы); аномалии (geo, новый device) |
| **Защита данных** | DLP-патруль (предупреждение при вставке ключей/паролей/PII в статьи); подписанные URL для медиа; encrypted-at-rest для secret-полей |
| **Жизненный цикл** | Soft-delete с корзиной; retention-политики (автоархив > N дней); legal hold |
| **Комплаенс** | GDPR / 152-ФЗ: экспорт данных пользователя, право на забвение, согласия; SOC 2 / ISO 27001 audit-export |
| **End-to-end** | Конфиденциальные разделы с E2E-шифрованием на клиенте (опционально, как в Standard Notes) |
| **Threat modeling** | STRIDE/LINDDUN перед каждым крупным релизом; bug bounty для public-портала |
| **Защита от LLM-prompt-injection** | Особенно для RAG, когда контент пользователя попадает в промпт системы |

---

## 8. Производительность и масштабирование

| Идея | Когда нужно |
|------|-------------|
| **Edge caching публичного портала** | CloudFlare/Fastly — все опубликованные статьи отдаются мгновенно |
| **Image optimization** | WebP/AVIF, responsive `srcset`, blur-up placeholders, CDN-генерация |
| **Lazy-load редактора** | Сейчас bundle 2.16 MB; вынести TinyMCE в отдельный chunk через `React.lazy` (см. P2-6 в анализе) |
| **Bulk endpoints** | `POST /api/articles/bulk/`, `PATCH /api/articles/bulk-tag/` — вместо N запросов |
| **Cursor-pagination** | Стабильнее offset-based на больших списках |
| **Service Worker для offline read** | PWA для просмотра последних N статей без сети |
| **Database tuning** | Индексы на `(organization_id, status, updated_at)`, `(organization_id, slug)`, `EXPLAIN ANALYZE` ключевых запросов |
| **Hot/cold storage** | Старые версии статей и audit-logs выносить в S3/MinIO как parquet-блобы |
| **Metrics: Prometheus + Grafana** | RPS, latency (p50/p95/p99), error rate, queue depth |
| **APM** | Sentry Performance / Elastic APM / OpenTelemetry — выявление узких мест |

---

## 9. Mobile, offline, PWA

| Платформа | Подход |
|-----------|--------|
| **PWA** | Минимально инвазивно: манифест, service worker, install prompt, offline-просмотр. Низкая стоимость, высокий выигрыш |
| **Native iOS / Android** | Capacitor (один React-кодбейз → нативные приложения) либо React Native fork |
| **Offline-first** | SQLite на устройстве, conflict-resolution через CRDT (Yjs) или last-write-wins с visual diff |
| **Mobile-search** | Голосовой ввод; OCR через камеру (сфоткал доску → распарсил текст) |
| **Push-уведомления** | Web Push (Chrome/Firefox) + FCM (Android) + APNs (iOS) |
| **Reading-mode** | Без шапки/сайдбара, увеличенный шрифт, автопрокрутка для долгих текстов |

---

## 10. Аналитика и инсайты

Превратить wiki из «свалки текстов» в **управляемый актив**.

| Метрика | Что показывает |
|---------|-----------------|
| **Views, avg read time, scroll depth** | Реально ли статью читают, или открывают и закрывают |
| **Heatmap кликов** | Где пользователи задерживаются; PostHog / Plausible self-hosted |
| **Top searched / zero-result** | Что люди ищут, но не находят — приоритеты для авторов |
| **Health-score статьи** | (`age × views × link_count × last_edit_age`) — устаревший контент сразу видно |
| **Activity feed** | Лента «что произошло в org за неделю» |
| **Knowledge map** | Визуализация: что используется, что мёртвое, что одиноко без ссылок |
| **Per-author dashboards** | Вклад каждого редактора, gamification «статья месяца» |
| **Org executive view** | Общий health, % устаревших, % published vs draft, кол-во правок |
| **Экспорт метрик** | В корпоративный Grafana/Superset через Prometheus или CSV |

---

## 11. UX / дизайн / доступность

| Идея | Зачем |
|------|-------|
| **i18n (RU/EN/…)** | Открывает международных заказчиков; `react-intl` + Django `i18n_patterns` |
| **WCAG 2.2 AA** | Контраст, focus-states, ARIA, keyboard-only navigation, screen-reader тесты |
| **Drag-and-drop reorder** | Разделы и статьи перетаскиваются; обновляет `position` через bulk-API |
| **Bulk-actions** | В списках: переместить, опубликовать, отметить тегом, удалить |
| **In-app onboarding** | Интерактивный тур (intro.js / driver.js) при первом входе |
| **Empty-states** | Внятные подсказки и CTA, а не «пусто» |
| **Темы: auto + кастомные** | `prefers-color-scheme: auto`; org-level brand colors (white-label) |
| **Customizable dashboard** | Пользователь сам выбирает виджеты (recent / drafts / popular / bookmarks) |
| **Favorites + pinned** | Личное и общее закрепление наверху |
| **404/500 страницы** | Кастомные с действиями «вернуться / поиск / создать» |
| **OG-теги, sitemap, robots** | Для расшариваемых ссылок и SEO публичного портала (P1-8 в анализе) |

---

## 12. Шаблоны и индустриальные наборы

Сейчас — 4 хардкод-шаблона. Можно сделать богатую библиотеку.

- **ITIL**: incident, problem, change, RFC.
- **ISO 9001 / 27001**: процедуры, чек-листы, риск-регистры.
- **Безопасность**: ADR, RCA, threat-model.
- **Продукт**: PRD, RFC, OKR, post-mortem, retro.
- **HR**: onboarding-чек-лист, описание роли, performance-review.
- **Поддержка**: KB-articles по problem/solution/symptoms.
- **Org-level кастом-шаблоны** через UI, а не через `article_templates.py`.
- **Bulk-creation из шаблона** — например, одним действием создать 20 статей онбординга.
- **Marketplace** шаблонов между организациями (опционально, B2B).

---

## 13. Тестирование и DevEx

| Инструмент | Цель |
|------------|------|
| **Playwright e2e** | login → CRUD → search → restore → export — главный smoke-pack (E1 в roadmap) |
| **Storybook + Chromatic / Loki** | Визуальная регрессия UI-компонентов |
| **Vitest + RTL** | Unit-тесты для критичных компонентов и хуков |
| **Schemathesis** | Property-based тесты OpenAPI-спеки |
| **k6 / Locust** | Нагрузочное тестирование критичных endpoints |
| **mutmut** | Mutation-тесты — реальное покрытие, а не строки |
| **Preview environments** | На каждый PR — временный URL (Render / Fly / Cloud Run) |
| **pre-commit** | ruff + black + isort + eslint + prettier + mypy + secret-scan |
| **Type coverage** | mypy strict для backend, TS strict для frontend; метрика в CI |
| **Conventional commits** | Автогенерация changelog (release-please) |
| **Semantic versioning + tags** | Релизы как первоклассный артефакт |
| **Dependabot / Renovate** | Авто-PR для обновления зависимостей |

---

## 14. Бизнес и продуктовые функции (B2B SaaS)

| Идея | Описание |
|------|----------|
| **Self-service регистрация org** | Лендинг → форма → email-подтверждение → готовая org |
| **Биллинг** | Stripe / CloudPayments / ЮKassa; планы Free / Team / Business / Enterprise |
| **Usage-metering** | Лимиты на статьи, AI-токены, storage, seats; графики потребления |
| **Trial + upgrade flows** | 14 дней Pro; soft-cap при превышении |
| **Public statuspage** | uptimerobot / Atlassian Statuspage — доверие + честность |
| **Public changelog** | Что нового в продукте; собирается из conventional commits |
| **Feedback-виджет с roadmap-голосованием** | Canny / Featurebase / собственная реализация |
| **Affiliate / referral программа** | Низкая стоимость роста |
| **Admin guide + видео** | Учебная база для админов организации (та же KBS, dogfooding) |
| **API marketplace** | Каталог пользовательских интеграций (Zapier-like) |

---

## 15. Креатив, дифференциация, R&D

Идеи, которые могут стать узнаваемыми фичами продукта:

- **3D-полка / библиотека** (Three.js) — альтернативный browse-view; уже упомянуто в Пакете F.
- **AR/VR knowledge spaces** — для презентаций и онбординга в командах с remote-first culture.
- **Voice-mode** — диктовка статьи по телефону, авто-структурирование LLM в How-to.
- **Knowledge graph как продукт** — возможность экспортировать/публиковать граф знаний org как embeddable интерактив.
- **Competitive audit** — LLM сравнивает базу знаний с конкурентами (RFC vs internet best practices) и предлагает улучшения.
- **Личный «второй мозг»** mode — режим когда конкретный пользователь видит срез базы как личную wiki (заметки, идеи, projects).
- **Связь с time-tracking** — сколько часов команда тратит на поиск против чтения; ROI обучения.
- **Live-stream обучения** — встреча по Zoom → авто-транскрипт → черновик статьи.

---

## Как пользоваться этим списком

1. **Не пытаться сделать всё.** До закрытия волн V1–V2 в `VIABILITY-ANALYSIS.md` любое из этого преждевременно.
2. **Выбирать по позиционированию.** Если продукт — для on-prem enterprise, в приоритете SAML/2FA/audit (раздел 7) и self-hosted LLM (раздел 5). Если для SaaS — биллинг и self-service (раздел 14) и онбординг (раздел 11).
3. **Каждый крупный пункт — отдельная RFC.** Не начинать имплементацию без короткого design-doc'а: цель, alternatives, risks, rollout.
4. **Возвращаться сюда раз в квартал.** Идеи устаревают; добавлять новые из обратной связи пользователей.

Источник для уточнения приоритетов:

- Активная база пользователей (что они делают каждый день).
- Запросы поддержки и feedback-виджет.
- Метрики (раздел 10).
- Анализ конкурентов (Notion, Confluence, Outline, BookStack, Wiki.js, GitBook, Coda, Obsidian Publish).
