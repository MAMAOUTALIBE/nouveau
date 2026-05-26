# Runbook : Authentification JWT cookie httpOnly (Sub-5 Auth)

> **Périmètre** : exploitation en production de l'authentification JWT par
> cookie httpOnly (backend FastAPI + frontend Angular).
> **Public** : équipe DSI Primature, RSSI Primature, ops de garde.
> **Version** : 1.0 — initiale (Sub-5 JWT cookie, cycle C13).
> **Dernière mise à jour** : 2026-05-26.
> **Cadre juridique** : loi 037/AN/2016 relative à la cybersécurité et à la
> protection des données à caractère personnel.
> **Décision associée** : [ADR-015](../decisions/ADR-015-jwt-httponly-cookie.md).

## Objectif

Décrire les procédures d'exploitation pour la chaîne d'authentification
JWT par cookie httpOnly :

- variables d'environnement critiques à provisionner,
- procédure de rotation du secret JWT,
- procédure d'urgence en cas de fuite suspectée,
- vérification post-déploiement,
- monitoring et alertes.

## Variables d'environnement critiques (prod)

À provisionner dans `/etc/rh-primature/secrets.env` (ou équivalent
Secret Manager — cf. ADR-004) avant tout déploiement.

```
JWT_SECRET_KEY                     # >= 32 chars, généré via `openssl rand -hex 32`
JWT_ACCESS_TTL_SECONDS=1800        # 30 min
JWT_REFRESH_TTL_SECONDS=86400      # 24 h
JWT_COOKIE_NAME=rh_access
JWT_REFRESH_COOKIE_NAME=rh_refresh
JWT_COOKIE_SAMESITE=lax
JWT_COOKIE_SECURE=true             # OBLIGATOIRE en prod (validator refuse false)
JWT_COOKIE_DOMAIN=                 # Laisser vide (host-only, plus sûr)
JWT_RETURN_TOKEN_IN_BODY=false     # OBLIGATOIRE en prod (validator)
BCRYPT_ROUNDS=12
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_LOGIN_LOCK_SECONDS=900
RATE_LIMIT_REFRESH_MAX=10
RATE_LIMIT_REFRESH_LOCK_SECONDS=300
```

**Contrôle au boot** : un validator Pydantic refuse de démarrer le backend
en `ENVIRONMENT=staging` ou `production` si `JWT_COOKIE_SECURE=false` ou
`JWT_RETURN_TOKEN_IN_BODY=true`. Logguez l'erreur et corrigez avant retry.

## Rotation `JWT_SECRET_KEY`

> **Cadence recommandée** : tous les 6 mois (ou immédiat sur incident).
> **Pré-requis** : fenêtre de maintenance annoncée 48 h à l'avance.

Procédure step-by-step :

1. Générer le nouveau secret sur un poste administrateur isolé :
   ```
   openssl rand -hex 32
   ```
2. **Période de transition impossible** : un seul secret HS256 est actif à
   la fois → toutes les sessions en cours seront invalidées.
3. Communiquer 48 h à l'avance auprès des DSI direction + bandeau in-app
   (cf. backoffice « Annonces »).
4. Pendant la fenêtre de maintenance :
   - Éditer `/etc/rh-primature/secrets.env` et remplacer `JWT_SECRET_KEY`.
   - Restart conteneur backend :
     ```
     docker compose -f docker-compose.prod.yml restart rh-backend
     ```
   - Vérifier le boot : `docker compose logs rh-backend | tail -50` ne doit
     contenir aucune erreur Pydantic.
   - Tester un login avec un compte de service :
     ```
     curl -i -X POST https://rhgn.cloud/api/v1/auth/login \
       -H "Content-Type: application/json" \
       -d '{"username":"ops-check","password":"..."}'
     ```
     Attendu : `200 OK` + header `Set-Cookie: rh_access=...`.
5. Tous les utilisateurs doivent se reconnecter (premier appel API → 401 →
   redirection `/auth/login`).
6. Tracer l'opération dans le journal RSSI (date, ops responsable, motif).

## Procédure d'urgence en cas de fuite

> **Déclencheurs** : compromission VPS suspectée, fuite `secrets.env`,
> commit accidentel du secret, alerte SIEM.

1. **Rotation immédiate** de `JWT_SECRET_KEY` (cf. section précédente,
   sans préavis 48 h) → toutes les sessions sont invalidées.
2. **Audit des `audit_logs`** sur la fenêtre 30 min précédant la fuite
   suspectée :
   ```
   SELECT actor_username, action, resource_id, occurred_at, ip_address
   FROM audit_logs
   WHERE occurred_at >= NOW() - INTERVAL '30 minutes'
   ORDER BY occurred_at DESC;
   ```
   Rechercher activité anormale : créations massives, modifications de rôles,
   exports, accès hors horaires ouvrés.
3. **Réinitialiser les mots de passe** des comptes `super_admin` et `RH`
   par précaution (procédure standard via backoffice « Comptes »).
