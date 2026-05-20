# Cutover frontend Angular → backend Python

**Date :** 2026-05-07 (Vague 7)
**Statut :** bascule par défaut effective.

---

## Ce qui a changé

| Fichier | Avant | Après |
|---------|-------|-------|
| `Final/proxy.conf.json` | `target: http://localhost:8080` (mock-backend Node.js) | `target: http://localhost:8000` (backend Python FastAPI) |
| `package.json` script `start:api` | `node mock-backend/server.cjs` | `cd backend && uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload` |
| `package.json` script `start:api:legacy` | n'existait pas | `node mock-backend/server.cjs` (gardé pour comparaison) |
| `package.json` script `start:prod` | `node mock-backend/server.cjs` | gunicorn + uvicorn workers (Python) |

---

## Démarrage local complet

```bash
# Terminal 1 — Postgres (si pas déjà running)
brew services start postgresql@14   # ou docker compose up -d postgres

# Terminal 2 — Backend Python
cd Final/backend
uv sync                              # 1ère fois uniquement
cp .env.example .env                 # adapter les valeurs
uv run alembic upgrade head          # migrations 0001 + 0002 + 0003
uv run python -m scripts.seed_initial
uv run uvicorn app.main:app --reload # → http://localhost:8000

# Terminal 3 — Frontend Angular
cd Final
npm install                          # 1ère fois uniquement
npm run start                        # → http://localhost:4200
```

Le proxy Angular relaie automatiquement `/api/*` → `http://localhost:8000`
(via `proxy.conf.json`). Aucun changement nécessaire dans le code Angular.

---

## Tests E2E

Les tests Playwright (`Final/tests/`) s'exécutent maintenant contre le
backend Python par défaut. Pour comparer avec le mock-backend Node.js
(régression test) :

```bash
# E2E contre Python (défaut)
npm run test:e2e

# E2E contre legacy Node.js (régression)
npm run start:api:legacy &
LEGACY_API=true npm run test:e2e -- --project=legacy
```

---

## Comptes seed disponibles

| Username | Password | Rôle | Scope |
|----------|----------|------|-------|
| `admin` | `ChangeMe!2026` | super_admin | GLOBAL |
| `hr` | `ChangeMe!2026` | hr_manager | GLOBAL |
| `manager` | `ChangeMe!2026` | manager | DIRECTION (DGCAB) |
| `agent` | `ChangeMe!2026` | agent | SELF |

À changer en prod via `SEED_SUPER_ADMIN_PASSWORD` (env var).

---

## Endpoints disponibles

OpenAPI complet sur <http://localhost:8000/docs>. ~135 endpoints couvrant :

- **auth** : login, refresh, logout (bcrypt + JWT + rate-limiting)
- **admin** : users CRUD, roles CRUD, permissions, audit-logs
- **personnel** : agents CRUD, affectations, turnover-risk, dossier-export PDF signé
- **leave** : requests, balances, calendar, types, coverage-rules, auto-approval
- **recruitment** : campaigns, applications, status-events, comments, IA matching CV, grille entretien, conversion
- **documents** : library, types, analysis-runs (OCR), extracted-fields (validation humaine)
- **performance** : campaigns, evaluations, 360° anonyme (≥ N répondants)
- **training** : catalog, sessions, participants, demandes, cold-eval, certificats (vérif publique)
- **discipline** : cases avec state machine, events
- **organization** : directions, units, positions, org-chart hiérarchique
- **careers** : mouvements, GPEC (compétences, exigences postes, gaps snapshots)
- **workflows** : moteur séquentiel maison
- **bpmn** : moteur SpiffWorkflow (dry-run)
- **ai-assistant** : Prim'Assistant chat + confirm
- **dashboard / reports / modernization**
- **notifications** : inbox, dispatch-pending (worker email)

---

## Bascule providers (env vars)

| Domaine | Var | Valeurs | Recommandation Primature |
|---------|-----|---------|-------------------------|
| OCR | `OCR_PROVIDER` | `mock` / `tesseract` / `azure` / `aws` | **`tesseract`** (souverain) |
| Signature | `SIGNATURE_PROVIDER` | `mock` / `endesive` / `universign` / `yousign` / `docusign` | **`endesive`** (PAdES local) |
| Email | `EMAIL_PROVIDER` | `mock` / `smtp` / `sendgrid` | **`smtp`** (relay interne) |
| Storage | `STORAGE_PROVIDER` | `local` / `minio` / `s3` | **`minio`** (on-prem DC Primature) |
| LLM | `LLM_PROVIDER` | `mock` / `anthropic` / `openai` / `ollama` | **`ollama`** (LLM local) — sinon `anthropic` sandbox |
| BPMN | `BPMN_PROVIDER` | `internal` / `spiff` | **`spiff`** (BPMN 2.0 standard) |

---

## Décommissionnement mock-backend Node.js

À planifier :

1. ~~Bascule du proxy~~ ✅ fait
2. ~~Validation E2E sur backend Python~~ ✅ fait via smoke tests Vagues 0-3
3. **2 semaines de stabilité prod** (à observer)
4. Archivage : `mv Final/mock-backend Final/_legacy/mock-backend-nodejs/`
5. Suppression deps Node.js inutiles (`pg`, etc. — gardées pour le frontend Angular)

---

## En cas de problème

- **`/api/v1/health` répond `database: down`** → vérifier `DATABASE_URL` dans `.env`,
  Postgres en route sur le port (5432 par défaut, 5433 si brew@14 + PG17 cohabitent).
- **`401` sur tous les appels** → token expiré, refaire un `/auth/login`.
- **`500 DATABASE_ERROR`** → `uv run alembic upgrade head` pour appliquer les migrations.
- **`CORS error` côté browser** → vérifier `ALLOWED_ORIGINS` inclut `http://localhost:4200`.
- **Pour rollback en cas d'urgence** : remettre `proxy.conf.json` sur `:8080` + `npm run start:api:legacy`.
