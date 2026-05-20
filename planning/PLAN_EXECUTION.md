# Plan d'exécution — Vague A complète (16 semaines)

> Audit code réel — 2026-05-10 — Plan d'implémentation des 23 actions A1-A23 issues des fiches `MODERNISATION_01..13`.
> Cible : application **prod-ready, juridiquement opposable, déployable nationalement** à la fin Vague A.

## 1. Hypothèses

| Élément | Hypothèse |
|---|---|
| Équipe interne | **5 ETP** : 2 Backend Python (FastAPI), 2 Frontend Angular, 1 DevOps/SRE |
| Tech Lead | 1 personne supplémentaire à mi-temps (comptée 0,5 ETP), pilotage + arbitrages |
| Externes | Juriste (CGU/RGPD), cabinet a11y (audit RGAA), pen-tester, vidéaste (tutoriels), CA/PKI/TSA Primature ou Africa Trust Network |
| Méthodologie | **Sprints de 2 semaines** (8 sprints) + Sprint 0 de cadrage 1 semaine |
| Capacité réelle | 5 ETP × 8,5 j/sprint = 42 j-h/sprint, soit **336 j-h sur 8 sprints** (cohérent avec estimation Vague A 305-410 j-h) |
| Branching | Trunk-based avec feature flags ; PRs < 400 LoC ; revue obligatoire par 1 pair |
| Définition du done | Code mergé + tests passants + CI verte + démo + doc à jour |

**À la fin de la Vague A, l'application est mettable en production** (cf. `MODERNISATION_00_SYNTHESE.md` § 3).

## 2. Décisions amont (Sprint 0 — Semaine 0)

Aucun code en Vague A ne peut démarrer sans ces décisions. À organiser en **5 ateliers de cadrage** la semaine 0 :

| # | Décision | Sponsor | Impact |
|---|---|---|---|
| D1 | **Hosting prod** : ANSUTEN (souverain GN) vs OVH/Scaleway Paris vs cluster K8s privé Primature | Cabinet PM × DSI × ANSUTEN | Détermine D2, D5, D6, D8 |
| D2 | **Site DR secondaire** : Kankan / Labé / OVH région secondaire | Cabinet PM | Sans cela, P3 fiche 12 bloqué |
| D3 | **Container registry** : Harbor auto-hébergé `registry.gov.gn` vs Docker Hub vs GitLab | DSI | Sans cela, CD bloqué |
| D4 | **Secrets management** : sealed-secrets (simple) vs HashiCorp Vault (riche) vs SOPS+age | DSI | Sans cela, secrets en clair |
| D5 | **PKI signature électronique** : PKI Primature (à créer ?) vs Africa Trust Network (QTSP régional) vs Universign en repli | DSI × DPO × juriste | Sans cela, signature reste mock |
| D6 | **TSA horodatage RFC 3161** : TSA gouvernementale GN si existe, sinon TSA UE (FreeTSA pour staging) | DSI | Couplé à D5 |
| D7 | **Référentiel statutaire FP-GN** : récupérer auprès Ministère FP la grille corps/grade/échelon/indice à jour + grille indiciaire | DRH × Min. FP | Sans cela, fiche 02 P1 bloquée |
| D8 | **Référentiel sanctions FP-GN** : même source | Min. FP | Sans cela, fiche 05 P1 bloquée |
| D9 | **DPO Primature** désigné formellement | Cabinet PM | Sans cela, RGPD non couvert |
| D10 | **Comité de pilotage** formé : SG, DRH, DSI, DAF, DPO + observateur syndical | Cabinet PM | Gouvernance projet |
| D11 | **Budget externes** : pen-test (~10 K€), juridique (~7 K€), audit a11y (~7 K€), vidéos (~7 K€), infra DR (variable) — **arbitrage** | DAF | Bloque exécutions parallèles |
| D12 | **OIDC national Pro Connect Agent GN** : existe ? Sinon différer fiche 09 P15 en Vague C | DSI | V2 si pas dispo |
| D13 | **Connecteur SMS** : Orange GN APIs vs Africastalking vs autre | DSI × Achats | Sans cela, fiche 07 P13 bloquée |
| D14 | **CA TLS** : ANSI nationale vs Let's Encrypt (staging) | DSI | Pour `prim.gov.gn` prod |

**Livrable Sprint 0** : `docs/decisions/ADR-001..ADR-014.md` (un fichier ADR par décision, format MADR).

## 3. Tracks parallèles & ownership

| Track | Périmètre | Owner | ETP |
|---|---|---|---|
| **A** | Sécurité socle backend (auth, MFA, rate-limit, headers, logs RGPD, RBAC) | Backend dev #1 | 0,5 sur 8 sprints |
| **B** | Statutaire FP-GN + Personnel + Signature + Carrière + Discipline + GPEC | Backend dev #1 + #2 | 1 sur sprints 3-7 |
| **C** | Notifications + Congés + Formation + Recrutement (cycles métier) | Backend dev #2 | 1 sur sprints 3-8 |
| **D** | Self-service + Login UI + PWA + Responsive + Manuel | Frontend dev #1 + #2 | 2 sur 8 sprints |
| **E** | Données SQL (partition, GIN, chiffrement, purge) + DevOps (backup, PRA, secrets, CD, K8s) | DevOps + Backend dev #1 (mi-temps) | 1 sur 8 sprints |
| **F** | Tests & QA (couverture, CI, E2E, pen-test, charge) + DPIA | Tech Lead + Backend devs en rotation | 0,5 transverse |
| **G** | Conformité légale + Conduite changement + i18n + Plan déploiement | Tech Lead + externes (juriste, a11y, vidéaste) | 0,5 + externes |

## 4. Roadmap par sprint

### Sprint 0 — Cadrage (Semaine 0)

**Objectif :** lever toutes les décisions amont D1-D14, durcir la CI, désigner DPO et comité.

| Track | Livrables |
|---|---|
| Tous | 14 ADR Markdown signés (`docs/decisions/`) |
| F | CI étendue : ajouter pytest + Trivy + Docker build + push registry au workflow `quality.yml` (cf. fiche 11 P2). Test Alembic upgrade/downgrade dans CI. |
| F | `pre-commit` config : ruff, prettier, mypy, gitleaks, commitlint |
| E | Sealed-secrets ou SOPS installé sur cluster cible ; bucket MinIO dédié backups créé (chiffré) |
| G | DPO désigné, comité de pilotage tenu, kick-off externes (juriste, vidéaste, pen-tester, cabinet a11y consultés pour devis) |

