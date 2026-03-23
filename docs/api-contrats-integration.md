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
- `GET /personnel/agents/:id`

### Organisation
- `GET /organization/units`
- `GET /organization/positions/budgeted`
- `GET /organization/positions/vacant`

### Recrutement
- `GET /recruitment/applications`
- `GET /recruitment/campaigns`
- `GET /recruitment/onboarding`

### Carriere
- `GET /careers/movements?type=Avancement|Mutation|Detachement|Promotion`

### Absences
- `GET /leave/requests`
- `GET /leave/balances`
- `GET /leave/events`

### Performance
- `GET /performance/campaigns`
- `GET /performance/results`

### Formation
- `GET /training/sessions`
- `GET /training/catalog`

### Discipline
- `GET /discipline/cases`

### Documents
- `GET /documents/library`

### Workflows
- `GET /workflows/definitions`
- `GET /workflows/instances`

### Administration
- `GET /admin/users`
- `GET /admin/roles`
- `GET /admin/audit-logs`

## Notes d integration

- Les services front acceptent aussi les reponses encapsulees: `{ data: ... }`.
- En cas d erreur API, un toast global est affiche via l interceptor d erreur.
- Les erreurs `401` declenchent un refresh token puis une deconnexion si echec.
- Les erreurs API sont normalisees (`NETWORK_UNREACHABLE`, `TIMEOUT`, `VALIDATION`, etc.) pour avoir des messages coherents.
