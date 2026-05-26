# ADR-015 — JWT cookie httpOnly pour l'authentification frontend

* **Statut** : accepted
* **Date** : 2026-05-26
* **Sponsor** : RSSI Primature × DSI Primature
* **Décideurs** : Pipeline strict 5-gates (Claude Code, Anthropic) ; revue
  finale RSSI Primature
* **Périmètre** : backend FastAPI (`backend/app/core/security`,
  `backend/app/api/v1/auth.py`), frontend Angular (`src/app/core/interceptors`,
  `src/app/shared/services/auth.service.ts`), audit ANSSI pré-livraison
  gouvernementale Primature Guinée
* **Contexte de l'audit** : pré-livraison gouvernementale Primature Guinée,
  cadre de la loi 037/AN/2016 relative à la cybersécurité et à la protection
  des données à caractère personnel

## Contexte

Avant cette ADR, l'authentification Angular stockait le JWT dans
`localStorage` (clés `rh_token`, `rh_refresh_token`), avec un header
`Authorization: Bearer` injecté par intercepteur HTTP.

L'audit sécurité initial (Sub-A G5 du chantier PII, cycle C12) avait classé
ce point comme **[HAUT]** :

- Toute faille XSS exfiltre immédiatement le token (lecture `localStorage`
  triviale en JS, sans contrôle d'origine).
- Pas de protection en cas de fuite par script tiers chargé par erreur dans
  le bundle Angular.
- Pas de mécanisme de révocation côté client (logout déclaratif uniquement).

La cible WCAG/RGPD-adjacent et la livraison gouv Primature Guinée (loi
037/AN/2016, articles 21 et 27 — obligation de moyens raisonnables sur la
protection des données d'authentification) exigent un standard plus
défensif.

## Options envisagées

### Option A — Conserver Bearer + localStorage
- ✅ Simple, ne casse rien, compat scripts cURL et tests E2E
- ❌ XSS = vol immédiat du token (lecture JS triviale)
- ❌ Verdict audit Sub-A G5 : **HAUT** — rejeté

### Option B — Bearer + sessionStorage
- ✅ Volatile (perte à fermeture onglet)
- ❌ XSS exfiltre tout de même le token tant que l'onglet est ouvert
- ❌ Rejeté

### Option C — Bearer + variable mémoire (pas de stockage)
- ✅ XSS-résistant si rigueur (pas de logging du token)
- ❌ Refresh navigateur = perte de session, friction utilisateur forte
- ❌ Rejeté pour raisons UX (agents RH, sessions longues)

### Option D — Cookie httpOnly + Secure + SameSite=Lax
- ✅ Cookie invisible au JS → XSS ne peut plus lire le token
- ✅ Sessions persistent au refresh navigateur
- ✅ Compat OIDC + email links (SameSite=Lax)
- 🟡 Risque CSRF résiduel sur POST cross-site → mitigé par CORS strict
  (`allow_origins` explicite) et SameSite=Lax (rejet des state-changing
  cross-site)
- ✅ Adopté

## Décision

Migrer le stockage du JWT vers **cookie httpOnly + Secure + SameSite=Lax**
(option D).

Choix techniques (détaillés en sections suivantes) :

- **2 cookies séparés** : `rh_access` (`path=/`) et `rh_refresh`
  (`path=/api/v1/auth/refresh`) — scoping minimal du refresh token.
- **SameSite=Lax** : compat OIDC + email links, rejet CSRF state-changing
  cross-site.
- **Secure forcé** en STAGING/PROD via validator Pydantic
  (`JWT_COOKIE_SECURE=true`).
- **Domain vide** (cookie host-only, plus sûr que `Domain=.example.gn`).
- **Bearer header maintenu en lecture uniquement** pour compat tests E2E et
  scripts cURL (le serveur lit d'abord le cookie, puis le header en repli).
- **Flag `jwt_return_token_in_body`** : `true` en dev, `false` en prod via
  validator Pydantic (token absent du body de réponse en prod).
- **Rate-limit `/refresh` dédié** : 10 tentatives / 60 s, lock 5 min.
- **Révocation Redis hors scope V1.0** (pas de Redis disponible dans
  l'infra Primature actuelle ; logout reste déclaratif côté serveur — voir
  TODO V1.1+).

## Conséquences

### Positives

- Cookie invisible au JS → XSS ne peut plus lire le token.
- Sessions persistent au refresh navigateur (vs option C memory-only).
- 2 cookies séparés = path scoping minimise l'exposition du refresh token.
- Validators Pydantic forcent les flags sûrs en prod (Secure=True, body sans
  token) — refus au boot si conf incohérente.
- Tests E2E et scripts cURL continuent de fonctionner via Bearer header en
  lecture.
- Audit grep : aucun token loggé dans les events structlog.

### Négatives et risques

- **Risque CSRF résiduel** sur POST cross-site → mitigé par CORS strict
  (`allow_origins` explicite, pas de wildcard) et SameSite=Lax (rejet des
  state-changing cross-site). À ré-évaluer si l'audit ANSSI exige
  double-submit CSRF token.
- **Sessions actives existantes invalidées au déploiement** : les
  utilisateurs disposant d'une session basée sur `localStorage` devront se
  reconnecter une fois (voir plan de migration).
- **Logout reste déclaratif** : le cookie est effacé côté client (`Max-Age=0`)
  mais le JWT reste valide jusqu'à son expiration (30 min). Révocation
  Redis prévue V1.1.
- **`/auth/me` endpoint pas encore implémenté** → `hasSession()` côté
  frontend reste optimiste (validation serveur via flux `401 → refresh →
  logout`). À implémenter V1.1.

### À mettre en place

- Backend : helpers `set_auth_cookies` / `clear_auth_cookies`, lecture
  prioritaire du cookie dans `get_current_user`, validators Pydantic.
- Frontend : intercepteur `withCredentials: true`, retrait du stockage
  `localStorage` (sauf `rh_username` pour le rappel UX optionnel),
  adaptation `auth.service.ts` (login/refresh/logout sans token côté client).
- Ops : variables d'env `JWT_COOKIE_*` à provisionner (cf. runbook
  `docs/security/auth_runbook.md`).

## Plan de migration utilisateurs

1. Déploiement coordonné : backend + frontend en même temps (un cycle de
   release atomique).
2. Communication 48 h avant : bandeau in-app + email DSI Primature aux
   référents direction.
3. Au premier accès post-déploiement, les utilisateurs avec une session
   active basée sur `localStorage` seront déconnectés (401 sur première
   requête API) et redirigés vers `/auth/login`.
4. Le nouveau login pose le cookie httpOnly automatiquement ; aucune action
   utilisateur supplémentaire.

## Références d'implémentation

- Backend Sub-1+2+3 : PR #9 (commit `e09b4157`).
- Frontend Sub-4 : PR #10 (commit `b53fe4cd`).
- Backend, code clés :
  - `backend/app/core/security/cookies.py` (helpers set/clear)
  - `backend/app/api/v1/auth.py` (login, refresh, logout)
  - `backend/app/core/security/rbac.py` (`get_current_user` lit cookie d'abord)
  - `backend/app/core/config.py` (settings + validators)
- Frontend, code clés :
  - `src/app/core/interceptors/credentials.interceptor.ts`
  - `src/app/shared/services/auth.service.ts`

## Sécurité — vérifications réalisées

- 15 tests backend dédiés (`backend/tests/test_auth_cookies.py`).
- 5 tests intercepteur credentials + 9 tests `auth.service.spec.ts`
  (frontend).
- Validators Pydantic refusent le boot en STAGING/PROD si
  `JWT_COOKIE_SECURE=false` ou `JWT_RETURN_TOKEN_IN_BODY=true`.
- Aucun token loggé (audit `grep -r` dans `backend/app` et `src/app`).

## TODO V1.1+

- Révocation Redis au logout (blacklist JTI jusqu'à expiration).
- Endpoint `/auth/me` pour validation cookie au boot frontend (au lieu du
  fallback `rh_username` optimiste).
- 2FA TOTP pour les rôles `super_admin` et `RH`.
- Double-submit CSRF token (si SameSite=Lax jugé insuffisant après audit
  ANSSI).

## Validation

* À valider par : RSSI Primature + DSI Primature (post-merge PR #11).
* Document(s) de référence : `docs/security/auth_runbook.md` (procédures
  ops), `docs/security/pii_migration_runbook.md` (chiffrement PII),
  `docs/registre-traitements.md` (traitement T-01).