4. **Activer le bandeau d'alerte in-app** informant les agents d'une
   maintenance sécurité (texte type validé par RSSI).
5. Ouvrir un ticket incident dans le registre RSSI (sévérité Haute, SLA
   notification CNPD si PII compromises sous 72 h — cf. loi 037/AN/2016).

## Vérification post-déploiement

À exécuter systématiquement après tout déploiement touchant à
l'authentification.

### 1. Cookie httpOnly présent en réponse de `/login`

```
curl -i -X POST https://rhgn.cloud/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"<compte-ops>","password":"<mot-de-passe>"}' \
  | grep -i "set-cookie"
```

Attendu (la réponse doit contenir au moins ces deux Set-Cookie) :

```
Set-Cookie: rh_access=...; HttpOnly; Secure; SameSite=Lax; Path=/
Set-Cookie: rh_refresh=...; HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth/refresh
```

### 2. Accès à une ressource protégée avec le cookie

```
curl -i -c cookies.txt -X POST https://rhgn.cloud/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"<compte-ops>","password":"<mot-de-passe>"}'

curl -i -b cookies.txt https://rhgn.cloud/api/v1/personnel/agents | head
```

Attendu : `200 OK` + body JSON paginé.

### 3. Logout efface les cookies

```
curl -i -b cookies.txt -X POST https://rhgn.cloud/api/v1/auth/logout \
  | grep -i "set-cookie"
```

Attendu : deux `Set-Cookie` avec `Max-Age=0` (effacement client).

### 4. Body sans token en prod

Vérifier que la réponse `/login` ne contient pas le JWT en clair :

```
curl -s -X POST https://rhgn.cloud/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"<compte-ops>","password":"<mot-de-passe>"}' \
  | jq 'keys'
```

Attendu : pas de clé `access_token` ni `refresh_token` (uniquement
métadonnées utilisateur).

## Monitoring

### Compteurs ops

- Tentatives login échouées : `audit_logs` avec `action = 'LOGIN_FAILED'`.
- Tentatives refresh échouées : `audit_logs` avec `action = 'REFRESH_FAILED'`.

### Alertes recommandées

| Seuil | Action |
|---|---|
| > 50 `LOGIN_FAILED` en 5 min (toutes IP confondues) | Alerte SIEM — possible brute-force |
| > 20 `LOGIN_FAILED` en 5 min sur une seule IP | Bloquer l'IP au niveau Traefik (cf. middleware `ipallowlist`) |
| > 30 `REFRESH_FAILED` en 5 min | Investigation — rejouage token expiré ou tentative d'élévation |
| Boot backend en erreur Pydantic auth | PagerDuty ops de garde (validator a refusé la conf) |

### Logs structlog

Les évènements suivants sont émis avec niveau `INFO` (ou `WARNING` pour les
échecs) :

- `auth_login_succeeded` — login OK, contient `actor_username`, `ip`.
- `auth_login_failed` — login KO (mot de passe ou compte verrouillé).
- `auth_refresh_succeeded` — refresh OK.
- `auth_refresh_failed` — refresh KO (token expiré, signature invalide).
- `auth_logout` — logout déclaratif côté client.

**Aucun token n'est jamais loggé** (audit grep réalisé pré-merge).

## Contacts

- RSSI Primature : `<à compléter par la DSI au moment de la mise en service>`
- DSI Primature : `<à compléter par la DSI au moment de la mise en service>`
- Ops de garde (numéro d'astreinte) : `<à compléter>`
- Boîte mail support sécurité : `dsi.primature@gouv.gn` (placeholder, à
  confirmer)

## Limitations connues (V1.0)

- **Pas de révocation serveur** : un logout efface le cookie côté client
  mais le JWT reste cryptographiquement valide jusqu'à son expiration
  (30 min). Pour invalider immédiatement toutes les sessions, utiliser la
  rotation `JWT_SECRET_KEY` (cf. section dédiée). Révocation Redis
  planifiée V1.1.
- **Pas d'endpoint `/auth/me`** : le frontend ne peut pas valider le
  cookie au boot. La validation est implicite (premier appel API → 401 →
  logout côté client). Implémentation V1.1.
- **Pas de 2FA** : l'authentification repose uniquement sur le couple
  identifiant / mot de passe (+ rate-limit + bcrypt rounds 12). 2FA TOTP
  pour `super_admin` et `RH` planifié V1.1.

## Références

- [ADR-015](../decisions/ADR-015-jwt-httponly-cookie.md) — décision technique JWT cookie httpOnly
- [ADR-004](../decisions/ADR-004-secrets-management.md) — secrets management
- [pii_migration_runbook.md](pii_migration_runbook.md) — clés PII séparées
- [db_backup_runbook.md](db_backup_runbook.md) — backup base
- Loi 037/AN/2016 (cybersécurité et protection des données, Guinée)