**Critères d'acceptation Sprint 0 :**
- 14 ADR mergés.
- CI verte avec Docker build + Trivy + pytest même si peu de tests.
- 1 ETP DevOps a setup secrets et registry.
- Devis externes reçus et arbitrés DAF.

---

### Sprint 1 — Sécurité auth + Backup PG (Semaines 1-2)

**Objectif :** fermer les trous d'authentification critiques (R1 fiche 09) et démarrer la résilience données.

| Track | Action | Tickets / livrables | Réf. fiche |
|---|---|---|---|
| A | **MFA TOTP backend** : middleware `force_mfa_setup` pour rôles `super_admin`, `hr_manager`, `hr_director`, `discipline_officer`. Config flag `MFA_REQUIRED_ROLES`. | `backend/app/core/security/mfa_enforcement.py` + tests | 01 P1 |
| A | **Refresh token rotatif** : nouveau JTI à chaque refresh, ancien invalidé. Stockage blocklist Redis. | `backend/app/core/security/tokens.py` (modif) + `core/security/token_blocklist.py` | 01 P3 |
| A | **Rate-limit Redis** : remplacer in-memory par Redis (lib `aiolimiter` ou `slowapi`). | `backend/app/core/security/rate_limit.py` (refacto) | 01 P3 |
| D | **MFA UI** : (a) écran saisie code TOTP post-login si requis, (b) écran d'enrôlement (QR + vérif + codes recovery), (c) procédure perte authenticator | `src/app/authentication/mfa/{mfa-challenge,mfa-enrollment,mfa-recovery}.{ts,html}` + service | 09 P1 |
| D | **Reset MdP** : `/auth/forgot-password` + `/auth/reset-password/{token}`. Politique MdP affichée (zxcvbn + check HIBP k-anonymity) | `src/app/authentication/forgot-password/`, `reset-password/` + `backend/app/api/v1/auth.py` (endpoints) | 09 P2, P4 |
| D | **Forced password change au 1er login** : flag `User.must_change_password` + redirection middleware front | `backend/app/models/user.py`, `src/app/core/guards/password-change.guard.ts` | 09 P3 |
| D | **Cookie HttpOnly + Secure + SameSite=Lax** : remplacer `localStorage` token par cookie | `backend/app/api/v1/auth.py` (set-cookie), `src/app/core/services/auth.service.ts` | 09 P13 |
| E | **Backup PG quotidien** : CronJob K8s avec `pg_dump --format=custom` + chiffrement age + push MinIO bucket `pg-backups` (Object Lock 30j). Script de restauration `scripts/restore_pg.sh` testé. | `backend/deploy/helm/templates/cronjob-pg-backup.yaml` + scripts | 12 P1 |
| E | **WAL archivage continu** : `archive_command` PG vers MinIO | doc dans `Final/backend/deploy/helm/README.md` | 12 P1 |
| F | **Tests unitaires MFA + token rotation** | `backend/tests/unit/test_mfa.py`, `test_token_rotation.py` | 11 P1 |

**Démos sprint 1 :**
- Connexion DRH → demande MFA → enrôlement TOTP → re-login OK.
- Tentative reset password → email envoyé (MailHog) → reset OK.
- 1er login → forçage changement MdP avec barre de force.
- `pg_dump` quotidien réussi, restauration testée sur staging.

**Critères d'acceptation :**
- 100 % des rôles critiques MFA-enrolled obligatoirement.
- Refresh token volé > 30 min = rejeté.
- Backup PG quotidien dans MinIO chiffré + restauration testée.

---

### Sprint 2 — Headers/CORS + Guards Angular + PostgreSQL HA + Pages légales démarrées (Semaines 3-4)

**Objectif :** durcir l'enveloppe HTTP, couvrir tous les modules Angular en RBAC, démarrer la haute disponibilité données et la couverture juridique.

| Track | Action | Livrables | Réf. fiche |
|---|---|---|---|
| A | **CSP + HSTS + CORS strict** : middleware FastAPI, allowlist origines explicite | `backend/app/main.py` (refacto headers + CORS) | 01 P2 |
| A | **Logs RGPD-aware** : middleware qui strip `password`, `secret`, `token`, `national_id_number`, `dependent_birthdate` du body avant log structlog | `backend/app/core/logging.py` + middleware | 01 P9 |
| D | **`permissionGuard` sur 9 modules manquants** : leave, performance, careers, training, discipline, organization, dashboard, reports, modernization, self-service, ai-assistant — ajouter `canActivate: [authGuard, permissionActivateGuard]` à chaque routes.ts ; data permissions définies | `src/app/modules/{leave,performance,careers,training,discipline,organization,dashboard,reports,modernization,self-service,ai-assistant}/*.routes.ts` | 01 P5 |
| D | Test e2e Playwright vérifiant chaque permission | `tests/e2e/rbac/*.spec.ts` | 11 P3 |
| E | **PostgreSQL HA** : déployer CloudNativePG operator ou Patroni + etcd ; primary + standby ; failover < 30 s | `backend/deploy/helm/postgres-ha/` (subchart ou external) | 12 P14 |
| E | **Backup MinIO** : second cluster MinIO en mirror (mode replication) | `backend/deploy/helm/minio-mirror/` | 12 P2 |
| G | **Pages légales rédigées (juriste externe)** : mentions-legales, CGU, confidentialité, cookies, accessibilité (déclaration RGAA même provisoire), security.txt | Markdown source + composants Angular `src/app/legal/{mentions-legales,cgu,confidentialite,cookies,accessibilite,security}/` | 13 P1 |
| G | **Footer refait** avec liens légaux + version build + lien GitHub si open source | `src/app/shared/components/footer/footer.{ts,html}` | 13 P1 |
| G | **Bandeau cookies + page préférences** | `src/app/shared/components/cookie-banner/`, `src/app/legal/preferences-cookies/` | 13 P5 |
| G | **DPO + registre des traitements** : `docs/registre-traitements.md` (12 traitements minimum) | doc + intégration page `/confidentialite` | 13 P2 |
| F | Tests unitaires headers + middleware logs | `tests/unit/test_security_headers.py`, `test_logging_pii.py` | 11 P1 |

**Démos sprint 2 :**
- `curl -I https://staging` → CSP, HSTS, CORS strict visibles.
- Tentative XHR cross-origin malicieuse rejetée.
- Test : agent connecté en `agent` essaie `/dashboard` → redirigé `/acces-refuse`.
- Failover PG : kill primary → standby promu en < 30 s, app continue.
- Footer affiche les 6 liens légaux ; pages publiées.

