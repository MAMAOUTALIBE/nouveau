# Contrats API - Integration Front RH

Ce document decrit les endpoints consommes par le front Angular et les champs attendus.
Le front supporte les variantes `camelCase` et `snake_case` sur les payloads de lecture.

## Base URL

- `environment.api.baseUrl`
- Valeur par defaut: `/api/v1`
- Timeout par requete: `environment.api.timeoutMs` (defaut `15000` ms)
- En developpement Angular, `/api/*` est proxyfie vers `http://localhost:8080` via `proxy.conf.json`

## Endpoints

### Authentification
- `POST /auth/login`
  - Body: `{ username, password }`
  - Reponse attendue: `{ accessToken|token, refreshToken?, username?, user? }`
- `POST /auth/refresh`
  - Body: `{ refreshToken }`
  - Reponse attendue: `{ accessToken|token, refreshToken? }`

### Dashboard
- `GET /dashboard/summary`
- `GET /dashboard/pending-requests`

### Personnel
- `GET /personnel/agents`
  - Query supportee: `q`, `direction`, `status`, `page`, `limit`, `sortBy`, `sortOrder`
- `GET /personnel/agents/:id`

### Organisation
- `GET /organization/units`
- `GET /organization/positions/budgeted`
- `GET /organization/positions/vacant`
  - Query commune (listes): `q`, `page`, `limit`, `sortBy`, `sortOrder`
  - Filtres metier selon endpoint (exemple): `status`, `structure`, `priority`

### Recrutement
- `GET /recruitment/applications`
- `GET /recruitment/campaigns`
- `GET /recruitment/onboarding`
  - Query commune: `q`, `page`, `limit`, `sortBy`, `sortOrder`
  - Filtres metier: `status`, `campaign`, `department`, `agent`, `position`

### Carriere
- `GET /careers/movements?type=Avancement|Mutation|Detachement|Promotion`
  - Query additionnelle: `q`, `status`, `agent`, `page`, `limit`, `sortBy`, `sortOrder`

### Absences
- `GET /leave/requests`
- `GET /leave/balances`
- `GET /leave/events`
  - Query commune: `q`, `page`, `limit`, `sortBy`, `sortOrder`
  - Filtres metier: `status`, `type`, `agent`

### Performance
- `GET /performance/campaigns`
- `GET /performance/results`
  - Query commune: `q`, `page`, `limit`, `sortBy`, `sortOrder`
  - Filtres metier: `status`, `population`, `direction`

### Formation
- `GET /training/sessions`
- `GET /training/catalog`
  - Query commune: `q`, `page`, `limit`, `sortBy`, `sortOrder`
  - Filtres metier: `status`, `location`, `domain`, `modality`

### Discipline
- `GET /discipline/cases`
  - Query: `q`, `status`, `agent`, `page`, `limit`, `sortBy`, `sortOrder`

### Documents
- `GET /documents/library`
  - Query: `q`, `status`, `type`, `owner`, `page`, `limit`, `sortBy`, `sortOrder`

### Workflows
- `GET /workflows/definitions`
- `GET /workflows/instances`

### Administration
- `GET /admin/users`
- `GET /admin/roles`
- `GET /admin/audit-logs`
  - Query commune: `q`, `page`, `limit`, `sortBy`, `sortOrder`
  - Filtres metier: `status`, `role`, `direction`, `user`, `action`

## Notes d integration

- Les services front acceptent aussi les reponses encapsulees: `{ data: ... }`.
- En cas d erreur API, un toast global est affiche via l interceptor d erreur.
- Les erreurs `401` declenchent un refresh token puis une deconnexion si echec.
- Les erreurs API sont normalisees (`NETWORK_UNREACHABLE`, `TIMEOUT`, `VALIDATION`, etc.) pour avoir des messages coherents.
- Pour les erreurs de validation backend, le payload peut contenir `errors: string[]` (ex: `POST /personnel/agents`).
