# Roadmap и приоритеты

Issues созданы в GitHub: [Garfild13-06/KNOWLEDGE-BASE-SYSTEM/issues](https://github.com/Garfild13-06/KNOWLEDGE-BASE-SYSTEM/issues).

## Приоритеты

| Метка | Смысл |
|-------|--------|
| **[P0]** | Безопасность, утечки, XSS — срочно |
| **[P1]** | Первая волна стабилизации (auth, API, env, Docker) |
| **[P2]** | Краткосрочные улучшения UX и качества |
| **[P3]** | Долгосрочная эволюция продукта |

## Текущая волна (PR `cursor/wave-1-security-auth-env-6b26`)

Закрывает: #5–#9 (P1), частично #2–#4 (P0).

- `SectionSerializer.description`
- JWT refresh + единый `api` клиент
- `RequireAuth` для действий записи
- `VITE_API_URL`, `.env.example`
- DEBUG/CORS из env
- Защита `/uploads/`
- DOMPurify для HTML статей
- Исправление gunicorn bind
- Базовые тесты API

## Создание issues повторно

```bash
bash scripts/create_issues.sh
```