**Critères d'acceptation :**
- Headers HTTP audit Mozilla Observatory ≥ A.
- 16/16 modules Angular avec guard.
- PG failover testé.
- 6 pages légales publiées et liées.

---

### Sprint 3 — Statutaire FP-GN + Notifications backend + Données SQL (Semaines 5-6)

**Objectif :** poser la couche statutaire qui débloque tout le métier (paie, avancement, sanctions) et activer enfin les notifications.

| Track | Action | Livrables | Réf. fiche |
|---|---|---|---|
| B | **Tables statutaires FP-GN** : `civil_service_corps`, `civil_service_grade`, `civil_service_echelon` ; FKs `Employee.corps_id`, `current_grade_id`, `current_echelon_id`, `date_titularisation`, `anciennete_grade_jours` (calculé) | `backend/app/models/civil_service.py` + Alembic `0005_civil_service_statut.py` + seed depuis grille Min. FP (D7) | 02 P1, 05 P3-P4 |
| B | **Modèle d'état civil structuré** : `birth_date`, `birth_place`, `nationality`, `gender`, `marital_status`, `national_id_number` (préparé pour pgcrypto) | `backend/app/models/employee.py` (champs) + Alembic | 02 P11 |
| B | **Référentiel sanctions FP-GN** : `discipline_sanction_catalog` (code, libelle, statut_legal, degre, duree_max_jours, prescription_jours_par_severite). FK `DisciplineCase.proposed_sanction_code`. UI = liste fermée. | `backend/app/models/discipline.py` (modif) + seed (D8) | 05 P1 |
| B | **Prescription discipline** : champ calculé + worker hebdo notif J-30/J-7 + auto-clôture `DISMISSED_PRESCRIPTION` | `backend/app/services/discipline_service.py` (modif) + worker arq | 05 P2 |
| C | **Worker arq email_dispatcher** : drainer queue PENDING → adapter SMTP, retry exponentiel, mark SENT/FAILED, métriques | `backend/app/workers/email_worker.py` + `backend/Dockerfile.worker` (image dédiée) | 07 P11 |
| C | **Templates email Jinja2** : 1 par event (LEAVE_APPROVED/REJECTED, TRAINING_INVITED, COLD_EVAL, WORKFLOW_ESCALATED, etc.) | `backend/app/templates/emails/*.html.j2` (10 templates) | 07 P12 |
| C | **Triggers métier** : émission notification depuis leave_service.decide(), training_service.transition(), workflow_service.advance(), recruitment status events, discipline events | services modifiés (10 fichiers) | 07 P15 |
| C | **Adapter SMS GN** : `adapters/sms/{orange_gn,africastalking,mock}.py` selon D13, factory, plafonds quotidiens utilisateur | `backend/app/adapters/sms/` + modèle `SmsDispatchLog` + worker | 07 P13 |
| E | **Partition `audit_logs` + `notifications` + `document_versions` par année** | Alembic `0006_partition_high_volume.py` (DETACH + CREATE PARTITION OF + ATTACH) | 10 P1 |
| E | **Index GIN JSONB** : `audit_logs.{before_data,after_data,audit_metadata}`, `recruitment_applications.metadata`, `signature_envelopes.payload`, `employee_competencies.metadata` | Alembic `0007_gin_jsonb_indexes.py` | 10 P2 |
| E | **Chiffrement at-rest pgcrypto** : `national_id_number` chiffré ; vue `vw_employees_decrypted` (RBAC PG) ; worker rotation clé documenté | `backend/app/services/personnel_service.py` (modif) + Alembic + doc | 10 P3 |
| E | **Worker purge RGPD** : drainer `document_retention_rules` + agents `TERMINATED + 10 ans` (anonymisation), audit > 5 ans → archive WORM, candidatures non retenues > 1 an → suppression | `backend/app/workers/retention_worker.py` + arq schedule | 10 P4 |
| F | Tests services métier discipline + notifications + worker email + worker rétention | `backend/tests/unit/test_*.py` (5 nouveaux) | 11 P1 |
| G | **3 DPIA** : scoring turnover, matching CV LLM, 360°. Modèle CNIL FR adapté. | `docs/dpia/dpia-{turnover,llm-matching-cv,evaluation-360}.md` | 13 P3 |

**Démos sprint 3 :**
- Création nouveau agent → choix corps/grade/échelon depuis liste fermée.
- Création dossier discipline → catalogue de sanctions FP-GN visible, prescription affichée.
- Demande de congé approuvée → email reçu en MailHog + (si configuré) SMS reçu.
- `EXPLAIN` sur recherche audit JSONB → utilise GIN, < 100 ms.
- Test purge : agent en TERMINATED depuis > 10 ans → anonymisé.

**Critères d'acceptation :**
- Migration FP-GN passée sans perte sur données existantes.
- 100 % des actions métier critiques émettent une notification.
- Coverage backend services métier > 50 % (cible Vague A : 70 %).
- 3 DPIA documentées et validées DPO.

---

### Sprint 4 — Signature PAdES + Hardening uploads + Bascule Ollama + FTS GED + Manuel utilisateur (Semaines 7-8)

**Objectif :** valeur juridique des arrêtés (signature réelle), sécurité fichiers, souveraineté IA, recherche GED, début doc utilisateur.

