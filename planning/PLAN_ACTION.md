# Plan d'Action — Backend Python/FastAPI · Application RH Primature

**Date :** 2026-05-07 (révision après décision stack Python)
**Base :** [AUDIT_REPORT.md](AUDIT_REPORT.md)
**Décisions actées :**
- Stack backend cible : **FastAPI + SQLAlchemy 2 (async) + Alembic + Pydantic v2 + Python 3.12+**
- Approche : **réécriture greenfield** (le mock-backend Node.js sert de référence comportementale, pas de traduction ligne à ligne)
- Priorité : **qualité d'abord** (RBAC complet, audit DB, persistance forcée intégrés dès la V1)
- Frontend Angular 21 : **conservé tel quel**, communique via `/api/v1/*`
- Schéma PostgreSQL `hr.*` ([Final/db/postgresql/](Final/db/postgresql/)) : **réutilisé tel quel**, étendu via Alembic

**Localisation du nouveau backend :** `Final/backend/` (à créer, sibling de [Final/src/](Final/src/) et [Final/mock-backend/](Final/mock-backend/)).

---

## 0. Conventions du plan

| Code | Signification |
|------|---------------|
| **Priorité** | P0 = bloquant prod · P1 = critique roadmap · P2 = important · P3 = confort |
| **Effort** | S ≤ 1 j · M = 2-3 j · L = 4-7 j · XL = 8-15 j |
| **Statut** | ☐ À faire · 🔄 En cours · ☑ Fait |
| **Préfixe ticket** | `PY-XXX` (Python backend) — l'ancien préfixe `RH-` est abandonné |

**Règles transverses (intégrées by design dans le nouveau backend, pas à répéter par ticket) :**
- Toute mutation sensible → entrée audit_logs SQL via dépendance FastAPI `audit_writer`.
- Toute route → décorateur/dépendance RBAC (`require_permissions(["..."])` + scopes).
- Tout endpoint → schéma Pydantic d'entrée et de sortie (validation et OpenAPI auto).
- Toute IA → validation humaine obligatoire (l'IA propose, l'humain dispose).
- Tout commit → `ruff check`, `ruff format`, `mypy --strict`, `pytest` verts.
- Code et commentaires en **français** (projet francophone) ; identifiants en français ou anglais selon clarté.

---

## 1. Stack technique cible (détail)

| Couche | Choix | Justification |
|--------|-------|---------------|
| Langage | Python 3.12+ | LTS, performance, type hints matures |
| Web framework | FastAPI 0.115+ | Async natif, OpenAPI auto, Pydantic intégré |
| ORM | SQLAlchemy 2.0 (async + asyncpg) | Standard Python, support async mature |
| Migrations | Alembic | Couplé SQLAlchemy, autogeneration |
| Validation / DTO | Pydantic v2 | Performance, sérialisation typée |
| Serveur ASGI | uvicorn + gunicorn workers | Production-grade |
| Package manager | uv | Rapide, lockfile, remplace pip/poetry |
| Lint + format | ruff | Tout-en-un, remplace black + isort + flake8 |
| Type checker | mypy strict | Sécurité statique |
| Tests | pytest + pytest-asyncio + httpx | Standard de fait |
| Logging | structlog | JSON structuré, corrélation requêtes |
| Auth tokens | python-jose + passlib[bcrypt] | JWT + bcrypt cost ≥ 12 |
| Tâches async | arq (Redis) ou FastAPI BackgroundTasks (V1) | OCR, scheduler éval froid |
| Settings | pydantic-settings | 12-factor, env vars validées |
| Observabilité | structlog + OpenTelemetry SDK + Sentry SDK | Stack standard |
| Tests E2E | Playwright (déjà en place côté frontend) | Réutilisé inchangé |
| Conteneurisation | Docker multi-stage + docker-compose | Déploiement standard |

