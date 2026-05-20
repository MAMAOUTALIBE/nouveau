# RH Primature — Backend Python/FastAPI

Backend de l'application RH de la Primature de la République de Guinée.

> **Statut V0** — Vague 0 du [PLAN_ACTION.md](../../PLAN_ACTION.md) :
> bootstrap (FastAPI, Pydantic Settings, SQLAlchemy 2 async, Alembic, JWT,
> bcrypt, rate-limiting login, RBAC, audit transactionnel, CI/Docker).
> Domaines métier (personnel, recrutement, congés, etc.) en cours
> dans les vagues 2-3.

## Stack technique

| Couche | Choix |
|--------|-------|
| Langage | Python 3.12+ |
| Web | FastAPI 0.115+, uvicorn (dev), gunicorn (prod) |
| ORM | SQLAlchemy 2.0 async + asyncpg |
| Migrations | Alembic |
| Validation | Pydantic v2 + pydantic-settings |
| Auth | JWT (PyJWT) + bcrypt (passlib) |
| Logging | structlog |
| Tests | pytest + pytest-asyncio + httpx |
| Lint | ruff (lint + format) |
| Types | mypy strict |
| Package manager | uv |

## Démarrage local

### Pré-requis

- Python 3.12+
- [uv](https://docs.astral.sh/uv/) ≥ 0.11
- Docker (recommandé pour la base PostgreSQL)

### Installation

```bash
cd Final/backend
uv sync
cp .env.example .env
```

### Lancer la base PostgreSQL (option 1 : Docker)

```bash
docker compose up -d postgres redis minio
```

### Appliquer les migrations + seed initial

```bash
uv run alembic upgrade head
uv run python -m scripts.seed_initial
```

Cela crée 4 comptes de démonstration :

| Username  | Mot de passe   | Rôle           |
|-----------|----------------|----------------|
| `admin`   | `ChangeMe!2026` | super_admin    |
| `hr`      | `ChangeMe!2026` | hr_manager     |
| `manager` | `ChangeMe!2026` | manager        |
| `agent`   | `ChangeMe!2026` | agent          |

### Lancer le serveur

```bash
uv run uvicorn app.main:app --reload --port 8000
```

- API : <http://localhost:8000/api/v1/health>
- OpenAPI : <http://localhost:8000/docs>
- Schema JSON : <http://localhost:8000/api/v1/openapi.json>

## Connexion frontend Angular

Le `Final/proxy.conf.json` du frontend Angular relaie `/api/*` vers
`localhost:8080` (mock-backend Node.js). Pour pointer vers le backend
Python, soit on adapte ce fichier en `localhost:8000`, soit on lance le
backend Python sur le port 8080. À trancher au moment du cutover
(ticket PY-071).

## Tests

```bash
# Tests unitaires (pas de base requise)
uv run pytest tests/unit -v

# Tests d'intégration (PostgreSQL requis)
docker compose up -d postgres
uv run pytest tests/integration -v

# Tout
uv run pytest -v --cov=app
```

## Qualité

```bash
uv run ruff check .          # lint
uv run ruff format .         # format
uv run mypy app              # types stricts
```

## Migrations Alembic

```bash
# Créer une nouvelle migration auto-générée
uv run alembic revision --autogenerate -m "add training tables"

# Appliquer
uv run alembic upgrade head

# Revenir en arrière
uv run alembic downgrade -1
```

La baseline `0001_baseline_existing_schema.py` joue les fichiers SQL
existants ([Final/db/postgresql/](../../Final/db/postgresql/)) pour
garantir parité avec le schéma déployé par l'ancien mock-backend.

## Structure

```
Final/backend/
├── app/
│   ├── api/v1/          # Routers HTTP (auth, admin, health, ...)
│   ├── core/            # config, db, security, audit, logging, errors
│   ├── models/          # Modèles SQLAlchemy (schéma hr.*)
│   ├── schemas/         # Schémas Pydantic d'entrée/sortie
│   ├── services/        # Logique métier
│   └── main.py          # Bootstrap FastAPI
├── alembic/             # Migrations (baseline + futures)
├── scripts/             # Seed et outils CLI
├── tests/
│   ├── unit/            # Tests sans DB
│   └── integration/     # Tests avec DB
├── docker-compose.yml   # Stack dev (postgres + redis + minio + backend)
├── Dockerfile           # Image production multi-stage
└── pyproject.toml
```

## Variables d'environnement (essentielles)

Voir [`.env.example`](.env.example) pour la liste exhaustive.

| Variable | Défaut | Description |
|----------|--------|-------------|
| `ENV` | `dev` | `dev` / `staging` / `prod` / `test` |
| `JWT_SECRET_KEY` | — | **Requis** ≥ 32 caractères |
| `DATABASE_URL` | — | **Requis**, doit utiliser `postgresql+asyncpg://` |
| `RUN_MIGRATIONS_ON_STARTUP` | `false` | `true` en CI/prod |
| `BCRYPT_ROUNDS` | `12` | Cost bcrypt (10-15) |
| `RATE_LIMIT_LOGIN_MAX` | `5` | Tentatives avant verrouillage |
| `RATE_LIMIT_LOGIN_LOCK_SECONDS` | `900` | 15 min |
| `ALLOWED_ORIGINS` | localhost:4200 | CORS séparés par virgules |

## Sécurité

- Mots de passe bcrypt cost 12 (modifiable via `BCRYPT_ROUNDS`).
- Tokens JWT HS256 (access 30 min, refresh 24 h).
- Rate-limiting login : 5 tentatives → verrouillage 15 min par username.
- Headers HTTP : `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `Cross-Origin-Opener-Policy` sur toutes les réponses.
- CORS strict (liste blanche d'origines).
- Audit transactionnel : toute mutation sensible écrit dans `hr.audit_logs`
  dans la même transaction (rollback emporte l'audit).

## Roadmap

Ce backend est en construction par vagues itératives — voir
[PLAN_ACTION.md](../../PLAN_ACTION.md).