| Track | Action | Livrables | Réf. fiche |
|---|---|---|---|
| B | **Signature PAdES réelle** : adapter `endesive` câblé avec PKI selon D5. Implémentation `backend/app/adapters/signature/endesive_local.py` (compléter le stub). Horodatage TSA RFC 3161 selon D6. Verification publique `/public/signature/verify/{code}` | `backend/app/adapters/signature/endesive_local.py` + `backend/app/services/signature_service.py` + endpoint public | 02 P2 |
| B | **Hardening uploads** : (a) ClamAV en sidecar K8s + scan obligatoire avant validation, (b) `python-magic` pour MIME réel, (c) re-encodage PDF (`qpdf --linearize`), (d) re-encodage images Pillow + strip metadata | `backend/app/services/upload_security.py` + `backend/deploy/helm/templates/clamav-sidecar.yaml` | 02 P4 |
| B | **Templates PDF officiels** : `dossier_agent_v1.html` avec en-tête République de Guinée + Primature + photo + QR vérification + filigrane « CONFIDENTIEL » sur pages internes | `backend/app/templates/pdf/{dossier_agent,certificat_formation,arrete_signed}_v1.html` | 02 P8 |
| C | **Bascule Ollama par défaut** : modifier `LLM_PROVIDER=ollama` en prod via Helm values. Ajout d'Ollama au docker-compose dev (modèle `mistral:7b-instruct` quantifié Q4). Test matching CV en local. | `backend/app/adapters/llm/ollama.py` (refacto si besoin) + `docker-compose.yml` + `helm/values.yaml` | 07 P7, 03 P7 |
| C | **Recherche FTS GED** : colonne générée `tsvector` (titre + description + champs extraits OCR), index GIN, endpoint `/documents/search?q=` avec facettes (type, direction, période, confidentialité) | `backend/app/models/document.py` + Alembic + `services/document_service.py` (search) | 07 P4 |
| D | **PWA Angular + service worker** : installation, app shell cachée, offline read-only, push notifications navigateur | `src/app/manifest.webmanifest`, `src/sw-master.ts`, configuration Angular service worker | 09 P10 |
| D | **Refonte responsive serrée mobile** : audit Lighthouse mobile, refactor tables → cards mobile, bottom-nav, tap targets ≥ 44 px. Test sur Galaxy A05 et 3G simulé. | tous les modules touchés ; SCSS dédié `src/styles/responsive-mobile.scss` | 09 P11 |
| E | **CD pipeline ArgoCD ou Flux** : déploiement auto staging à chaque main, déploiement prod sur tag `release-*` avec validation manuelle, rollback 1-clic | `.github/workflows/release.yml` + manifests ArgoCD `deploy/argocd/` | 12 P5 |
| E | **HPA + PDB + NetworkPolicy** : HPA min 2 max 8 sur CPU>70 %, PDB `minAvailable: 1`, NetworkPolicy `default deny` + autorisations explicites | `backend/deploy/helm/templates/{hpa,pdb,networkpolicy}.yaml` | 12 P6 |
| F | **Pen-test externe lancé** : missionnement cabinet, accès staging, planning 2-3 semaines | contrat signé, accès donnés | 11 P4 |
| G | **Manuel utilisateur multi-rôles** (rédacteur dédié) : 4 manuels PDF (Agent, Manager, DRH, Admin SI). Captures d'écran à jour. | `docs/user/{agent,manager,drh,admin}.md` (puis génération PDF) | 13 P7 |
| G | **Audit RGAA externe lancé** : missionnement cabinet, accès staging | contrat signé | 13 P16 |
| F | Tests unitaires signature, upload security, FTS, Ollama mock vs réel | `backend/tests/unit/test_*.py` | 11 P1 |

**Démos sprint 4 :**
- Signature d'un arrêté → PAdES + horodatage RFC 3161 visible dans Adobe Reader.
- Upload PDF malveillant (EICAR) → bloqué par ClamAV.
- Recherche GED « arrêté Cabinet 2025 » → résultats < 200 ms.
- Matching CV local Ollama → score + justification cohérents.
- App installable sur Android (PWA) ; offline lecture du dossier consulté.
- Manuel agent v1 disponible en PDF.

**Critères d'acceptation :**
- 1 arrêté réellement signé PAdES + TSA, vérifiable indépendamment.
- ClamAV scanne 100 % des uploads.
- FTS GED < 500 ms p95 sur 10 000 documents.
- Lighthouse mobile : Performance > 70, A11y > 80.
- Manuel agent rédigé et publié `/aide`.

---

### Sprint 5 — Commissions + Portail public + Calendrier GN + PRA (Semaines 9-10)

**Objectif :** ouvrir le recrutement aux candidats externes, livrer le calendrier guinéen et le congé Hadj, sécuriser via PRA.

| Track | Action | Livrables | Réf. fiche |
|---|---|---|---|
| B | **Modèle backend `RecruitmentCommission`** : id, campaign_id, members[], quorum_min ; `CommissionSession` ; `CommissionPV` (PDF signé Universign/PKI + hash chaîné) | `backend/app/models/recruitment_commission.py` + Alembic + service + API | 03 P1 |
| C | **Endpoint public candidature** : `POST /api/v1/public/recruitment/{campaign_ref}/apply` sans auth, hCaptcha, rate-limit IP, scan ClamAV, double-opt-in email, accusé PDF signé | `backend/app/api/v1/public/recruitment.py` + service | 03 P2 |
| D | **Page front candidate-portal sans `permissionGuard`** : version publique légère (< 200 Ko initial, fonctionne 3G), wizard 3 étapes | `src/app/public/candidate-apply/` (route hors layout authentifié) | 03 P2 |
| C | **Calendrier guinéen** : table `public_holidays` (date, label, is_movable, hijri_year) + service `holidays_service.compute_business_days(start, end)` ; seed 11 fériés GN + Tabaski/Maouloud/Ramadan sur 5 ans (lib `hijri-converter`) | `backend/app/models/public_holiday.py` + `services/holidays_service.py` + Alembic + seed | 04 P1, P10 |
| C | **Type de congé Hadj** : type `HADJ`, durée typique 30 j, quota max 1 fois tous les 5 ans, règle priorité ancienneté + tirage au sort si surdemande, blackout rôles essentiels. Workflow validation DRH + Cabinet. | `backend/app/models/leave.py` (modif type) + `services/leave_service.py` + UI dédiée | 04 P2 |
| C | **Brancher l'auto-approbation congés** : intercepteur `LeaveRequest.create()` qui évalue `LeaveAutoApprovalRule`, applique APPROVED si OK | `backend/app/services/leave_service.py` (modif) | 04 P3 |
| C | **Notifications décision congé** : event `LeaveDecided` → `notification_service.create()` + email + SMS | déjà partiellement Sprint 3, finaliser triggers | 04 P4 |
| E | **PRA site secondaire** : déploiement standby cluster K8s sur D2 ; réplication PG streaming async ; MinIO mirror ; documentation bascule ; test annuel obligatoire | `backend/deploy/dr/` (manifests + runbooks) | 12 P3 |
| F | **Tests E2E Playwright complets** : 8 scénarios par module (login → flux complet → vérification audit) sur leave, recruitment, training, performance, discipline, careers, documents, organization | `tests/e2e/{leave,recruitment,training,performance,discipline,careers,documents,organization}.spec.ts` | 11 P3 |
| F | **Tests de charge k6** : 5 scénarios (login storm, demandes congé pic mensuel, recherche dossiers, dashboard concurrentiel, upload OCR). Cibles p95 < 500 ms, p99 < 2 s, 0 % erreur jusqu'à 5000 vusers | `tests/load/k6/{login,leave,search,dashboard,upload}.js` + dashboard Grafana | 11 P5 |
| G | **DPO** finalise les déclarations CNPDP-GN (parcours administratif) | document de déclaration | 13 P2 |

