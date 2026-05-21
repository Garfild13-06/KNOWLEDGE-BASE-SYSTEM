# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Knowledge Base System — Django 5.1.5 backend + React 18 / Vite 6 frontend, PostgreSQL database.

### Services

| Service | Port | Start command |
|---------|------|---------------|
| PostgreSQL | 5432 | `sudo pg_ctlcluster 16 main start` |
| Django backend | 8000 | `cd backend && python3 manage.py runserver 0.0.0.0:8000` |
| Vite frontend | 3000 | `cd frontend && npm run dev` |

### Important notes

- **Backend `.env`**: The file `backend/.env` is gitignored and must be created manually. Required vars: `SECRET_KEY`, `DB_ENGINE`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `ALLOWED_HOSTS`. See `docker-compose.yml` for default DB credentials (`kb_admin` / `5tr0ngP@ss` / `knowledge_base`).
- **API routes**: Django API endpoints are mounted at root (`/sections/`, `/articles/`, etc.), not under `/api/`. The Vite dev server proxy rewrites `/api/*` → `http://localhost:8000/*` (stripping the `/api` prefix).
- **JWT auth**: Write operations require a JWT token obtained via `POST /api/token/` with `username`/`password`. Read operations are public.
- **Lint**: `npm run lint` (frontend) reports pre-existing warnings/errors (prop-types, unused imports). These are not regressions.
- **Django checks**: Run `python3 manage.py check` from `backend/` directory.
- **Build**: `npm run build` (frontend) succeeds; the build is in `frontend/dist/`.
- **Admin panel**: Django admin is at `http://localhost:8000/admin/`. Superuser can be created with `DJANGO_SUPERUSER_PASSWORD=<pw> python3 manage.py createsuperuser --noinput --username <user> --email <email>`.
- **Migrations**: Run `python3 manage.py migrate` from `backend/` after any model changes.
