# Roadmap и приоритеты

Issues: [Garfild13-06/KNOWLEDGE-BASE-SYSTEM/issues](https://github.com/Garfild13-06/KNOWLEDGE-BASE-SYSTEM/issues)

## Статус волн

| Волна | Ветка | Issues |
|-------|-------|--------|
| P1 | `cursor/wave-1-security-auth-env-6b26` | #5–#9 |
| P2 | `cursor/wave-2-p2-features-6b26` | #10–#15 |
| **P3** | `cursor/wave-3-p3-features-6b26` | #16–#19 |

## P3 — реализовано

### #16 История версий
- Модель `ArticleVersion`, снимок при создании и каждом сохранении
- `GET /articles/{id}/versions/`, `POST /articles/{id}/restore/`
- UI: диалог «История версий» с просмотром и откатом

### #17 Роли
- `UserProfile.role`: reader / editor / admin
- `KnowledgeBasePermission`: запись только editor+
- `python manage.py setup_kb_roles`
- Отображение роли в шапке, `RequireAuth` по `can_edit`

### #18 Расширенный поиск
- Поле `content_plain`, ранжирование (PostgreSQL FTS или fallback)
- Фильтры: раздел, автор, даты
- UI: иконка фильтров в `ArticleSearch`

### #19 Multi-tenancy и OAuth-задел
- Модель `Organization`, изоляция данных по организации
- `GET /api/auth/me/`, `POST /api/auth/join-organization/`
- `GET /api/auth/providers/` (Google при наличии env)
- Документация: `docs/OAUTH.md`

## Проверка

```bash
cd backend && python3 manage.py migrate && python3 manage.py test knowledge
cd backend && python3 manage.py setup_kb_roles
cd frontend && npm run build
```

## Создание issues

```bash
bash scripts/create_issues.sh
```