**Démos sprint 5 :**
- Création commission de recrutement → membres + quorum → tenue session → vote → PV PDF signé.
- Candidat externe → portail `prim.gov.gn/candidature/CONCOURS-2026-A1` → soumet CV → reçoit accusé PDF signé.
- Demande de congé Tabaski → fériés correctement décomptés ; demande Hadj → workflow Cabinet.
- Bascule failover PRA staging → site secondaire prend la main en < 4 h (RTO testé).
- Test charge k6 : login storm 1000 vusers → p95 < 500 ms.

**Critères d'acceptation :**
- 1 commission recrutement testée bout en bout avec PV signé valide.
- 1 candidature externe testée bout en bout.
- Aucun congé incluant un férié national n'est mal décompté (test sur 11 fériés).
- PRA testé une fois.
- Tests E2E couvrent 8 modules métier.

---

### Sprint 6 — Frontend perf/carrière + Formation complète + Organisation budgétaire (Semaines 11-12)

**Objectif :** désiloter les modules métier mock-only, fermer le cycle formation, doter l'organisation de sa dimension budgétaire.

| Track | Action | Livrables | Réf. fiche |
|---|---|---|---|
| D | **Connexion frontend perf/carrière aux APIs** : remplacer `mock_career_moves` (`careers/pages/advancements/advancements.ts:8`) et calculs locaux (`perf-results.ts:29-32`) par appels services réels | services Angular `performance.service.ts`, `careers.service.ts` (modif) + composants | 05 P5 |
| C | **Génération PDF certificats** : appeler `pdf/renderer` dans `issue_certificates_for_session` avec template `certificat_formation_v1.html`. Stockage MinIO + lien `file_id` + `document_id` archivage dossier agent. | `backend/app/services/training_service.py:655-674` (modif) + template | 06 P1 |
| D | **Frontend page éval (chaud + froid)** : route publique `/public/training/evaluations/{token}` (sans auth) → formulaire dynamique JSONB schema | `src/app/public/training-evaluation/` | 06 P2 |
| D | **Frontend page certificats** : (a) admin RH émission batch, (b) agent voit ses certificats dans son self-service avec téléchargement signé, (c) vérification publique | `src/app/modules/training/pages/certificates/` + `src/app/public/certificat-verify/` | 06 P3 |
| C | **Scheduler évaluations à froid** : worker arq nocturne, notification email + SMS chaque évaluateur, relance J+7 si pas répondu | `backend/app/workers/cold_eval_worker.py` + arq schedule | 06 P4 |
| C | **Trigger éval à chaud à transition COMPLETED** : à chaque session passant COMPLETED, créer `TrainingEvaluation(HOT)` pour chaque participant ATTENDED/PARTIAL et envoyer invitation immédiate | `backend/app/services/training_service.py` (modif transition) | 06 P5 |
| B | **Avancement automatique à l'ancienneté** : worker mensuel `compute_pending_advancements` qui itère agents, vérifie `anciennete_grade_jours >= duree_min_echelon`, propose `EmployeeMovement(type=ADVANCEMENT, status=DRAFT)`. UI DRH = file d'attente d'avancements. | `backend/app/workers/advancement_worker.py` + UI dédiée | 05 P3 |
| B | **Distinguer Promotion de grade vs Mouvement géographique** : nouveau type `GRADE_PROMOTION` séparé, lien `civil_service_grade_id`, workflow validation nominale (DRH → Cabinet pour cadres A) | `backend/app/models/employee.py` (movement type enum), API, UI | 05 P4 |
| B | **Dimension budgétaire postes** : `Position.salary_grade_id` (FK), `monthly_cost_min/max/avg` calculé, `annual_envelope`. Vue `vw_position_occupancy`. Dashboard `/organization/masse-salariale`. | `backend/app/models/position.py` (modif) + Alembic + dashboard | 08 P1 |
| B | **Référentiel fonctions FP-GN** : table `civil_service_function` (code REPC-XXXXX, libellé, famille métier RIME-équivalent, niveau hiérarchique). `Position.function_id` FK. Seed depuis DGFP (D7 étendu). UI = liste fermée. | `backend/app/models/civil_service.py` (extension) + seed | 08 P2 |
| B | **Versioning organigramme** : table `organization_chart_snapshot` (id, taken_at, scope, payload JSONB signé Ed25519). Job nocturne snapshot quotidien + snapshot manuel à chaque publication. Endpoint `/organization/chart?at=YYYY-MM-DD` historique. | `backend/app/models/organization.py` (extension) + worker + service | 08 P3 |
| B | **Brouillons organigramme backend** : table `organization_draft` (owner_user_id, payload, status DRAFT/SUBMITTED/APPROVED/REJECTED/PUBLISHED), workflow validation, plus de localStorage | `backend/app/models/organization.py` + service + UI Angular refacto | 08 P4 |
| F | **Pen-test externe rendu** : rapport reçu, plan de remédiation établi | rapport PDF + tickets remédiation | 11 P4 |
| G | **Audit RGAA externe rendu** : rapport reçu, plan de correction | rapport + tickets | 13 P16 |
| G | **Tutoriels vidéo** (vidéaste) : 12 capsules (3-5 min) login/MFA/congé/validation/etc. en français + sous-titres | `docs/user/videos/` | 13 P8 |

**Démos sprint 6 :**
- Cycle 360° complet sur staging avec données réelles.
- Création poste avec coût indiciaire calculé ; dashboard masse salariale par direction.
- Génération automatique d'un certificat PDF à fin de session formation.
- Évaluation à froid : J+90 → invitation envoyée → réponse anonyme → score consolidé.
- Avancement automatique : worker mensuel propose 12 avancements à valider DRH.
- Snapshot organigramme historique : voir l'organigramme au 01/01/2026.

**Critères d'acceptation :**
- 0 mock_* restant dans modules perf/carrière frontend.
- 100 % des sessions terminées génèrent automatiquement un certificat PDF.
- Coverage backend services métier > 70 % atteinte.
- Pen-test : 0 vulnérabilité critique non corrigée à la fin du sprint suivant.