**Intégrations externes (Python SDK retenus, sous réserve d'arbitrage souveraineté) :**

| Intégration | Choix Python | Alternative souveraine |
|-------------|--------------|-----------------------|
| OCR | `azure-ai-formrecognizer` ou `boto3` (Textract) | **`pytesseract` + PaddleOCR (on-prem)** ⭐ |
| Signature | `universign-api`, `yousign-api` | PKI gouvernementale + `endesive` (PAdES on-prem) |
| Email | `aiosmtplib` (SMTP standard) ou `sendgrid` SDK | SMTP relay interne |
| Stockage | `boto3` (S3 + MinIO compatible) | **MinIO on-prem** ⭐ |
| LLM | `anthropic`, `openai`, `mistralai` | Modèle local via `ollama` + `llama-index` |
| BPMN | `SpiffWorkflow` (Python pur) ou Camunda 7 sidecar | SpiffWorkflow ⭐ (pas de stack JVM) |
| SSO | `python-keycloak` ou `authlib` | Keycloak self-hosted ⭐ |
| QR codes | `qrcode[pil]` | — |
| PDF | `WeasyPrint` (HTML→PDF) ou `reportlab` | — |
| Cache / file | `redis` + `arq` | Redis on-prem |

⭐ = recommandation par défaut (souveraineté).

---

## 2. Estimation globale

| Vague | Thème | Tickets | Effort cumulé |
|-------|-------|---------|---------------|
| **Vague 0** | Bootstrap projet Python + fondations sécurisées | 7 | ~2 sem |
| **Vague 1** | Modèles SQLAlchemy + migrations Alembic | 4 | ~2 sem |
| **Vague 2** | Domaines cœur (parité fonctionnelle frontend) | 7 | ~5 sem |
| **Vague 3** | Domaines complémentaires + modules manquants | 7 | ~4 sem |
| **Vague 4** | Intégrations externes (OCR, signature, email, storage) | 6 | ~4 sem |
| **Vague 5** | IA réelle (LLM, matching, Prim'Assistant) | 6 | ~3 sem |
| **Vague 6** | Workflow BPMN | 3 | ~2 sem |
| **Vague 7** | Cutover (bascule du proxy, retrait Node) | 3 | ~1 sem |
| **Vague 8** | Hardening (SSO, observabilité, 2FA, chiffrement) | 7 | ~3 sem |
| **Total** | | **50 tickets** | **~26 semaines** (1 dev senior temps plein) ≈ 6 mois |

À 2 développeurs en parallèle (un cœur back / un intégrations + IA) : **~14 sem ≈ 3,5 mois**.

---

# VAGUE 0 — Bootstrap projet Python + fondations (P0)

## PY-001 — Initialisation projet `Final/backend/`

- **Domaine :** Architecture
- **Priorité :** P0 — **Effort :** S
- **Dépendances :** —
- **Description fonctionnelle :** Squelette projet FastAPI prêt à recevoir les domaines.
- **Description technique :**
  - Créer `Final/backend/` avec arborescence :
    ```
    Final/backend/
      pyproject.toml         # uv + ruff + mypy + pytest config
      uv.lock
      Dockerfile
      docker-compose.yml     # backend + postgres + redis + minio
      alembic.ini
      app/
        main.py              # FastAPI app + middleware + router include
        core/
          config.py          # Settings (pydantic-settings)
          db.py              # AsyncSession factory
          security.py        # JWT, bcrypt, dépendances RBAC
          audit.py           # Audit writer (dépendance)
          logging.py         # structlog config
          errors.py          # Exception handlers
        api/v1/              # Routers par domaine (créés vagues 2-3)
        models/              # SQLAlchemy models
        schemas/             # Pydantic models
        services/            # Logique métier
        workers/             # Tâches async (OCR, scheduler)
        adapters/            # OCR, signature, email, storage, LLM
      alembic/
        env.py
        versions/
      tests/
        conftest.py
        unit/
        integration/
        fixtures/
    ```
  - `pyproject.toml` configuré (uv, ruff strict, mypy strict, pytest).
  - `.env.example` documenté.
- **Critères d'acceptation :**
  - `uv sync` installe les dépendances sans erreur.
  - `uvicorn app.main:app --reload` démarre.
  - `GET /api/v1/health` répond `{"status": "ok"}`.
- **Risque :** —

## PY-002 — Configuration 12-factor + settings Pydantic

- **Domaine :** Architecture
- **Priorité :** P0 — **Effort :** S
- **Dépendances :** PY-001
- **Description :** `app/core/config.py` charge toutes les variables d'env via `BaseSettings`, validées au boot.
- **Variables clés :** `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET_KEY`, `JWT_ACCESS_TTL_SECONDS`, `JWT_REFRESH_TTL_SECONDS`, `ALLOWED_ORIGINS`, `STORAGE_PROVIDER`, `OCR_PROVIDER`, `SIGNATURE_PROVIDER`, `LLM_PROVIDER`, `SMTP_*`, `ENV` (dev/staging/prod).
- **Critères :** boot impossible si une var critique manquante en prod.

## PY-003 — Connexion PostgreSQL async + Alembic baseline

- **Domaine :** BDD
- **Priorité :** P0 — **Effort :** M
- **Dépendances :** PY-001
- **Description :**
  - SQLAlchemy 2 async engine + `AsyncSession` factory.
  - Alembic configuré pour utiliser metadata SQLAlchemy (autogenerate).
  - **Baseline migration** = état actuel du schéma `hr.*` (tables 001-004 existantes).
  - Bootstrap au démarrage : applique `alembic upgrade head` si `RUN_MIGRATIONS=true`.
- **Critères :**
  - `alembic upgrade head` applique la baseline sur DB vide.
  - `alembic upgrade head` est idempotent sur DB existante (le nouveau backend doit pouvoir attaquer la DB existante du mock-backend).
  - `pytest` se lance contre une DB Postgres test (Docker).
- **Risque :** divergence entre les SQL existants et les modèles SQLAlchemy → la baseline est à matcher exactement, pas regénérée.

## PY-004 — Authentification JWT + bcrypt

- **Domaine :** Sécurité
- **Priorité :** P0 — **Effort :** M
- **Dépendances :** PY-003
- **Description :**
  - `passlib[bcrypt]` (cost 12+) pour hasher les mots de passe.
  - `python-jose` pour JWT HS256 (access + refresh).
  - Endpoints `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`.
  - Modèle SQLAlchemy `User` (mappé à `hr.users`, colonne `password_hash` déjà existante).
  - Migration ponctuelle : si users seed ont password en clair (héritage Node.js), hash au démarrage.
  - Rate-limiting `/auth/login` (5 tentatives → 429, verrouillage 15 min).
- **Critères :** parité fonctionnelle avec mock-backend + 0 password en clair + brute-force bloqué.

## PY-005 — RBAC : permissions + rôles + scopes (dépendances FastAPI)

- **Domaine :** Sécurité
- **Priorité :** P0 — **Effort :** M
- **Dépendances :** PY-004
- **Description :**
  - Modèles SQLAlchemy `Role`, `Permission`, `RolePermission`, `UserRole`, `UserScope` (déjà en SQL).
  - Dépendance FastAPI `require_permissions(any: list[str], all: list[str] = None)`.
  - Dépendance `require_scope(scope: ScopeType)`.
  - Dépendance `current_user` qui parse le JWT et charge user + permissions + scopes.
  - Match strict avec `Final/src/app/core/security/access-control.service.ts` (mêmes codes de permission).
- **Critères :**
  - 100 % des routes futures utilisent `require_permissions`.
  - Tests par rôle (super_admin, hr_manager, manager, agent) couvrent les cas autorisés et refusés.

## PY-006 — Audit middleware + writer transactionnel

- **Domaine :** Audit / Compliance
- **Priorité :** P0 — **Effort :** M
- **Dépendances :** PY-003, PY-005
- **Description :**
  - Modèle `AuditLog` (mappé à `hr.audit_logs`).
  - Service `AuditWriter` injectable comme dépendance FastAPI : `await audit.record(action, target_type, target_id, before, after)`.
  - Middleware HTTP : log structuré requête/réponse (sans body sensible) avec corrélation ID.
  - Toute mutation business doit appeler explicitement `audit.record(...)` (vs middleware automatique : on veut le snapshot before/after typé).
  - Endpoint `/api/v1/admin/audit-logs` lecture paginée + filtres.
- **Critères :** chaque mutation génère 1 ligne `audit_logs`. Test : suppression d'agent → audit_log avec `target_type=employee`, `before`/`after` JSON.
- **Risque :** explosion volumétrie → ticket PY-084 (partitionnement) en Vague 8.

## PY-007 — CI/CD GitHub Actions + Docker

- **Domaine :** DevOps / Qualité
- **Priorité :** P0 — **Effort :** M
- **Dépendances :** PY-001
- **Description :**
  - Workflow `.github/workflows/backend.yml` : `uv sync` → `ruff check` → `mypy` → `pytest` (avec service postgres) → `docker build`.
  - Build Docker multi-stage (build + runtime slim).
  - `docker-compose.yml` local : backend + postgres 16 + redis + minio (pour dev intégrale).
  - Cache pip via `uv` lockfile.
- **Critères :** PR rouge bloque le merge ; suite CI < 6 min ; image Docker < 200 Mo.

---

# VAGUE 1 — Modèles SQLAlchemy + migrations (P0)

## PY-010 — Modèles SQLAlchemy pour le schéma existant `hr.*`

- **Domaine :** BDD
- **Priorité :** P0 — **Effort :** L
- **Dépendances :** PY-003
- **Description :**
  - Mapper toutes les 40 tables existantes en classes SQLAlchemy 2 (style `DeclarativeBase` + `Mapped`).
  - Une classe par table dans `app/models/<domaine>/<entity>.py`.
  - Naming : snake_case côté SQL ↔ snake_case côté Python (pas de PascalCase artificiel).
  - Relationships explicites (`Mapped[list["Employee"]] = relationship(...)`).
- **Critères :**
  - `mypy --strict` passe.
  - Test : `select(Employee).where(...)` génère le SQL attendu (pas de `SELECT *`).
- **Risque :** modèles divergents du SQL réel → script de validation `python scripts/check_schema_drift.py` qui compare metadata SQLAlchemy ↔ pg_catalog.

## PY-011 — Migration Alembic baseline (parité schéma existant)

- **Domaine :** BDD
- **Priorité :** P0 — **Effort :** S
- **Dépendances :** PY-010
- **Description :**
  - Migration `0001_baseline.py` qui matche exactement le schéma 001-004 existant.
  - Sur DB existante : marquée comme `current head` sans rien recréer (`alembic stamp head`).
- **Critères :** `alembic upgrade head` sur DB vierge produit un schéma identique à 001+002+004.

## PY-012 — Migrations Alembic pour modules manquants

- **Domaine :** BDD
- **Priorité :** P0 — **Effort :** L
- **Dépendances :** PY-011
- **Description :** Créer les tables identifiées dans l'audit comme manquantes :
  - `hr.training_catalog`, `training_sessions`, `training_session_participants`, `training_requests`, `training_evaluations` (chaud + froid), `training_certificates`
  - `hr.performance_campaigns`, `performance_evaluations`, `performance_360_invitations`, `performance_360_responses`
  - `hr.discipline_cases`, `discipline_events`
  - `hr.competency_referential`, `position_competency_requirements`, `competency_gaps_snapshots`
  - `hr.signature_providers`, `signature_envelopes`, `signature_audit_trail`
  - `hr.leave_service_coverage_rules`, `leave_auto_approval_rules`
  - `hr.document_extraction_queue`
- **Critères :** schéma cible cohérent avec PLAN_ACTION (anciennes vagues 3-4).

## PY-013 — Seeds initiaux (organisations, rôles, types congé, types document)

- **Domaine :** BDD
- **Priorité :** P0 — **Effort :** S
- **Dépendances :** PY-011
- **Description :** Script `python scripts/seed_initial.py` idempotent : organisation Primature, rôles, permissions, leave_types, document_types par défaut.
- **Critères :** double exécution → 0 doublon. DB vide après seed → API fonctionnelle pour tester.

---

# VAGUE 2 — Domaines cœur (parité fonctionnelle avec frontend Angular)

> Objectif : le frontend Angular existant fonctionne contre le nouveau backend Python sans aucune modification.
> Pour chaque domaine : routes + Pydantic schemas + service + tests d'intégration validant que les contrats `/api/v1/*` matchent l'existant.

## PY-020 — Domaine Personnel (agents, dossiers, affectations, turnover)

- **Domaine :** Personnel
- **Priorité :** P1 — **Effort :** L
- **Dépendances :** PY-005, PY-006, PY-010
- **Description :**
  - Endpoints : `/personnel/agents` (list/create/update/get), `/personnel/agents/duplicate-*`, `/personnel/agents/merge`, `/personnel/agents/matricule-suggestion`, `/personnel/agents/{id}/document-compliance`, `/personnel/agents/{id}/audit-trail`, `/personnel/agents/{id}/digital-badge`, `/personnel/agents/{id}/export-pdf`, `/personnel/dossiers`, `/personnel/affectations`.
  - **Scoring turnover réécrit avec règles pondérées explicables** (équivalent fonctionnel `buildPersonnelTurnoverRiskItems`) — seul ce module valait la peine d'être conservé en logique. Filtrage par scope (manager voit uniquement sa direction).
  - Service `TurnoverScoringService` : pondération configurable, factors[] explicites, persisté dans `employee_turnover_risk_snapshots`.
- **Critères :**
  - Frontend `agent-list`, `agent-detail`, `personnel-turnover-risk` fonctionnent sans modification.
  - RBAC : turnover-risk lisible seulement par hr_manager + super_admin.
  - Audit sur create/update/merge.

## PY-021 — Domaine Documents (library + uploads + extraction queue)

- **Domaine :** Documents
- **Priorité :** P1 — **Effort :** L
- **Dépendances :** PY-020
- **Description :**
  - Endpoints `/documents/library`, `/documents/inbox`, `/documents/library/{ref}/sign`, `/documents/library/{ref}/assign`, `/documents/requests`.
  - Upload `/personnel/uploads`, `/recruitment/uploads` : validation MIME/extension, taille max, stockage local en V1 (migré S3 en PY-045).
  - File de traitement OCR (`document_extraction_queue`) : statuts PENDING/RUNNING/REVIEW_REQUIRED/COMPLETED/FAILED.
- **Critères :** parité fonctionnelle + audit sur sign/assign/upload.

## PY-022 — Domaine Recrutement (campagnes, applications, shortlists)

- **Domaine :** Recrutement
- **Priorité :** P1 — **Effort :** L
- **Dépendances :** PY-005, PY-021
- **Description :** Endpoints `/recruitment/*` (campaigns, applications, scores, shortlists, interviews, evaluations, onboarding, control-tower, executive-dashboard, BI export). Logique métier réécrite avec règles claires.
- **Note :** scoring CV reste **scoring déterministe explicable V1** (similar à mock mais sans pseudo-aléatoire) en attendant LLM en Vague 5.
- **Critères :** parité fonctionnelle avec frontend recrutement (5 pages).

## PY-023 — Domaine Congés (requests, balances, calendar)

- **Domaine :** Congés
- **Priorité :** P1 — **Effort :** M
- **Dépendances :** PY-005
- **Description :** Endpoints `/leave/requests`, `/leave/balances`, `/leave/events`. RBAC stricte : agent voit lui-même, manager voit son équipe, hr voit tout.
- **Critères :** parité + RBAC corrigé (vs mock GET non gardé).

## PY-024 — Domaine Workflows (definitions, instances, automation)

- **Domaine :** Workflows
- **Priorité :** P1 — **Effort :** M
- **Dépendances :** PY-005
- **Description :** Endpoints `/workflows/definitions`, `/workflows/instances`, `/workflows/instances/{id}/actions`, `/workflows/automation/*`. Moteur basique en V1 (équivalent mock) en attendant choix BPMN Vague 6.
- **Critères :** parité fonctionnelle.

## PY-025 — Domaine Notifications (inbox + delivery)

- **Domaine :** Notifications
- **Priorité :** P1 — **Effort :** M
- **Dépendances :** PY-005
- **Description :** Endpoints `/notifications/inbox`, `/notifications/inbox/{id}/read`, `/notifications/delivery-jobs`, `/notifications/process`. Worker arq pour traiter la file. Channel email via SMTP (PY-044), SMS optionnel (PY-073).
- **Critères :** parité + une notification persistée puis envoyée par email réel via PY-044.

## PY-026 — Domaine Admin (users, roles, audit-logs)

- **Domaine :** Admin
- **Priorité :** P1 — **Effort :** M
- **Dépendances :** PY-005, PY-006
- **Description :** Endpoints `/admin/users`, `/admin/roles`, `/admin/audit-logs`. Création/suspension utilisateur, attribution rôles + scopes, lecture audit paginée.
- **Critères :** parité + scope `super_admin` strict.

---

# VAGUE 3 — Domaines complémentaires + modules manquants

## PY-030 — Domaine Performance (campagnes + 360° anonymisé)

- **Domaine :** Performance
- **Priorité :** P1 — **Effort :** L
- **Dépendances :** PY-012 (tables 360°)
- **Description :**
  - Endpoints `/performance/campaigns`, `/performance/results` (parité existante).
  - **Nouveau** : `/performance/360-campaigns`, `/performance/360-invitations/{token}/respond` (endpoint public, token signé), `/performance/360-results/{employee_id}` (agrégé, masqué si < 3 répondants par catégorie).
  - Service `Survey360Service` : génération invitations, anonymisation, agrégation par dimension.
  - Anonymat structurel : la table `performance_360_responses` n'a pas de FK vers `users` (seulement vers l'invitation, qui est jetée à la clôture).
- **Critères :**
  - Test : 2 répondants collègues → résultat catégorie « collègues » masqué « N/A — répondants insuffisants ».
  - Audit : aucune requête côté hr_manager ne permet de retrouver l'identité d'un répondant.

## PY-031 — Domaine Formation (catalogue, sessions, demandes, éval froid, certificats)

- **Domaine :** Formation
- **Priorité :** P1 — **Effort :** L
- **Dépendances :** PY-012, PY-044 (email)
- **Description :**
  - Endpoints `/training/catalog`, `/training/sessions`, `/training/requests`, `/training/requests/{id}/decision` (parité).
  - **Nouveau** :
    - `/training/sessions/{id}/cold-evaluation/launch` (relance auto à J+90).
    - `/training/cold-eval/{token}/respond` (endpoint public).
    - `/training/sessions/{id}/issue-certificates` (génération PDF par participant validé).
  - Worker arq : scheduler quotidien qui détecte sessions à J+90 et envoie invitations cold-eval.
- **Critères :**
  - Une session terminée + 90j → invitations envoyées le lendemain.
  - Certificats générés persistés dans `documents` avec lien vers `training_certificates`.

## PY-032 — Domaine Carrière + GPEC (mappings, gaps)

- **Domaine :** GPEC
- **Priorité :** P1 — **Effort :** L
- **Dépendances :** PY-012
- **Description :**
  - Parité : `/careers/movements`.
  - **Nouveau** :
    - `/gpec/competencies` (référentiel CRUD + import CSV).
    - `/gpec/positions/{id}/requirements` (compétences attendues par poste).
    - `/gpec/snapshots` + `/gpec/gaps/critical` (cartographie écarts).
  - Service `CompetencyGapService.compute_snapshot(scope)` → écrit dans `competency_gaps_snapshots`.
- **Critères :** rapport écarts par direction + service téléchargeable CSV. Lien direct écart → formations recommandées.

## PY-033 — Domaine Discipline + Organization

- **Domaine :** Discipline / Org
- **Priorité :** P1 — **Effort :** M
- **Dépendances :** PY-012
- **Description :** Endpoints `/discipline/cases` + `/organization/units`, `/organization/positions/budgeted`, `/organization/positions/vacant`. Parité fonctionnelle.
- **Critères :** discipline persistée (vs mémoire dans mock).

## PY-034 — Domaines Reports + Modernization + Dashboard

- **Domaine :** Reporting
- **Priorité :** P1 — **Effort :** M
- **Dépendances :** PY-020 → PY-033
- **Description :** Endpoints `/reports/*`, `/modernization/summary`, `/dashboard/summary`, `/dashboard/pending-requests`. Réécrits proprement, agrégations SQL plutôt qu'en mémoire.
- **Critères :** dashboard charge en < 800 ms (vs mock qui calcule à la volée).

## PY-035 — Auto-approbation conditionnelle des congés

- **Domaine :** Congés
- **Priorité :** P1 — **Effort :** M
- **Dépendances :** PY-023, PY-036 (planning service)
- **Description :**
  - Table `leave_auto_approval_rules` (paramétrage métier).
  - Service `LeaveAutoApprovalService.evaluate(request)` → APPROVE / REJECT / ROUTE_HUMAN.
  - Conditions cumulatives : durée ≤ N jours + quota OK + service non sous-effectif (jointure avec PY-036) + hors période critique.
- **Critères :** demande 1 j hors clôture, quota OK → approuvée < 5 s + audit + notif manager.

## PY-036 — Planning continuité service (présence min, conflits)

- **Domaine :** Congés
- **Priorité :** P1 — **Effort :** L
- **Dépendances :** PY-023
- **Description :**
  - Table `leave_service_coverage_rules`.
  - Endpoint `/leave/service-coverage/check` (preview impact d'une nouvelle demande).
  - Endpoint `/leave/service-coverage/calendar` (vue agrégée par service / période).
- **Critères :** demande qui violerait le seuil minimal de présence → bandeau d'alerte côté frontend (déjà préparé par PY-040 côté front).

---

# VAGUE 4 — Intégrations externes

> Toutes les intégrations passent par un **port (interface)** + adapters. Le choix de provider est piloté par variable d'env.

## PY-040 — Abstraction OCR + adapter Mock + adapter Tesseract

- **Domaine :** OCR
- **Priorité :** P1 — **Effort :** M
- **Dépendances :** PY-021
- **Description :**
  - Interface `DocumentExtractionPort` (Protocol Python) : `async extract(buffer, document_type) -> ExtractionResult`.
  - Adapters : `MockOcrAdapter`, `TesseractAdapter` (recommandé souverain), `AzureFormRecognizerAdapter`, `AwsTextractAdapter`.
  - Sélection : `OCR_PROVIDER` env var.
  - Stockage du résultat brut dans `document_analysis_runs.raw_response_jsonb` (réutilisation table existante).
- **Critères :** 4 adapters implémentent la même interface. Tests par adapter avec fixtures.

## PY-041 — Worker OCR async (arq) + revue humaine

- **Domaine :** OCR
- **Priorité :** P1 — **Effort :** L
- **Dépendances :** PY-040
- **Description :**
  - Worker arq écoute `document_extraction_queue`.
  - À l'upload, `/personnel/uploads` enqueue → renvoie immédiatement avec status `PENDING`.
  - Worker traite, écrit champs extraits, déclenche notification gestionnaire RH si `REVIEW_REQUIRED`.
  - Frontend `documents/ocr-review` (déjà à créer côté Angular en parallèle).
  - Endpoint `/documents/{ref}/extracted-fields/{id}/validate` (humain valide ou corrige). Toute correction stockée pour amélioration future.
- **Critères :** upload PDF 10 Mo répond < 500 ms ; champ extrait n'écrase jamais le dossier sans validation humaine.

## PY-042 — Abstraction signature + adapter Mock + adapter Universign (sandbox)

- **Domaine :** Signature
- **Priorité :** P1 — **Effort :** L
- **Dépendances :** PY-021
- **Description :**
  - Interface `SignaturePort` : `create_envelope`, `send_for_signing`, `get_status`, `download_signed`, `verify_signature`.
  - Adapters : `MockSignatureAdapter` (SHA-256 + verification code, conserve fonctionnalité actuelle), `UniversignAdapter`, `YousignAdapter`, `EndesiveLocalAdapter` (PAdES on-prem si PKI dispo).
  - Tables `signature_envelopes`, `signature_audit_trail`.
  - Endpoint `/api/v1/public/verify/{verification_code}` retourne le statut + signataire + empreinte SHA-256, sans authentification.
- **Critères :** doc signé via Universign sandbox récupérable et vérifiable. Empreinte SHA-256 + verification_code persistés en plus de la signature provider.
- **Note souveraineté :** privilégier `EndesiveLocalAdapter` si la Primature dispose d'une PKI gouvernementale.

## PY-043 — Génération PDF (WeasyPrint) + templates dossiers versionnés

- **Domaine :** PDF
- **Priorité :** P2 — **Effort :** M
- **Dépendances :** PY-042
- **Description :**
  - Migration de `buildSimplePdf` (mock) vers WeasyPrint (HTML+CSS → PDF qualité production).
  - Templates Jinja2 versionnés dans `app/templates/pdf/` (dossier-agent, certificat-formation, attestation, dossier-export).
  - Snapshot du template appliqué : `employee_dossier_exports.template_version`.
  - QR code de vérification embarqué (lien public PY-042).
- **Critères :** PDF officiel avec en-tête Primature, watermark, QR de vérification.

## PY-044 — Connecteur SMTP / SendGrid pour notifications email

- **Domaine :** Notifications
- **Priorité :** P1 — **Effort :** M
- **Dépendances :** PY-025
- **Description :**
  - Interface `EmailSenderPort`. Adapters : `SmtpAdapter` (aiosmtplib), `SendgridAdapter`.
  - Templates Jinja2 par catégorie d'événement.
  - Worker arq traite la file `hr.notifications` (PENDING → SENT/FAILED), retry exponentiel.
- **Critères :** une demande de congé déclenche un email manager < 30 s. Audit `EMAIL_SENT` / `EMAIL_FAILED`.

## PY-045 — Stockage objets MinIO/S3 + URL signées + chiffrement at-rest

- **Domaine :** Stockage
- **Priorité :** P1 — **Effort :** M
- **Dépendances :** PY-021
- **Description :**
  - Interface `ObjectStoragePort`. Adapters : `LocalFsAdapter` (dev), `MinioS3Adapter` (boto3).
  - Migration `mock-backend/uploads/` → bucket MinIO `rh-primature-documents`.
  - Préfixe `org_id/employee_id/<sha256>.<ext>`.
  - SSE-S3 (chiffrement at-rest) ou SSE-KMS si KMS disponible.
  - URL signées pour téléchargement (TTL 5 min).
- **Critères :** aucun fichier sensible sur le FS du serveur applicatif. Téléchargement = URL signée.
- **Recommandation souveraine :** MinIO on-prem dans le datacenter de la Primature.

---

# VAGUE 5 — IA réelle (LLM)

## PY-050 — Service LLM (anthropic SDK) + prompt cache

- **Domaine :** IA
- **Priorité :** P1 — **Effort :** M
- **Dépendances :** —
- **Description :**
  - Interface `LlmPort.generate(messages, system, max_tokens, response_format)`.
  - Adapter `AnthropicClaudeAdapter` (claude-opus-4-7 par défaut, claude-sonnet-4-6 pour tâches plus légères).
  - Adapter `OpenAiAdapter` en option.
  - Adapter `OllamaLocalAdapter` (souverain) pour déploiement local éventuel.
  - Cache prompt (Anthropic prompt caching) sur prompts système répétés.
  - Sélection : `LLM_PROVIDER` env var.
  - Plafond mensuel par organization_id (alerte Sentry si > X USD).
- **Critères :** réponse JSON structurée (Pydantic) en < 5 s p95.

## PY-051 — Service Matching CV explicable (LLM)

- **Domaine :** Recrutement
- **Priorité :** P1 — **Effort :** L
- **Dépendances :** PY-040 (extraction texte CV), PY-050
- **Description :**
  - `CvMatchingService.score(application_id, job_description) -> CvMatchingResult`.
  - Prompt structuré : poste + texte CV → JSON `{ skillsMatch: 0-100, experienceMatch, educationMatch, gaps: [], strengths: [], confidence }`.
  - Audit IA : prompt + réponse complets stockés dans `recruitment_applications.metadata.cv_matching_run`.
  - **Validation humaine obligatoire** : score IA = suggestion. Le recruteur clique « accepter » ou « ajuster ».
  - Suppression du `deriveRecruitmentPseudoScore` du mock.
- **Critères :** score expliqué par 3-5 raisons textuelles. Coût < 0,05 USD/CV.
- **Risque souveraineté :** signaler avant déploiement que les CV sont envoyés à un LLM tiers. Alternative : Ollama local.

## PY-052 — Génération adaptative grille d'entretien

- **Domaine :** Recrutement
- **Priorité :** P1 — **Effort :** M
- **Dépendances :** PY-051
- **Description :**
  - Endpoint `POST /recruitment/applications/{id}/generate-interview-grid`.
  - LLM génère N questions par compétence + zones de doute identifiées dans le matching.
  - Grille éditable par le recruteur avant usage (frontend existant `interview-question-bank`).
- **Critères :** grille générée en < 10 s. Recruteur peut éditer/valider.

## PY-053 — Filtrage questions discriminatoires

- **Domaine :** Recrutement
- **Priorité :** P1 (réglementaire) — **Effort :** S
- **Dépendances :** PY-052
- **Description :**
  - Liste de patterns regex (âge, situation familiale, religion, opinion politique, état de santé, origine ethnique).
  - Vérification additionnelle par classifieur LLM léger.
  - Reject avec raison à l'auteur.
- **Critères :** test : « Quel âge avez-vous ? » → rejeté avec message clair.

## PY-054 — Conversion automatisée candidat → agent

- **Domaine :** Recrutement / Onboarding
- **Priorité :** P1 — **Effort :** M
- **Dépendances :** PY-020, PY-022
- **Description :**
  - `POST /recruitment/applications/{id}/hire` : crée l'employee, transfère pièces validées (les non-validées **ne** sont **pas** transférées), génère matricule, crée user + droits, lance parcours onboarding.
  - Transactionnel (rollback si étape échoue).
  - Audit `CANDIDATE_HIRED` + notifications IT/paie/logement.
- **Critères :** un candidat retenu → employé en 1 clic, pas de ressaisie.

## PY-055 — Prim'Assistant : endpoint LLM + intentions + autorisation

- **Domaine :** AI Assistant
- **Priorité :** P1 — **Effort :** L
- **Dépendances :** PY-050
- **Description :**
  - Endpoint `POST /api/v1/ai-assistant/chat` (auth obligatoire).
  - Pipeline : message → classification intent (LLM) → vérification droits (PY-005) → action draft → confirmation utilisateur explicite → exécution + audit.
  - Intentions V1 : `LEAVE_REQUEST_CREATE`, `ATTESTATION_REQUEST`, `STATUS_CHECK`, `HR_FAQ`.
  - Fallback humain si intention non reconnue.
  - Suppression de la KB statique côté frontend.
- **Critères :** aucune action créée sans confirmation utilisateur. Le bot vérifie les droits avant de proposer une action. Audit `AI_ASSISTANT_ACTION` enregistré.

---

# VAGUE 6 — Workflow BPMN réel

## PY-060 — Décision : SpiffWorkflow vs Camunda 7 sidecar vs Maintien

- **Domaine :** Workflows
- **Priorité :** P1 (décisionnel) — **Effort :** S (étude)
- **Dépendances :** —
- **Description :**
  - **SpiffWorkflow** (Python pur) — recommandé : pas de stack JVM additionnelle, BPMN 2.0 standard.
  - Camunda 7 sidecar (Spring Boot) — plus mature mais introduit JVM.
  - Maintien moteur maison amélioré.
- **Livrable :** decision record + recommandation. Recommandation par défaut : **SpiffWorkflow**.

## PY-061 — Modèles BPMN versionnés (`bpmn/`)

- **Domaine :** Workflows
- **Priorité :** P1 — **Effort :** M
- **Dépendances :** PY-060
- **Description :**
  - Dossier `Final/bpmn/` à la racine.
  - Modèles `.bpmn` (bpmn.io editor) : congés, attestations, recrutement, mobilité, formation.
  - Versionnés dans Git, loader au boot.

## PY-062 — Implémentation moteur retenu + connecteurs API

- **Domaine :** Workflows
- **Priorité :** P1 — **Effort :** L
- **Dépendances :** PY-061
- **Description :**
  - Si SpiffWorkflow : intégration directe Python.
  - Connecteurs : tâches utilisateur ↔ endpoints REST, événements ↔ table `workflow_instance_events`.
  - Migration des workflows existants (3 templates seed) vers les modèles BPMN.
- **Critères :** 1 demande de congé suit le workflow BPMN versionné de bout en bout.

---

# VAGUE 7 — Cutover (bascule frontend vers Python)

## PY-070 — Tests E2E Playwright contre nouveau backend

- **Domaine :** Qualité / Cutover
- **Priorité :** P0 (avant bascule) — **Effort :** M
- **Dépendances :** Vagues 2-3 complètes
- **Description :**
  - Réutiliser les tests Playwright existants (`Final/tests/`) en pointant vers le backend Python.
  - Couverture parcours critiques par rôle : login, agent CRUD, demande congé, validation, recrutement, formation, signature.
  - Tests load (Locust) sur dashboards et listes (10 utilisateurs concurrents minimum).
- **Critères :** 100 % des e2e existants passent contre Python. p95 < 800 ms sur dashboard.

## PY-071 — Bascule `proxy.conf.json` + retrait Node.js

- **Domaine :** Cutover
- **Priorité :** P0 — **Effort :** S
- **Dépendances :** PY-070
- **Description :**
  - `Final/proxy.conf.json` : `/api/*` → `http://localhost:8000` (uvicorn) au lieu de `:8080`.
  - `Final/package.json` : `start:api` lance le backend Python (via docker-compose).
  - Documentation `Final/README.md` mise à jour.
- **Critères :** `npm run start:e2e` lance frontend + backend Python automatiquement.

## PY-072 — Décommissionnement `mock-backend/` Node.js

- **Domaine :** Cutover
- **Priorité :** P1 — **Effort :** S
- **Dépendances :** PY-071 + 2 semaines stabilité prod
- **Description :**
  - Archivage : déplacer `mock-backend/` vers `Final/_legacy/mock-backend-nodejs/` avec README explicatif.
  - Suppression des dépendances Node.js inutilisées dans `package.json` (gardées que frontend).
- **Critères :** plus aucun import de `mock-backend/` dans le code actif. Build/CI verts.

---

# VAGUE 8 — Hardening (P2/P3)

## PY-080 — SSO Keycloak (OIDC) self-hosted

- **Domaine :** Sécurité
- **Priorité :** P2 — **Effort :** L
- **Description :** Migrer auth maison vers Keycloak. Lib : `python-keycloak` ou `authlib`. Conserver `users` en lecture pour mappings rôles/scopes. Décision politique requise.

## PY-081 — Sentry + OpenTelemetry observabilité

- **Domaine :** Observabilité
- **Priorité :** P2 — **Effort :** M
- **Description :** SDK `sentry-sdk[fastapi]` + `opentelemetry-instrumentation-fastapi`. Dashboards Grafana + traces. Variables `SENTRY_DSN`, `OTEL_*`.

## PY-082 — 2FA TOTP (pyotp) pour rôles privilégiés

- **Domaine :** Sécurité
- **Priorité :** P2 — **Effort :** M
- **Description :** TOTP obligatoire pour `super_admin` et `hr_manager`. Endpoints `/auth/2fa/setup`, `/auth/2fa/verify`. QR code de provisioning.

## PY-083 — Chiffrement champs sensibles (cryptography)

- **Domaine :** Sécurité
- **Priorité :** P2 — **Effort :** M
- **Description :** `national_id`, données médicales, etc. chiffrées au repos via `cryptography.Fernet` (clés en KMS si dispo). Migration script.

## PY-084 — Partitionnement `audit_logs` + politique rétention

- **Domaine :** BDD / Compliance
- **Priorité :** P2 — **Effort :** M
- **Description :** Partition mensuelle PostgreSQL. Archivage > 5 ans selon politique RH.

## PY-085 — Tests load (Locust) + tuning

- **Domaine :** Qualité
- **Priorité :** P2 — **Effort :** M
- **Description :** Scénarios 50/100/200 utilisateurs concurrents. Identification goulots, tuning pool DB / workers uvicorn / index SQL.

## PY-086 — Documentation déploiement (Docker, K8s Helm)

- **Domaine :** DevOps
- **Priorité :** P2 — **Effort :** M
- **Description :** Helm chart pour déploiement K8s (si infra Primature K8s). Sinon docker-compose production.

## PY-087 — SMS Twilio / opérateurs locaux

- **Domaine :** Notifications
- **Priorité :** P3 — **Effort :** S
- **Description :** SMS pour escalades critiques. Compatible opérateurs guinéens (Orange GN, MTN GN). SDK `twilio` Python.

---

# 3. Ordonnancement recommandé (chemin critique)

```
Vague 0 (bootstrap)
   PY-001 → PY-002 → PY-003 → PY-004 → PY-005 → PY-006 → PY-007
                          ↓
Vague 1 (modèles + migrations)
   PY-010 → PY-011 → PY-012 → PY-013
                          ↓
Vague 2 (domaines cœur)
   PY-020 / PY-023 / PY-026 (parallélisables) → PY-021 → PY-022 → PY-024 → PY-025
                          ↓
Vague 3 (modules manquants)
   PY-030 (360°) // PY-031 (formation) // PY-032 (GPEC) // PY-033 // PY-034
   PY-036 (planning) → PY-035 (auto-approbation)
                          ↓
Vague 4 (intégrations) — peut commencer dès Vague 2 OK
   PY-040 → PY-041 // PY-042 → PY-043 // PY-044 → PY-025 boucle // PY-045
                          ↓
Vague 5 (IA) — démarre dès PY-040 OK pour les CV
   PY-050 → PY-051 → PY-052 → PY-053 // PY-054 // PY-055
                          ↓
Vague 6 (BPMN)
   PY-060 → PY-061 → PY-062
                          ↓
Vague 7 (cutover)
   PY-070 → PY-071 → (2 semaines stabilité) → PY-072
                          ↓
Vague 8 (hardening) — PY-081 (Sentry) à introduire dès Vague 2
```

**Parallélisation 2 devs :**
- Dev A (cœur) : Vague 0 → Vague 1 → Vague 2 → Vague 3 (PY-035, PY-036) → Vague 6 (BPMN) → Vague 7
- Dev B (intégrations + IA) : démarre Vague 4 dès PY-021 OK → Vague 5 → Vague 8

---

# 4. Risques techniques majeurs

| Risque | Tickets | Mitigation |
|--------|---------|------------|
| Souveraineté données (cloud étranger) | PY-040, PY-042, PY-045, PY-050 | Adapters `Tesseract`, `Endesive`, `MinIO`, `Ollama` souverains par défaut. Décision politique requise avant d'activer Azure/AWS/Anthropic. |
| Drift schéma SQLAlchemy ↔ SQL existant | PY-010, PY-011 | Script `check_schema_drift.py` en CI. Reprise schéma 001-004 conservée à l'identique. |
| Régression frontend pendant migration | Vague 2 | Tests E2E Playwright tournent contre les 2 backends en parallèle pendant la transition. |
| Performance OCR / LLM | PY-041, PY-051 | File async (arq), timeout strict, cache prompts, plafond mensuel. |
| Anonymat 360° contournable | PY-030 | Tests adversariaux (un hr_manager peut-il deviner ?). Masquage commentaires < seuil. |
| Adoption métier IA | PY-051, PY-055 | UX = suggestion + validation humaine, jamais décision auto. Communication DRH. |
| Coût LLM imprévisible | PY-050 | Plafond mensuel par org_id, alertes Sentry, cache prompt. |
| Cutover risqué | PY-071 | Feature flag par module (proxy peut router certaines routes vers Node, d'autres vers Python pendant 2-4 semaines). |
| Volume audit logs | PY-006 | Partitionnement (PY-084) dès dépassement 1M lignes. |
| Multi-instance / concurrence | PY-003 | SQLAlchemy async pool + locks PG sur tâches uniques. |

---

# 5. Indicateurs de réussite (mesurés en fin de Vague 7)

- 0 mot de passe en clair (mémoire, DB, log).
- 100 % des routes API ont une dépendance RBAC explicite.
- 100 % des modules frontend ont un `permissionGuard` (ticket frontend séparé en parallèle de PY-020).
- 100 % des mutations sensibles génèrent une entrée `audit_logs` SQL.
- 0 collection métier sans persistance SQL.
- 0 SDK IA mocké en production.
- 100 % des routes documentées dans OpenAPI auto-généré (`/docs`).
- Couverture tests : ≥ 80 % services back, ≥ 70 % composants critiques front.
- Temps boot prod < 15 s.
- Backend Node.js décommissionné (PY-072).

---

# 6. Questions ouvertes à arbitrer avant Vague 4

1. **OCR provider** : Tesseract on-prem (souverain, gratuit, précision ~85 %) ou Azure Form Recognizer (cloud étranger, précision ~95 %) ?
2. **Signature** : Universign sandbox initial puis prod, ou attente PKI gouvernementale guinéenne (`endesive`) ?
3. **LLM** : Anthropic Claude (Opus 4.7 via API) ou Ollama local (Llama 3.1 70B sur GPU) — selon budget GPU disponible ?
4. **Stockage** : MinIO on-prem dans le DC de la Primature (recommandé) ou S3 AWS ?
5. **SSO** : Keycloak self-hosted (recommandé) ou intégration AD interne déjà existant ? Si AD : LDAPS ou OIDC bridge ?
6. **BPMN** : SpiffWorkflow (Python pur) ou Camunda 7 sidecar (introduit JVM) ?
7. **Hébergement** : Railway (config actuelle), Kubernetes managé (OVH/Scaleway), ou DC souverain Primature ?
8. **Politique rétention audits + dossiers** : combien d'années (5 ans / 10 ans / 99 ans) ?
9. **Périmètre 360° V1** : qui peut déclencher une campagne ? Quels rôles voient les résultats agrégés ? Seuil minimum confirmé à 3 répondants ?
10. **Reset password lors de la migration** : forcé pour tous les users existants ou conservé jusqu'au prochain login ?

---

# 7. Démarrage immédiat (Vague 0)

Si validation, le premier sprint Vague 0 (5-7 jours, 1 dev) délivre :

- ✅ Squelette projet `Final/backend/` opérationnel.
- ✅ Settings 12-factor avec validation au boot.
- ✅ Connexion PostgreSQL async + Alembic baseline matchant le schéma existant.
- ✅ Auth bcrypt + JWT + rate-limiting login.
- ✅ RBAC dépendance FastAPI + scopes.
- ✅ Audit writer transactionnel.
- ✅ CI GitHub Actions verte (lint + types + tests + Docker build).

À l'issue de la Vague 0, le backend Python expose `/api/v1/health`, `/api/v1/auth/login`, `/api/v1/auth/refresh`, `/api/v1/admin/audit-logs` et est prêt à recevoir les domaines (Vague 2).

**Statut :** plan révisé Python prêt pour validation.

Réponses possibles :
- ✅ **« Lance Vague 0 »** → j'enchaîne PY-001 à PY-007 en autonomie.
- 🟡 ajustements sur le plan (ordonnancement, choix tech).
- ❓ réponses aux questions ouvertes section 6 (au minimum : OCR provider + LLM provider + stockage souverain ou non, à arbitrer avant Vague 4).
