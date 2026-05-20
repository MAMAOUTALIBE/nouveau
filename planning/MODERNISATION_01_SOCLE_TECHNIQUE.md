# Fiche de modernisation 01 — Socle Technique

> Audit code réel — 2026-05-10 — Périmètre : `Final/backend/app/core/`, `Final/backend/Dockerfile`, `Final/src/app/core/security/`, `Final/.github/workflows/`
> Auditeur : architecte logiciel senior / consultant GovTech

## 0. Résumé exécutif

Socle Python (FastAPI) **techniquement solide pour un POC avancé** : RBAC granulaire, audit transactionnel, JWT + bcrypt + rate-limit + TOTP, Pydantic Settings 12-factor, Docker multi-stage, OTel/Sentry opt-in, MinIO chiffré at-rest. **Trois angles morts pré-prod** : couverture des `permissionGuard` côté Angular très inégale (7 modules sur 16), CSP/HSTS absents, rate-limit en mémoire (incompatible multi-instance). **Souveraineté défendable** dès maintenant grâce aux ports/adapters (Ollama, MinIO local, SMTP, SpiffWorkflow).

## 1. Périmètre inspecté

| Couche | Localisation |
|---|---|
| Auth password + tokens | `Final/backend/app/core/security/passwords.py`, `tokens.py`, `rate_limit.py` |
| TOTP MFA | `Final/backend/app/services/totp_service.py`, `Final/backend/app/api/v1/totp.py` |
| RBAC backend | `Final/backend/app/core/security/rbac.py` (140 dépendances `require_permissions/roles/scope` sur 146 endpoints) |
| RBAC frontend | `Final/src/app/core/security/access-control.service.ts`, `permission.guard.ts`, `auth.guard.ts` |
| Audit | `Final/backend/app/core/audit.py` + table `hr.audit_logs` |
| Observabilité | `Final/backend/app/core/observability.py`, `logging.py` |
| Erreurs / Config | `Final/backend/app/core/errors.py`, `config.py` |
| Headers sécurité + CORS | `Final/backend/app/main.py:34-116` |
| Storage | `Final/backend/app/adapters/storage/{local_fs,minio_s3}.py` |
| CI / Docker | `Final/backend/Dockerfile`, `Final/backend/docker-compose.yml`, `Final/.github/workflows/quality.yml` |

## 2. État réel (vérifié dans le code)