---

### Sprint 7 — Plan développement + Recours + Onboarding backend + Self-service complet + Stack logs (Semaines 13-14)

**Objectif :** boucler le cycle RH (PDP, recours, onboarding), rendre le portail agent vraiment utilisable, mettre en place l'observabilité opérationnelle.

| Track | Action | Livrables | Réf. fiche |
|---|---|---|---|
| B | **Plans de développement individuels** : modèle `IndividualDevelopmentPlan` (employee_id, period, gaps_snapshot_id, planned_trainings[], planned_actions[], reviews[]). Workflow signature manager + agent. | `backend/app/models/idp.py` + service + API + UI Angular | 05 P6 |
| B | **Recours et appels discipline** : modèle `DisciplineAppeal` (case_id, filed_by, filed_at, grounds, status, decision). Workflow conseil de discipline → recours hiérarchique → TA si applicable | `backend/app/models/discipline.py` (extension) + service + UI | 05 P7 |
| B | **Lien GPEC → besoins formation** : worker hebdo qui transforme `CompetencyGapsSnapshot.gaps_critical[]` en `TrainingNeed`, alimente la file de demandes formation. Plan annuel pré-rempli. | `backend/app/workers/gpec_to_training_worker.py` | 05 P9 |
| C | **Modèle backend onboarding** : `RecruitmentOnboarding` (employee_id, template_id, started_at), `OnboardingStep` (label, due_date, status, owner_user_id), `OnboardingFeedback` (kind: 30j/60j/90j). Worker arq d'escalade (J+3 → manager, J+7 → DRH). | `backend/app/models/onboarding.py` + service + worker | 03 P3 |
| C | **Embauche déclenche onboarding automatique** : `candidate_conversion` crée Employee **et** instancie OnboardingTemplate adapté au poste | `backend/app/services/candidate_conversion.py` (modif) | 03 P4 |
| D | **Sections portail agent manquantes** : (a) Mes évaluations + lien plan développement, (b) Mes objectifs, (c) Mon parcours pro (timeline), (d) Mes certificats (téléchargement), (e) Mes données personnelles + droits RGPD | `src/app/modules/self-service/agent-portal.{ts,html}` (refacto + nouveaux composants) | 09 P5 |
| D | **Hero cards portail agent** : solde congés, prochaine formation, évaluation à compléter, dossier documents en attente | UI refacto | 09 P6 |
| D | **Prim'Assistant intégré au portail** : bulle de chat persistante bas-droite ; quick-prompts contextuels | `src/app/shared/components/prim-assistant-floating/` | 09 P7 |
| D | **Portail manager — hero cards + calendrier équipe + délégation** | `src/app/modules/self-service/manager-portal.{ts,html}` (refacto) | 09 P8, P9 |
| D | **Portail agent — droits RGPD self-service** : page `/mon-compte/donnees` → vue complète, demande rectification (workflow validé RH), demande oubli (workflow validé DRH + DPO) | `src/app/modules/self-service/my-data/` | 02 P9, 13 P4 |
| E | **Stack logs centralisée Loki + Promtail + Grafana** : datasource unique, dashboards par module + dashboard sécurité (logins échoués, 401, 403). Rétention 30j chaud + archivage MinIO 1 an. | `backend/deploy/observability/` (Helm subcharts ou external) | 12 P7 |
| E | **Alerting Alertmanager** : alertes p95 latency, 5xx, queue arq lag, login storm, PG replication lag → email DSI + SMS d'astreinte | `backend/deploy/observability/alertmanager.yaml` + rules | 12 P8 |
| E | **Runbooks d'incident** : 10 runbooks types Markdown dans `docs/runbooks/` | `docs/runbooks/{pg-down,minio-full,oom,brute-force,ocr-stuck,tls-expiring,...}.md` | 12 P9 |
| F | Tests E2E supplémentaires (PDP, recours, onboarding, droits RGPD) | `tests/e2e/*.spec.ts` | 11 P3 |
| G | **Aide contextuelle in-app** : tooltips informatifs + walkthroughs guidés Shepherd.js sur premier accès | composant `src/app/shared/help/walkthrough.directive.ts` + scripts | 13 P9 |
| G | **Centre d'aide en ligne** : `help.prim.gov.gn` (Hugo ou VitePress) avec articles par flux + recherche | repo séparé `gpa-gouve-help/` | 13 P10 |

**Démos sprint 7 :**
- Agent → portail → « Mes évaluations » → voit sa 360 + plan développement signé.
- Agent demande oubli → workflow DRH+DPO → données anonymisées + audit.
- Manager → portail → calendrier équipe + bouton délégation 7 jours.
- Embauche d'un candidat HIRED → checklist onboarding 30/60/90j s'instancie automatiquement.
- Recours discipline saisi → notification conseil + tracé immutable.
- Grafana dashboard « SI Primature » montre KPIs temps réel.

**Critères d'acceptation :**
- Portail agent : 9 sections fonctionnelles complètes.
- Cycle 360 → PDP → formation enchaîné automatiquement.
- Logs accessibles 90 j en moins de 5 s recherche.
- 10 runbooks publiés.

---

### Sprint 8 — Plan déploiement + Comité pilotage + Stabilisation + Cutover staging→prod (Semaines 15-16)

**Objectif :** boucler les éléments restants, stabiliser, valider le déploiement, organiser le cutover.

