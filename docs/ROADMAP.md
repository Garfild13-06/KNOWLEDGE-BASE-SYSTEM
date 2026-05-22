# Roadmap и приоритеты

Issues: [Garfild13-06/KNOWLEDGE-BASE-SYSTEM/issues](https://github.com/Garfild13-06/KNOWLEDGE-BASE-SYSTEM/issues)

## Статус волн

| Волна | PR / ветка | Issues |
|-------|------------|--------|
| P1 | `cursor/wave-1-security-auth-env-6b26` | #5–#9 |
| **P2** | `cursor/wave-2-p2-features-6b26` | #10–#15 |
| P3 | — | #15–#19 |

## P2 (текущая) — реализовано

- **#10** Полнотекстовый поиск: `GET /articles/search/?q=` + `ArticleSearch` в шапке
- **#11** Метаданные: `created_at`, `updated_at`, `created_by`, `updated_by` + отображение на странице статьи
- **#12** Дерево разделов: prefetch (из P1) + `select_related` для авторов
- **#13** CI: `.github/workflows/ci.yml` (тесты backend + build frontend)
- **#14** RichTextEditor при создании статьи в разделе
- **#14** RichTextEditor при создании статьи
- **#15** Синхронизация сайдбара (`FoldersContext`)

## Проверка

```bash
cd backend && python3 manage.py test knowledge
cd frontend && npm run build
```

## Создание issues

```bash
bash scripts/create_issues.sh
```
