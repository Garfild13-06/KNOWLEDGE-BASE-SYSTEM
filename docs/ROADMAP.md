# Roadmap и приоритеты

- **Issues (волны P1–P3):** https://github.com/Garfild13-06/KNOWLEDGE-BASE-SYSTEM/issues  
- **Пакеты A–F (следующие):** [docs/PACKAGES.md](./PACKAGES.md)
- **План вывода в production (V1–V3):** [docs/VIABILITY-ANALYSIS.md](./VIABILITY-ANALYSIS.md)
- **Идеи дальнейшего развития:** [docs/IMPROVEMENT-IDEAS.md](./IMPROVEMENT-IDEAS.md)

## Статус волн P1–P3 (в `main`)

| Волна | PR | Статус |
|-------|-----|--------|
| P1 | [#20](https://github.com/Garfild13-06/KNOWLEDGE-BASE-SYSTEM/pull/20) | ✅ в main |
| P2 | [#21](https://github.com/Garfild13-06/KNOWLEDGE-BASE-SYSTEM/pull/21) | ✅ в main |
| P3 | [#22](https://github.com/Garfild13-06/KNOWLEDGE-BASE-SYSTEM/pull/22) | ✅ в main |

Реализовано: JWT, поиск, метаданные, CI, версии, роли, multi-tenancy, Google OAuth, [DEPLOY.md](./DEPLOY.md).

---

## Следующие пакеты (A–F)

| Пакет | Фокус | Задач |
|-------|--------|-------|
| **A** | Продукт и UX | 6 (тема, черновики, шаблоны, wiki, экспорт, дашборд) |
| **B** | Умный поиск | 4 (pgvector, похожие, Meili, UX) |
| **C** | AI lite | 4 (RAG, summary, draft, lint) |
| **D** | Коллаборация и интеграции | 8 |
| **E** | Инфраструктура | 6 |
| **F** | Креатив (опц.) | 6 |

**Рекомендуемый порядок:** A → B → C → E (параллельно) → D → F.

**Issues:** [#23–#56](https://github.com/Garfild13-06/KNOWLEDGE-BASE-SYSTEM/issues?q=is%3Aissue+is%3Aopen+%22%D0%9F%D0%B0%D0%BA%D0%B5%D1%82%22)  
Подробности: **[PACKAGES.md](./PACKAGES.md)**

### Создать Issues на GitHub

```bash
bash scripts/create_package_issues.sh
```

---

## Проверка текущей версии

```bash
cd backend && python3 manage.py migrate && python3 manage.py test knowledge
cd frontend && npm run build
```