| Track | Action | Livrables | Réf. fiche |
|---|---|---|---|
| G | **Plan de déploiement national en 4 phases** : (1) Pilote 100 agents 1 direction Cabinet PM 6 sem, (2) Cabinet + SG 6 sem, (3) DG 8 sem, (4) Directions déconcentrées 12 sem. Comité pilotage hebdo. Indicateurs adoption. | `docs/deploiement-national/plan.md` + tableaux Gantt | 13 P18 |
| G | **Comité de pilotage** formel : SG (président), DRH, DSI, DAF, DPO, observateur syndical. Charte + récurrence mensuelle. | `docs/comite-pilotage/{charte,reunions/}.md` | 13 P19 |
| G | **Plan de formation utilisateur** : (a) DRH centrale 2 j, (b) DRH déconcentrées 1 j, (c) managers ½ j e-learning, (d) auto-formation agents. Calendrier 3 mois. | `docs/formation/plan.md` + supports | 13 P11 |
| G | **Communication politique du déploiement** : annonce officielle Cabinet PM, note d'info syndicats, communiqué presse, page publique « Le SIRH de la Primature » | `docs/communication/{annonce,faq,page-publique}.md` | 13 P20 |
| G | **SLA et catalogue de services** : engagements (disponibilité 99,5 %, support 8h-17h ouvré, MTTR critique < 4 h), catalogue services SI par module | `docs/sla.md` | 13 P21 |
| G | **Référents fonctionnels par direction** : 1-2 personnes par direction formées en avance, point de contact local | identification + formation | 13 P22 |
| G | **Charte d'utilisation** : `/charte-utilisation` à accepter au 1er login | composant Angular + back | 13 P12 |
| F | **Smoke tests post-déploiement** : 10 endpoints critiques testés automatiquement après chaque déploiement, alerte Slack/email si KO | `tests/smoke/post-deploy.sh` + intégration CD | 11 P13 |
| F | **Données de test réalistes** : seed `seed_test_realistic.py` ~500 agents synthétiques crédibles (noms guinéens, structures Primature) | `backend/scripts/seed_test_realistic.py` | 11 P14 |
| E | **Retrait définitif mock Node** : (a) confirmation 4 sem stabilité prod Python, (b) archive `mock-backend/` dans tag `legacy-mock-archived-2026-XX`, (c) suppression du tronc, (d) suppression dépendances Node | branche + PR + commit | 12 P10 |
| E | **Frontend séparé du backend** : build Angular dans image nginx ; Helm chart séparé ; déploiement indépendant | `Dockerfile.frontend`, `deploy/helm/frontend/` | 12 P11 |
| E | **GitOps ArgoCD** : tout le cluster décrit en Git, rollback git = rollback infra | `deploy/gitops/{apps,environments}.yaml` | 12 P16 |
| Tous | **Bug fixes pen-test** : remédier toutes les vulnérabilités du rapport pen-test (Sprint 6) | tickets clos | 11 P4 |
| Tous | **Bug fixes RGAA** : remédier les non-conformités prioritaires identifiées en Sprint 6 | tickets clos | 13 P16 |
| Tous | **Cutover staging → prod** : checklist complète, validation comité pilotage, déploiement, smoke tests, suivi heure par heure les premières 48 h | `docs/cutover-prod/checklist.md` | 12 P5 |

**Démos sprint 8 :**
- Plan de déploiement présenté en comité de pilotage et validé.
- Pilote pré-lancé sur la direction « Cabinet PM » (J+1 du déploiement prod).
- 1ères 48 h en prod : smoke tests verts, dashboards Grafana stables.
- Communiqué presse publié.

**Critères d'acceptation Vague A :**
- ✅ 23 actions A1-A23 livrées et acceptées.
- ✅ 0 vulnérabilité critique pen-test résiduelle.
- ✅ Score Lighthouse Mobile ≥ 80 (perf, a11y, best-practices).
- ✅ Couverture tests backend services métier ≥ 70 %.
- ✅ Couverture E2E 8 modules métier.
- ✅ Backup PG + MinIO testés ; PRA testé une fois.
- ✅ MFA obligatoire 100 % rôles critiques.
- ✅ DPO + registre + 3 DPIA + déclaration CNPDP-GN faits.
- ✅ Pages légales + manuel utilisateur + plan déploiement publiés.
- ✅ Comité pilotage en place ; pilote lancé.

## 5. Backlog ordonné par dépendances (vue compacte)

```
Sprint 0 → Décisions D1-D14 (BLOQUANTES)
            │
            ├──► Sprint 1 ─ A (MFA back) ─ D (MFA UI, Reset, Cookie) ─ E (Backup PG)
            │              │
            │              └─► Sprint 2 ─ A (CSP/CORS) ─ D (Guards 9 modules) ─ E (PG HA, MinIO mirror) ─ G (Pages légales, DPO, Cookies)
            │                          │
            │                          ├─► Sprint 3 ─ B (Statutaire FP-GN, Sanctions, Prescription) ─ C (Worker email, Templates, Triggers, SMS) ─ E (Partition, GIN, Chiffrement, Purge) ─ G (3 DPIA)
            │                          │
            │                          └─► Sprint 4 ─ B (Signature PAdES, Hardening uploads, Templates PDF) ─ C (Ollama, FTS GED) ─ D (PWA, Responsive) ─ E (CD, HPA/PDB) ─ F (Pen-test lancé) ─ G (Manuel, Audit RGAA lancé)
            │                                       │
            │                                       └─► Sprint 5 ─ B (Commissions) ─ C (Portail public, Calendrier GN, Hadj, Auto-approbation) ─ E (PRA) ─ F (E2E 8 modules, Charge k6) ─ G (Déclaration CNPDP)
            │                                                    │
            │                                                    └─► Sprint 6 ─ D (Frontend perf/carrière) ─ C (PDF certif, Scheduler froid, Trigger chaud) ─ B (Avancement auto, Promotion grade, Org budgétaire, Référentiel fonctions, Versioning org, Brouillons) ─ F (Pen-test rendu) ─ G (Audit RGAA rendu, Vidéos)
            │                                                                 │
            │                                                                 └─► Sprint 7 ─ B (PDP, Recours, GPEC→Formation) ─ C (Onboarding back, Trigger embauche) ─ D (Sections portail agent, Hero cards, Prim'Assistant, Manager, Droits RGPD) ─ E (Loki, Alerting, Runbooks) ─ G (Aide in-app, Centre d'aide)
            │                                                                              │
            │                                                                              └─► Sprint 8 ─ G (Plan déploiement, Comité, Formation, Communication, SLA, Référents, Charte) ─ F (Smoke, Seed réaliste) ─ E (Retrait mock Node, Frontend séparé, GitOps) ─ Tous (Bug-fix pen-test+RGAA, Cutover prod)
```

**Dépendances inter-tracks critiques :**
- B (statutaire FP-GN, Sprint 3) bloque B (avancement auto, promotion, Sprint 6) et bloque indirectement la paie.
- E (PG HA, Sprint 2) bloque E (PRA, Sprint 5).
- A (MFA back, Sprint 1) bloque D (MFA UI, Sprint 1) — à coordonner en pair.
- D (Pages légales, Sprint 2) doit être prête avant le cutover prod (Sprint 8).
- C (Worker email + SMS, Sprint 3) bloque tous les triggers métier (sprints 4-7).

## 6. Ressources externes à mobiliser