| Sous-module | État | Preuve | Commentaire |
|---|---|---|---|
| Hash mot de passe bcrypt cost 12 | ✅ | `passwords.py:15` | OK. Cost ≥ 10 imposé en prod par validator config. |
| TTL access 30 min / refresh 24 h | ✅ | `tokens.py:46-48` | Aligné OWASP ; refresh non rotatif (à durcir). |
| Rate-limit login 5/15 min | 🟡 | `rate_limit.py:42-44` | **En mémoire** — incompatible avec déploiement multi-instance (Redis nécessaire). |
| MFA TOTP (RFC 6238) | ✅ | `totp_service.py:143`, `totp.py:36-50` | Setup/confirm/verify, secret chiffré Fernet, anti-replay 30 s, audit tracé. **Non obligatoire** par défaut. |
| RBAC backend (perms + scopes) | ✅ | `rbac.py:32-89` | 95,9 % couverture endpoints. Modèle perms granulaires (`leave:approve:l1`), 5 scopes (SELF/TEAM/UNIT/DIRECTION/GLOBAL). |
| RBAC frontend — couverture | 🟡 | grep `canActivate` sur `*.routes.ts` | **7 modules sur 16** ont des guards (`personnel`, `recruitment`, `admin`, `workflows`, `documents`, root, content layer). Manquent : `leave`, `performance`, `careers`, `training`, `discipline`, `organization`, `dashboard`, `reports`, `modernization`, `self-service`, `ai-assistant`. |
| RBAC frontend — résolution | 🟡 | `access-control.service.ts:6-48,127-132` | Mapping rôle → permissions résolu côté client. Sécurité = défense en profondeur seulement (le backend reste autoritaire). |
| Audit transactionnel persistant | ✅ | `audit.py:95-96`, `audit_log.py:28-62` | `before_data` + `after_data` JSONB, IP, UA, JTI, action SUCCESS/FAILURE. Flush solidaire de la transaction métier. |
| Audit — page admin de recherche | 🟡 | `src/app/modules/admin/pages/admin-audit/` | Page existe, mais pas de filtre temporel avancé / export CSV signé / signature de ligne. |
| Audit — rétention / scellement | ❌ | — | Aucune rétention (croissance illimitée), aucune signature/hash chaîne (chain-of-custody) → contestable légalement. |
| Logs structurés (structlog JSON) | ✅ | `logging.py:32-35` | OK prod/staging, console-friendly en dev. |
| Sentry APM opt-in 5 % | ✅ | `observability.py:54-91` | `send_default_pii=False` ✅. |
| OpenTelemetry opt-in | ✅ | `observability.py` | Endpoint OTLP en var d'env. |
| Métriques Prometheus `/metrics` | ❌ | — | Absentes — bloque Grafana / alerting. |
| Healthcheck DB | ✅ | `api/v1/health.py:22-31` | Manque dépendances externes (MinIO, SMTP, LLM). |
| Format d'erreur normalisé | ✅ | `errors.py:83-87` | `{"error":{"code,message,details}}`. |
| Pydantic Settings + validators prod | ✅ | `config.py:131-165` | JWT_SECRET ≥ 32, asyncpg-only, BCRYPT_ROUNDS ≥ 10. SecretStr. |
| Headers sécurité | 🟡 | `main.py:34-41` | `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `COOP` ✅. **CSP et HSTS absents** ❌. |
| CORS | 🟡 | `main.py:115-116` | `allow_methods=["*"]`, `allow_headers=["*"]` — trop permissif pour prod. |
| Storage MinIO/S3 SSE-AES256 | ✅ | `minio_s3.py:65` | Chiffré at-rest. Presigned URL 5 min. **Pas de rotation de clé**. |
| Fallback storage local FS | ✅ | `storage/factory.py` | OK dev. |
| Dockerfile multi-stage / non-root | ✅ | `Dockerfile:1-78` | UID 1000, gunicorn 4 workers + uvicorn worker, healthcheck HTTP. |
| docker-compose dev (PG + Redis + MinIO) | ✅ | `docker-compose.yml` | OK. |
| CI GitHub Actions | ✅ | `.github/workflows/quality.yml` | typecheck + tests + build. |
| Migrations Alembic | ✅ | `alembic/versions/0001..0004` | 4 migrations + baseline. |

**Vérité du moment :** ce socle est **au-dessus de la moyenne des SI publics francophones** (CRPCEN, certains SIRH ministériels FR encore en LDAP custom). Les manques sont identifiables et localisés.

## 3. Comparaison aux standards GovTech

| Standard / Référence | Position du projet |
|---|---|
| **DINUM FR — RGS v2.0** (Référentiel Général de Sécurité) | Auth/JWT/bcrypt OK ; **MFA non imposé**, **CSP/HSTS absents**, **journalisation peu durcie** (pas de scellement). Niveau RGS **renforcé** non atteint. |
| **DINUM FR — Suite Numérique de l'État** | Pas d'intégration Pro Connect / FranceConnect Agent (sans objet en GN, mais transposable : aucun connecteur SSO national). |
| **eIDAS / RGI** (interopérabilité) | OpenAPI 3.1 ✅, signatures JSON Schema ✅. Manque : conformité **eIDAS Level Substantial** pour MFA (TOTP OK mais non obligatoire ; pas de support FIDO2/WebAuthn). |
| **ISO/IEC 27001:2022** A.12.4 (journalisation) | Audit transactionnel ✅, mais **A.12.4.2 protection des journaux** non couvert (pas de signature chaîne, pas d'archivage WORM). |
| **ISO/IEC 27018** (PII cloud) | MinIO local OK ; cloud Anthropic LLM = transfert hors UE/Afrique → DPO à valider. |
| **RGAA 4.1.2** (accessibilité FR) | Hors périmètre socle. |
| **RGPD UE / Loi Guinée 037/AN/2016** | Pas de registre des traitements, pas de mécanisme d'exercice des droits (accès/rectif/oubli) côté agent, conservation infinie audit/dossiers ❌. |
| **Estonie X-Road** | Aucune passerelle, aucune signature inter-services. Pas bloquant V1, à anticiper si interconnexion paie/État civil. |
| **Sénégal — Sénégal Services / Rwanda Irembo** | Pas de portail citoyen ni d'auth nationale (sans objet ici, RH interne). |
| **CNIL FR — délibération 2018-303** (RH) | Conservation des dossiers : pas de purge automatique → non conforme (loi guinéenne similaire dans l'esprit). |

## 4. Risques en exploitation publique

| # | Risque | Sévérité | Délai d'apparition |
|---|---|---|---|
| R1 | Bypass MFA — TOTP optionnel pour `super_admin` / `hr_manager` → un compte admin compromis = accès total irréversible. | **Critique** | Immédiat |
| R2 | Rate-limit en mémoire perdu au redémarrage et inopérant en multi-pod → bruteforce login distribué possible. | Élevée | Dès passage en HA |
| R3 | Pas de CSP / HSTS → XSS exploitable, downgrade HTTPS possible derrière proxy. | Élevée | Immédiat |
| R4 | Audit non scellé (pas de hash chaîné) → un admin compromis peut altérer `hr.audit_logs` sans trace. | Élevée | Dès incident |
| R5 | 9 modules Angular sans `permissionGuard` → fuite d'URL / deep-link permet à un agent de charger une page interdite (data leak via XHR rejetée mais UI vue). | Moyenne | Immédiat |
| R6 | Pas de purge / archivage des données personnelles → non-conformité loi 037/AN/2016. | Moyenne | À J+1 an |
| R7 | LLM Anthropic en cloud par défaut → données RH (CV, FAQ contenant noms d'agents) partent au-dehors. | Moyenne | À l'activation |
| R8 | CORS `allow_*=["*"]` → si origine prod mal configurée, n'importe quel domaine peut faire des requêtes cookies-credentialed. | Moyenne | Immédiat |
| R9 | Pas de Prometheus / alerting → incidents détectés tardivement (par les utilisateurs). | Moyenne | Dès prod |
| R10 | Refresh token non rotatif → vol de refresh = compromission longue durée. | Moyenne | Dès incident |

## 5. Propositions de modernisation

| # | Proposition | Bénéfice | Effort | Priorité | Dépend |
|---|---|---|---|---|---|
| **P1** | **MFA obligatoire** pour rôles `super_admin`, `hr_manager`, `hr_director`, `discipline_officer`. Forcer enrôlement TOTP au 1er login (middleware `force_mfa_setup`). | Bloque les comptes admin volés. Aligne RGS renforcé. | **2-3 j** | **P0** | TOTP déjà OK |
| **P2** | **CSP + HSTS + CORS strict + Cookie SameSite=Lax + Secure**. CSP `default-src 'self'; img-src 'self' data: blob:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.<domaine>;`. HSTS 1 an + preload. | Ferme XSS, downgrade HTTPS, CSRF cross-site. | **1-2 j** | **P0** | Aucune |
| **P3** | **Migrer rate-limit + sessions blocklist vers Redis** (déjà dans docker-compose). Refresh token rotatif (`jti` à usage unique avec replay detection). | Multi-instance OK. Vol de refresh contenu à 30 min. | **3-4 j** | **P0** | Redis prod |
| **P4** | **Sceller l'audit** : hash chaîné par bloc (Merkle tree quotidien) signé Ed25519 ; export quotidien dans MinIO **Object Lock WORM** ; signature publiable pour vérification externe (un magistrat peut vérifier l'intégrité). | Conformité ISO 27001 A.12.4.2 + valeur probante. | **5-7 j** | **P1** | MinIO Object Lock |
| **P5** | **Couvrir les 9 modules Angular sans guard** par `permissionActivateGuard` + `permissionMatchGuard` (lazy). Ajouter test e2e Playwright vérifiant que chaque permission est testée. | Défense en profondeur uniforme. | **2 j** | **P0** | Aucune |
| **P6** | **Purge + archivage RGPD-GN** : worker arq nocturne → purge agents `TERMINATED + 10 ans` (statut FP), audit `> 5 ans` archivé MinIO (WORM), dossiers exportés bzip2 + signature. Page agent « droit d'accès / rectification / oubli » en self-service. | Conformité loi 037/AN/2016. Diminue volumétrie. | **5-7 j** | **P1** | Worker arq, signature |
| **P7** | **Prometheus `/metrics`** (latency p50/p95/p99 par endpoint, taux 4xx/5xx, queue arq, dispatch email, audit lag) + dashboard Grafana versionné. Alerting Alertmanager → email/SMS DSI Primature. | MTTR réduit, SLA visible. | **3 j** | **P1** | Prometheus stack |
| **P8** | **Healthcheck composé** : `/healthz` (live), `/readyz` (DB + MinIO + LLM si activé + SMTP). | Kubernetes-ready. | **0,5 j** | **P2** | — |
| **P9** | **Logs RGPD-aware** : middleware qui supprime `password`, `secret`, `token`, `national_id_number`, `dependent_birthdate` du body avant log. | Empêche fuite par les logs. | **1 j** | **P1** | — |
| **P10** | **Pro Connect Agent guinéen ou OIDC unifié Primature** : si la Primature ouvre un IdP central (Keycloak), brancher OIDC + login JWT à la volée + désactivation login local. | Auth nationale, MFA centralisé, off-boarding instantané. | **5-8 j** | **P2** | IdP Primature |
| **P11** | **WAF / reverse-proxy durci** : Caddy ou Traefik avec règles ModSecurity OWASP CRS, mTLS optionnel pour intégrations API gouvernementales. | Surface d'attaque réduite. | **2-3 j** | **P2** | Infra |

## 6. Souveraineté & UX terrain

**Souveraineté.** Le code est déjà **compatible auto-hébergement complet** : PostgreSQL + Redis + MinIO + SMTP + Ollama (LLM local) + Tesseract (OCR local) + endesive (signature locale) + SpiffWorkflow (BPMN local). Pour un déploiement souverain, configurer `LLM_PROVIDER=ollama`, `STORAGE_PROVIDER=minio`, `SIGNATURE_PROVIDER=endesive_local`, `OCR_PROVIDER=tesseract`, `EMAIL_PROVIDER=smtp`. Aucune dépendance bloquante à un cloud étranger. **Recommandation prod :** héberger sur infrastructure gouvernementale guinéenne (datacenter ANSUTEN ou équivalent) ; à défaut, OVH/Scaleway zone Paris (juridiction UE = mieux que US).

**UX terrain.** Connexion Conakry typique : 4G correcte au centre, 3G/2G en périphérie et préfectures. Recommandations pour le socle :
- Bundle Angular en lazy chunks ✅ (déjà fait, ~85 chunks).
- Préchargement « QuicklinkStrategy » à privilégier sur « PreloadAllModules » pour économiser data.
- Service worker Angular (PWA) pour cache app shell + offline read-only des dossiers consultés.
- Auth tokens stockés en cookie HttpOnly (et non `localStorage`) — actuellement à vérifier dans `auth.service.ts`.
- Throttle de polling dashboard (actuellement HTTP polling, passer à 30 s minimum hors WebSocket).

## 7. Décision recommandée

Phase **P0 (2 semaines)** : MFA obligatoire (P1), headers/CORS (P2), Redis pour rate-limit + refresh rotatif (P3), guards manquants (P5), logs RGPD-aware (P9). Coût ≈ **9 à 12 j-h**, impact **direct sur la production-readiness**.

Phase **P1 (4 semaines)** : scellement audit (P4), purge/archivage (P6), métriques Prometheus (P7), healthcheck composé (P8). Coût ≈ **14 à 18 j-h**.

Phase **P2 (au-delà)** : OIDC national (P10), WAF (P11). À conditionner à l'existence d'un IdP Primature.

**Ne pas mettre en production réelle tant que P0 n'est pas livré.** Le reste de l'application peut être correct fonctionnellement, le socle est le maillon faible ; c'est par là que passe la compromission.