| Externe | Quand | Estimation budget | Livrable |
|---|---|---|---|
| Juriste (CGU, mentions légales, confidentialité, charte) | Sprint 0-2 | 5-10 K€ | Textes juridiques rédigés |
| Cabinet a11y (audit RGAA + plan correctifs) | Sprint 4-6 | 5-8 K€ | Rapport + remédiation |
| Pen-tester (audit OWASP Top 10 + revue archi) | Sprint 4-6 | 8-15 K€ | Rapport + remédiation |
| Vidéaste (12 tutoriels) | Sprint 4-7 | 5-10 K€ | 12 capsules vidéo + sous-titres |
| Infra DR site secondaire | Sprint 5 | variable | Cluster K8s secondaire opérationnel |
| Ministère FP (référentiels statutaire + fonctions + sanctions) | Sprint 0 | gratuit (institutionnel) | Données structurées exploitables |
| CA / PKI / TSA Primature ou Africa Trust Network | Sprint 0-4 | variable | Certificats émis, TSA opérationnelle |
| Connecteur SMS Orange Guinée | Sprint 0-3 | abonnement | API key + crédit SMS |

## 7. Risques projet & mitigations

| # | Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Décisions amont D1-D14 non prises avant Sprint 1 | Élevée | Bloquant | Sprint 0 verrouillé, escalade Cabinet PM si retard |
| R2 | Référentiel statutaire FP-GN non fourni par Min. FP | Élevée | Bloquant Sprint 3 | Plan B : seed minimal validable + élargissement progressif |
| R3 | Pen-test révèle vulnérabilités critiques massives | Moyenne | 1-2 sprints supplémentaires | Buffer 1 semaine en fin Sprint 8 + plan remédiation prioritaire |
| R4 | Tutoriels vidéo prennent du retard | Moyenne | UX adoption Vague B | Tutoriels écrits PDF en parallèle (déjà dans Sprint 4) |
| R5 | Audit RGAA révèle non-conformités majeures | Moyenne | Sprint 6-8 | Buffer correctifs Sprint 8 |
| R6 | Équipe sous-dimensionnée (5 ETP insuffisants) | Moyenne | +2-4 semaines | Renfort externe ponctuel sur sprints chargés (3, 6, 7) |
| R7 | Prestataire SMS GN non disponible (pas d'API) | Moyenne | SMS reporté | Fallback SMS par email-to-SMS opérateur |
| R8 | Cutover prod révèle bugs non détectés | Élevée | Indisponibilité partielle 1-3 j | Smoke tests, rollback ArgoCD < 5 min, communication transparente |
| R9 | Décision politique de raccourcir Vague A | Moyenne | Risques juridiques/sécuritaires majeurs | Refus argumenté, document formel SG signé |
| R10 | Équipe surcharge / burn-out | Moyenne | Qualité dégradée | 1 sprint sur 8 (typiquement Sprint 4 ou 6) en tampon, rotation sur tâches dures |

## 8. Jalons & gouvernance

| Jalon | Date (J = Sprint 0) | Livrable | Décideur |
|---|---|---|---|
| J0 | Semaine 0 | ADR D1-D14 signés, équipes constituées | Cabinet PM + DSI |
| J1 | Fin Sprint 1 (S+2) | Auth durcie + backup PG opérationnel | DSI |
| J2 | Fin Sprint 2 (S+4) | Pages légales en ligne, PG HA, guards complets | DSI + DPO |
| J3 | Fin Sprint 3 (S+6) | Statutaire FP-GN livré, notifications fonctionnelles | DRH + DSI |
| J4 | Fin Sprint 4 (S+8) | Signature PAdES réelle, PWA déployée, manuel agent v1 | DSI + DPO + DRH |
| J5 | Fin Sprint 5 (S+10) | Portail public ouvert, calendrier GN, PRA testé | DRH + Cabinet |
| J6 | Fin Sprint 6 (S+12) | Frontend perf/carrière connecté, organisation budgétaire, pen-test rendu | DSI + DAF |
| J7 | Fin Sprint 7 (S+14) | Portail agent complet, observabilité prod | DRH + DSI |
| **J8** | **Fin Sprint 8 (S+16)** | **CUTOVER PROD + Pilote Cabinet PM** | **Comité de pilotage + SG** |

**Comité de pilotage** se réunit après chaque jalon J1-J8 pour valider et autoriser le sprint suivant.

## 9. Ce qui n'est PAS dans la Vague A

Pour mémoire — voir `MODERNISATION_00_SYNTHESE.md` § 3 — ces actions sont **Vague B** (sprints 9-22 environ) et ne doivent pas être commencées avant fin Vague A :

- Scellement audit Merkle (B1)
- Plan développement complet et recours (B11) — partiellement abordés Sprint 7
- Plan annuel formation + ISO 30414 + Kirkpatrick L4 (B12)
- SpiffWorkflow câblé + 5 modèles BPMN officiels + RAG Prim'Assistant (B13)
- API Gateway Kong/Tyk + webhooks Trésor (B14)
- Indicateurs ISO 30414 complets RH (B15)
- Visualisations stratégiques Leaflet préfectures (B17)
- Read replica + tablespace tiering (B18)
- ESLint + tests contrat OpenAPI + tests mutation (B19)
- Service mesh Linkerd + GitOps avancé (B20 partie 2)
- Cadre éthique IA RH + i18n actif EN + tests a11y CI (B21)

## 10. Critères de réussite finale Vague A

À la **revue J8** (fin Sprint 8), les indicateurs suivants doivent être verts :

| KPI | Cible Vague A |
|---|---|
| Couverture tests backend services métier | ≥ 70 % |
| Tests E2E modules métier majeurs | ≥ 8 modules couverts |
| Pen-test : vulnérabilités critiques résiduelles | 0 |
| Audit RGAA niveau atteint | AA partiel + plan vers AA complet |
| MFA actif rôles critiques | 100 % |
| Backup PG quotidien testé | OK |
| Backup MinIO testé | OK |
| PRA testé une fois | OK |
| RTO démontré | < 4 h |
| RPO démontré | < 1 h |
| Charge k6 1000 vusers login storm | p95 < 500 ms |
| Disponibilité staging mois précédent cutover | ≥ 99,5 % |
| Pages légales + DPO + DPIA + déclaration CNPDP-GN | Complètes |
| Manuel utilisateur 4 rôles | Publié |
| Plan déploiement national | Validé Cabinet |
| Pilote 1 direction lancé | OK |

**Si l'un de ces KPI est rouge, le cutover prod est différé jusqu'à mise au vert.** C'est la règle.

— Fin du plan d'exécution Vague A. —
