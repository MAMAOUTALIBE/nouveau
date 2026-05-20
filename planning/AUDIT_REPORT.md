# Rapport d'Audit — Application RH Primature

**Date :** 2026-05-07 (audit initial) · révisé 2026-05-07 après livraison Vague 0 backend Python
**Auditeur :** Ingénieur senior full-stack (audit automatisé)
**Périmètre :** Final/ (Angular 21 + mock-backend Node.js + PostgreSQL)
**Document de référence roadmap :** `Final/docs/proposition-modernisation-rh.md`
**Note préalable :** le fichier `ROADMAP_RH.md` mentionné dans la mission n'existe pas à la racine. Le document équivalent est `Final/docs/proposition-modernisation-rh.md` (sélection IDE), utilisé comme référence.

---

## 1. Stack technique détectée

| Couche | Technologie | Version | Localisation |
|--------|-------------|---------|--------------|
| Frontend | Angular | 21.1.x | [Final/src/](Final/src/) |
| UI kit | Angular Material + Bootstrap 5 + ng-bootstrap + ngx-* | — | [Final/package.json](Final/package.json) |
| State / RxJS | RxJS 7.8 | — | services Angular standalone |
| Backend | Node.js HTTP natif (pas Express) | Node ≥ 20.19 | [Final/mock-backend/server.cjs](Final/mock-backend/server.cjs) (16 720 lignes) |
| Persistance | PostgreSQL (optionnelle) via `pg` 8.20 | — | [Final/mock-backend/persistence/postgres-sync.cjs](Final/mock-backend/persistence/postgres-sync.cjs) |
| Schémas SQL | 4 migrations | v1 → v4 | [Final/db/postgresql/](Final/db/postgresql/) |
| Tests | Vitest (unit) + Playwright (e2e) | 4 / 1.58 | [Final/tests/](Final/tests/) |
| Storage objets | FS local `mock-backend/uploads/` | — | aucun S3/MinIO/Azure Blob |
| Infra cible | Railway (un seul service) | — | [Final/railway.json](Final/railway.json) |
| Auth | Tokens HS256 maison + sessions en mémoire | — | server.cjs:12986+ |
| RBAC frontal | `AccessControlService` + `permissionGuard` | — | [Final/src/app/core/security/access-control.service.ts](Final/src/app/core/security/access-control.service.ts) |
| Roadmap docs | 5 documents architecture/cadrage | — | [Final/docs/](Final/docs/) |

**Variables d'environnement clé :** `DATABASE_URL`, `DB_SYNC_ENABLED`, `DB_SYNC_INTERVAL_MS`, `DB_BOOTSTRAP_SCHEMA`, `DB_SSL_REQUIRE`, `MOCK_API_PORT`, `MOCK_ACCESS_TOKEN_TTL_MS`, `MOCK_REFRESH_TOKEN_TTL_MS`, `MOCK_MAX_UPLOAD_BYTES`, `ALLOWED_ORIGINS`.

**Observation structurelle majeure :** le « backend » est un fichier monolithique de 16 720 lignes. Toute la logique métier, les données seed, le routing HTTP, la persistance et les pseudo-services IA y cohabitent. C'est la dette technique structurelle n°1 du projet.

---

## 2. Inventaire base de données (PostgreSQL — schéma `hr`)

### 2.1 Tables existantes (40)

**Migration 001 (socle) :** organizations, directions, units, positions, permissions, roles, role_permissions, users, user_roles, user_scopes, file_objects, employees, employee_assignments, employee_movements, leave_types, leave_balances, leave_requests, recruitment_campaigns, recruitment_applications, recruitment_status_events, recruitment_comments, recruitment_attachments, documents, document_versions, document_dispatches, workflow_definitions, workflow_steps, workflow_instances, workflow_instance_events, audit_logs, notifications.

**Migration 002 (documents unifiés) :** document_types, document_links, document_requirements, document_analysis_runs, document_extracted_fields, document_retention_rules, document_retention_events. + vues `vw_employee_documents`, `vw_employee_document_compliance`, `vw_document_processing_queue`.

**Migration 004 (personnel 360 / IA) :** employee_competencies, employee_dependents, employee_digital_badges, employee_dossier_exports, employee_turnover_risk_snapshots.

### 2.2 Tables ATTENDUES par la roadmap mais ABSENTES

| Table cible | Domaine roadmap | Impact |
|-------------|-----------------|--------|
| `training_catalog`, `training_sessions`, `training_requests`, `training_evaluations` (chaud + froid), `training_certificates` | Phase 6 Formation | Module formation persisté uniquement en mémoire |
| `performance_campaigns`, `performance_evaluations`, `performance_360_responses` (anonymisées) | Phase 5 Évaluation 360° | Anonymat 360° non garanti structurellement |
| `competency_referential`, `position_competency_requirements`, `competency_gaps` | Phase 5 GPEC | Cartographie GPEC absente (table `employee_competencies` seule) |
| `discipline_cases`, `discipline_events` | Module discipline (frontend existant) | Données en mémoire uniquement |
| `leave_service_coverage`, `leave_auto_approval_rules` | Phase 4 Continuité service / auto-approbation | Règles métier non persistées |
| `signature_providers`, `signature_envelopes`, `signature_audit_trail` | Phase 2 Signature électronique | Pas d'abstraction prestataire |

### 2.3 Couverture roadmap → BDD

| Domaine roadmap | Tables couvrant | Couverture |
|-----------------|-----------------|------------|
| 1. Socle / RBAC / audit / GED | 12 tables (users, roles, permissions, audit_logs, documents…) | **Bonne** ✅ |
| 2. Personnel / dossiers / OCR / signature | 7 tables (employees, document_analysis_runs, employee_dossier_exports…) | **Partielle** 🟡 (signature mock-only) |
| 3. Recrutement | 5 tables (recruitment_*) | **Bonne** ✅ |
| 4. Congés | 3 tables (leave_*) | **Partielle** 🟡 (pas de table couverture service) |
| 5. Performance / GPEC | 1 table (employee_competencies) | **Faible** ⚪ |
| 6. Formation | 0 table | **Absente** ⚪ |
| 7. Workflows / notifications | 4 tables (workflow_*) + notifications | **Bonne** ✅ (mais pas de moteur BPMN réel) |

**Constat :** le backend en mémoire stocke 30+ collections (agents, leaveRequests, performanceCampaigns, trainingSessions, disciplineCases, etc.) qui n'ont **aucun équivalent SQL**. Seules les 40 tables ci-dessus seraient persistées par `postgres-sync.cjs`. Le risque de perte de données au redémarrage est réel pour formation, performance, discipline, GPEC.

---

## 3. État des 7 domaines

Légende : ✅ branché et fonctionnel | 🟡 partiel / mocké / sans persistance / sans RBAC | ⚪ absent

### Domaine 1 — Socle Technique

> **Mise à jour 2026-05-07** — Le **nouveau backend Python** ([Final/backend/](Final/backend/)) implémente le socle. Le mock-backend Node.js reste le système de production en attendant le cutover (PY-071).

| Composant | État backend Node legacy | État backend Python V0 | Commentaire |
|-----------|---------|---------|-------------|
| RBAC backend (rôles, permissions, scopes) | 🟡 inégal | ✅ | [Final/backend/app/core/security/rbac.py](Final/backend/app/core/security/rbac.py) — dépendances `require_permissions`, `require_roles`, `require_scope` ; permissions wildcard `*` pour super_admin ; scopes hiérarchisés. |
| RBAC frontend (`permissionGuard`) | 🟡 5/14 modules | 🟡 (frontend non touché V0) | Sera durci dans la vague 2 (parité parité endpoint par endpoint). |
| Audit centralisé | 🟡 mémoire 500 entrées | ✅ | [Final/backend/app/core/audit.py](Final/backend/app/core/audit.py) + table `hr.audit_logs` — `AuditWriter` injectable, transactionnel (commit/rollback solidaire de la mutation métier). Logs `LOGIN_SUCCESS`, `LOGOUT` actifs. |
| Référentiel documentaire | ✅ | ⚪ (vague 2) | Domaine documents arrivera avec PY-021. |
| Authentification | 🟡 password en clair | ✅ | [Final/backend/app/core/security/passwords.py](Final/backend/app/core/security/passwords.py) — bcrypt cost 12 (passlib) + JWT HS256 (PyJWT) ; access TTL 30 min, refresh TTL 24 h. |
| Rate limiting login | ⚪ | ✅ | [Final/backend/app/core/security/rate_limit.py](Final/backend/app/core/security/rate_limit.py) — 5 tentatives → verrou 15 min par username. |
| API internes documentées | ⚪ | ✅ | OpenAPI 3.1 auto-généré par FastAPI sur `/api/v1/openapi.json` + Swagger UI sur `/docs`. |
| Plan de migration données | 🟡 stratégie écrite | ✅ | Alembic configuré, baseline matchant le schéma SQL existant ([Final/backend/alembic/versions/0001_baseline_existing_schema.py](Final/backend/alembic/versions/0001_baseline_existing_schema.py)). |
| File uploads sécurisé | ✅ | ⚪ (vague 2) | Sera repris par PY-021 + PY-045 (S3/MinIO). |
| Persistance forcée | ⚪ fallback mémoire | ✅ | Backend Python refuse de booter sans Postgres en prod (`asyncpg` strict). |
| Settings 12-factor | ⚪ | ✅ | [Final/backend/app/core/config.py](Final/backend/app/core/config.py) — Pydantic Settings, validation au boot, refus de secrets faibles en prod. |
| Tests automatisés socle | ⚪ | ✅ | 29 tests verts (passwords, tokens, rate-limiter, RBAC, settings, health, headers sécurité, format erreur). |
| CI/CD + Docker | ⚪ | ✅ | GitHub Actions (lint + types + tests unit + tests intégration PG + build Docker) + Dockerfile multi-stage + docker-compose dev (postgres + redis + minio). |

### Domaine 2 — Gestion du Personnel & Dossiers Administratifs

| Composant | État | Localisation | Commentaire |
|-----------|------|--------------|-------------|
| Fiches agents CRUD | ✅ | [server.cjs:13359-13499](Final/mock-backend/server.cjs) + [agent-list/](Final/src/app/modules/personnel/pages/agent-list/) | List + detail + create + update branchés. RBAC sur écritures. Détection duplicats / merge. |
| OCR (DocumentExtractionService) | 🟡 | [server.cjs:9125-9158](Final/mock-backend/server.cjs) | `createDocumentAnalysisRun()` retourne champs et confidence en dur. Provider hardcodé `mock-ocr`. **Aucun SDK Azure Form Recognizer ni AWS Textract.** Pas de file d'attente asynchrone. |
| Revue humaine OCR | 🟡 | (frontend documents-library) | Endpoint correction présent mais workflow de validation incomplet (pas de comparaison côte-à-côte avec champs originaux). |
| Scoring turnover (explicable) | ✅ | [server.cjs:10628-10741](Final/mock-backend/server.cjs) | **Modèle règles pondérées V1 conforme à l'exigence DRH** : congés ouverts (+12-24), absences récentes (+10-20), perf < 75 (+18-28), docs expirés (+9-18), contrat (+22-30), discipline (+15). Facteurs explicites. ❗ Pas de RBAC restrictif sur la route. |
| Tableau de bord turnover agrégé | 🟡 | [personnel-turnover-risk/](Final/src/app/modules/personnel/pages/personnel-turnover-risk/) | Liste individuelle exposée (anti-pattern roadmap : « tableau agrégé sans information individuelle inutile »). |
| Génération PDF dossier | 🟡 | [server.cjs:13639-13658](Final/mock-backend/server.cjs) | `buildSimplePdf()` produit PDF basique sans templates versionnés ni mise en page officielle DRH. |
| Signature électronique | 🟡 | [server.cjs:8752, 16333-16401](Final/mock-backend/server.cjs) | SHA-256 maison + verification_code interne. **Aucun prestataire (DocuSign, Universign, Yousign) intégré.** Empreinte SHA-256 conservée ✅. QR code utilisé via lib `qrcode` ✅. |
| Badges numériques | ✅ | [server.cjs:13627-13636](Final/mock-backend/server.cjs) + [agent-detail.ts](Final/src/app/modules/personnel/pages/agent-detail/agent-detail.ts) | QR code généré côté front, table `employee_digital_badges`. |
| Exports dossier signés | ✅ | table `employee_dossier_exports` | Historique des exports tracé. |

### Domaine 3 — Recrutement & Onboarding

| Composant | État | Localisation | Commentaire |
|-----------|------|--------------|-------------|
| Campagnes / candidatures | ✅ | [server.cjs:14216, 14770-14820](Final/mock-backend/server.cjs) + [campaigns/](Final/src/app/modules/recruitment/pages/campaigns/) | Persistance SQL OK. RBAC OK. |
| Matching CV par IA | 🟡 | [server.cjs:4442-4585](Final/mock-backend/server.cjs) | **Pseudo-aléatoire déterministe** : `deriveRecruitmentPseudoScore()` = hash SHA1(reference\|key) modulo plage. Pas de NLP, aucun SDK OpenAI/Anthropic/Mistral. Politique de pondération configurable (`/scoring-policy`) mais sans modèle réel. |
| Assistant entretien IA | 🟡 | [server.cjs:14439-14517](Final/mock-backend/server.cjs) | Banque de questions importable/exportable CSV. **Pas de génération adaptative** par compétence/CV/poste. Pas de filtre questions discriminatoires. |
| Conversion candidat → agent | 🟡 | [server.cjs:14822-15131](Final/mock-backend/server.cjs) | Onboarding tracking + 30/60/90j présents. **Pas de route automatisée `hire`** qui crée l'employee depuis l'application. Conversion à la main. |
| Détection duplicats / merge | ✅ | [server.cjs:14382-14437](Final/mock-backend/server.cjs) | Implémenté. |
| Shortlists + validations | ✅ | [server.cjs:14303-14380](Final/mock-backend/server.cjs) | Workflow validation humaine présent. |
| Interviews + évaluations | ✅ | [server.cjs:14885-15010](Final/mock-backend/server.cjs) | Reschedule + grille évaluations. |
| Dashboard exécutif / BI export | ✅ | [server.cjs:15199-15293](Final/mock-backend/server.cjs) | Présent. |

### Domaine 4 — Congés & Temps de Travail

| Composant | État | Localisation | Commentaire |
|-----------|------|--------------|-------------|
| Demandes de congé | ✅ | [server.cjs:13955-13992](Final/mock-backend/server.cjs) + [leave-requests/](Final/src/app/modules/leave/pages/leave-requests/) | CRUD + filtres OK, ❗ **GET sans RBAC** (n'importe qui authentifié peut tout voir). |
| Soldes | ✅ | [server.cjs:13994-14036](Final/mock-backend/server.cjs) | RBAC sur POST. |
| Calendrier (events) | ✅ | [server.cjs:14038-14070](Final/mock-backend/server.cjs) + [leave-calendar/](Final/src/app/modules/leave/pages/leave-calendar/) | FullCalendar branché. |
| Optimisation planning / continuité service | ⚪ | — | Pas de moteur de règles de présence minimale, ni vue d'impact prévisionnel sur le service. |
| Auto-approbation | 🟡 | [server.cjs:13901-13946](Final/mock-backend/server.cjs) | Politique d'escalade configurable (workflow automation), **mais pas de règle métier conditionnelle** type « durée ≤ 2j + quota suffisant + service non sous-effectif → auto-approuvé ». |
| Signal conflits avant soumission | ⚪ | — | Pas implémenté côté front. |

### Domaine 5 — Performance, Carrière & GPEC

| Composant | État | Localisation | Commentaire |
|-----------|------|--------------|-------------|
| Campagnes d'évaluation | ✅ | [server.cjs:15335-15370](Final/mock-backend/server.cjs) + [perf-campaigns/](Final/src/app/modules/performance/pages/perf-campaigns/) | CRUD basique. |
| Évaluation 360° (anonymat ≥ N répondants) | ⚪ | [server.cjs:15372-15418](Final/mock-backend/server.cjs) | Stocke `managerScore`, `selfScore`, `finalScore`. **Aucun module multi-évaluateurs (collègues, subordonnés)**, **aucun seuil minimal de répondants**, **aucune anonymisation structurelle** → non-conforme à la règle métier non négociable de la mission. |
| Mobilité / mouvements | ✅ | [server.cjs:15295-15333](Final/mock-backend/server.cjs) + [careers/](Final/src/app/modules/careers/) | OK. Table `employee_movements`. |
| Référentiel compétences-postes | ⚪ | — | Pas de table `position_competency_requirements`. Compétences agent isolées. |
| Cartographie écarts GPEC | ⚪ | — | Aucune route, aucun écran. |
| Rapport écarts prioritaires | ⚪ | — | Absent. |

### Domaine 6 — Formation

| Composant | État | Localisation | Commentaire |
|-----------|------|--------------|-------------|
| Catalogue / sessions / demandes | ✅ | [server.cjs:15419-15616](Final/mock-backend/server.cjs) + [training/](Final/src/app/modules/training/) | CRUD complet, en mémoire (pas de table SQL). |
| Décisions sur demandes | ✅ | [server.cjs:15562-15616](Final/mock-backend/server.cjs) | OK. |
| Évaluation à froid (relance 3 mois) | ⚪ | — | **Aucune route, aucun planificateur, aucun formulaire.** |
| Génération automatique certificats | ⚪ | — | **Aucune route, aucun template, aucun archivage automatique.** |
| Mesure d'impact formation | ⚪ | — | Absent. |

### Domaine 7 — Innovations Transverses

| Composant | État | Localisation | Commentaire |
|-----------|------|--------------|-------------|
| Workflow BPMN | 🟡 | [server.cjs:2478-2644, 13757-13953](Final/mock-backend/server.cjs) | Définitions + instances + escalade + SLA en mémoire/SQL. **Aucun moteur Camunda / Zeebe / Activiti.** Pas de modèles BPMN versionnés (`bpmn/` inexistant). |
| Cartographie circuits validation | 🟡 | (workflow_definitions seed) | 3 templates en seed (congés, recrut, discipline). Pas de modélisation BPMN visuelle. |
| Console suivi validations | ✅ | [workflow-instances/](Final/src/app/modules/workflows/pages/workflow-instances/) | OK. |
| Prim'Assistant (chatbot RH) | 🟡 | [Final/src/app/modules/ai-assistant/prim-assistant.ts](Final/src/app/modules/ai-assistant/prim-assistant.ts) | **Knowledge base statique en dur** (~7-48 entrées). Matching mots-clés. **Aucun appel LLM, aucun endpoint backend**, aucune action de création de demande, aucune vérification d'identité/droits, aucune confirmation d'utilisateur. → ne respecte aucun critère d'acceptation roadmap. |
| Notifications email/SMS | 🟡 | [server.cjs:15656-15730](Final/mock-backend/server.cjs) | File en mémoire (`notificationDeliveryJobs`), retry tracking. **Aucun connecteur SMTP, SendGrid, Mailgun, Twilio.** Channel email annoncé non envoyé, SMS absent. |

---

## 4. Frontend — pages et mocks

| Module | Pages | API connectée | RBAC route | Commentaire |
|--------|-------|---------------|------------|-------------|
| personnel | agent-list, agent-create, agent-detail, affectations, dossiers, turnover-risk | ✅ | 🟡 (uniquement agent-create) | Le scoring turnover devrait être restreint aux rôles habilités (DRH+) sans accès N+1 direct. |
| recruitment | applications, campaigns, candidate-portal, commissions, onboarding | ✅ | ✅ | OK. |
| leave | balances, calendar, requests | ✅ | ⚪ | Aucun guard de permission. |
| performance | campaigns, results | ✅ | ⚪ | Aucun guard. Pas de page 360° dédiée. |
| training | catalog, requests, sessions | ✅ | ⚪ | Pas de page éval froid ni certificats. |
| workflows | definitions, instances | ✅ | ✅ | OK. |
| careers | advancements, promotions, secondments, transfers | ✅ | ⚪ | Aucun guard. |
| documents | document-library | ✅ | ✅ | OK. |
| organization | budgeted-positions, org-chart, vacant-positions | ✅ | ⚪ | Aucun guard. |
| discipline | discipline-cases | ✅ | ⚪ | Aucun guard. |
| dashboard | hr-dashboard | ✅ | ⚪ | Aucun guard. |
| modernization | modernization-dashboard | ✅ | ⚪ | Aucun guard. |
| reports | hr-reports | ✅ | ⚪ | Aucun guard. |
| admin | users, roles, audit | ✅ | ✅ | OK. |
| ai-assistant | prim-assistant | 🟡 KB statique | ⚪ | Pas de service backend. |
| self-service | agent-portal, manager-portal | ✅ | ⚪ | Aucun guard. |

**Pages totalement mockées :** 1 — Prim'Assistant (KB en dur).
**Pages absentes (par rapport à roadmap) :**
- `performance/360-campaigns` (évaluation 360° avec collecte multi-évaluateurs)
- `gpec/competency-mapping` (cartographie compétences-postes)
- `gpec/skill-gaps-report` (écarts critiques)
- `training/cold-evaluations` (relances 3 mois)
- `training/certificates` (génération auto)
- `leave/service-coverage` (planning de continuité service)
- `signature-providers/admin` (config prestataire signature)

**Routes sans `permissionActivateGuard` :** organization, training, careers, dashboard, modernization, performance, discipline, leave, reports, self-service, ai-assistant — soit **9 modules sur 14** (~64 %).

**Composants partagés clés (✅ terminés) :** ContentLayout, NavService, AuthService, AccessControlService, ApiClientService.

---

## 5. Intégrations externes

| Intégration | Cible roadmap | État | Commentaire |
|-------------|---------------|------|-------------|
| OCR | Azure Form Recognizer / AWS Textract | 🟡 | `mock-ocr` interne, aucun SDK installé. Abstraction `DocumentExtractionService` non implémentée formellement (tout dans server.cjs). |
| Signature électronique | DocuSign / Universign / Yousign / Adobe | 🟡 | SHA-256 maison + verification code. Aucun SDK prestataire. Empreinte conservée ✅, QR code via `qrcode` ✅. |
| Email | SendGrid / Mailgun / SMTP nodemailer | 🟡 | File mémoire, aucun envoi réel. Aucun SDK installé. |
| SMS | Twilio / autre | ⚪ | Absent. |
| Stockage objets | S3 / MinIO / Azure Blob | ⚪ | Disque local `mock-backend/uploads/` uniquement. |
| Workflow BPMN | Camunda / Zeebe / Flowable | ⚪ | Modèle JS pur, pas de moteur. Aucun dossier `bpmn/`. |
| SSO / IAM | Keycloak / OIDC / SAML / LDAP | ⚪ | Auth maison, mots de passe en clair. |
| LLM / NLP | OpenAI / Anthropic / Mistral / Cohere | ⚪ | Aucun SDK. Scoring CV pseudo-aléatoire. |
| Monitoring | Sentry / Datadog / OpenTelemetry | ⚪ | Aucun. |
| QR codes | `qrcode` lib | ✅ | Réellement utilisée dans `agent-detail.ts`. |
| PostgreSQL | `pg` driver | ✅ (optionnel) | Sync configurable, fallback mémoire. |

---

## 6. Synthèse

### Décompte global

- **Modules entièrement fonctionnels (✅) :** 12/30 sous-composants (40 %)
- **Modules partiels / mockés (🟡) :** 14/30 sous-composants (47 %)
- **Modules absents (⚪) :** 4/30 sous-composants (13 %)

### Modules absents critiques

1. **Évaluation à froid des formations** (Phase 6) — aucun planificateur, aucun formulaire.
2. **Génération automatique de certificats** (Phase 6) — aucun template, aucun moteur.
3. **Cartographie GPEC** (Phase 5) — référentiel postes-compétences, écarts critiques.
4. **Planning de continuité service** (Phase 4) — règles de présence minimale, conflits.
5. **Évaluation 360° anonymisée** (Phase 5) — collecte multi-évaluateurs, seuil minimal de répondants.

### Top 7 dette technique critique

1. **Mots de passe en clair** ([server.cjs:215-260, 12990](Final/mock-backend/server.cjs)) — bcrypt/argon2 obligatoire avant prod. Risque immédiat.
2. **Backend monolithique 16 720 lignes** dans un seul fichier `server.cjs` — séparation par domaines indispensable.
3. **OCR + IA matching CV + signature électronique entièrement mockés** alors que la roadmap les annonce comme livrés. Incohérence majeure roadmap ↔ code.
4. **Audit centralisé en mémoire (max 500 entrées)** — non-conformité administrative + perte au redémarrage. Table SQL `audit_logs` quasi-vide.
5. **RBAC inégal** — 9 modules sur 14 sans `permissionGuard` côté front, plusieurs routes `GET` non gardées côté back (turnover-risk, leave/requests).
6. **Évaluation 360° sans anonymat structurel** — viole une règle métier non négociable de la mission.
7. **Pas de moteur BPMN réel** alors que la roadmap impose Camunda — workflows = scripts en mémoire.

### Risques sécurité immédiats

- Stockage password en clair (server.cjs:215-260).
- Aucun chiffrement at-rest des pièces sensibles uploadées.
- Tokens en mémoire perdus au redémarrage (sessions volatiles).
- Pas de rate-limiting sur `/auth/login`.
- Audit non persistant pour traçabilité légale.
- Données turnover-risk individuelles exposées sans contrôle de scope (N+1 direct devrait être bloqué).

### Incohérences roadmap ↔ code

| Roadmap annonce | Code livre | Écart |
|-----------------|------------|-------|
| « Comparer Azure Form Recognizer et AWS Textract » | `provider_name='mock-ocr'` | Décision technique non prise, aucun SDK installé. |
| « Score explicable plutôt qu'un modèle opaque » (turnover) | ✅ règles pondérées V1 | **Conforme.** |
| « Validation humaine obligatoire IA » | ✅ pour shortlists, 🟡 pour scoring CV (pas de gating de décision sur score) | Partiel. |
| « Signature électronique conforme exigences administratives » | SHA-256 maison | **Non conforme** — aucune valeur légale. |
| « Anonymat 360° avec seuil minimal de répondants » | Pas de mécanisme | **Non conforme.** |
| « BPMN versionné dans `bpmn/` » | Dossier inexistant | **Absent.** |
| « Prim'Assistant connecté aux API RH avec contrôle autorisation » | KB statique, aucun endpoint | **Absent fonctionnellement.** |
| « Camunda à privilégier » | Aucun moteur | **Absent.** |
| « Connecteur signature électronique » | Aucun SDK | **Absent.** |

### Composants à passer en ✅ après actions ciblées (effort < 2j chacun)

- Audit DB : remplacer buffer mémoire par insert SQL sur `hr.audit_logs` à chaque mutation sensible.
- Hash bcrypt sur le login (pas besoin de migrer prestataire SSO en V1).
- Ajouter `permissionActivateGuard` aux 9 modules manquants.
- Restreindre `GET /personnel/turnover-risk` et `GET /leave/requests` par RBAC + scope.
- Ajouter règle métier auto-approbation congés courts (durée ≤ 2j + quota OK + service ≥ effectif min).
- Implémenter relance à froid formation (cron simple sur dates+90j).

### Verdict global

**État de maturité : POC avancé / 70 %, pas prod-ready.**

- Le périmètre fonctionnel couvert est large (15 modules métier branchés à l'API, 34 pages opérationnelles).
- Les fondations BDD/RBAC/audit existent mais sont **inégalement appliquées**.
- Les briques IA et intégrations externes sont **systématiquement mockées** alors que la roadmap les annonce livrées.
- La sécurité (passwords clairs, audit volatile) bloque toute mise en production réelle.
- 5 modules entiers de la roadmap sont **structurellement absents** (éval froid, certificats, GPEC, 360° conforme, planning service).

---

## 7. Recommandations pour Phase 2 (PLAN_ACTION.md)

Liste indicative de **épics** que la Phase 2 devra décomposer en tickets atomiques :

- **EPIC-RH-SEC** Sécurisation auth + audit persistant + RBAC complet (P0 bloquant).
- **EPIC-RH-OCR** Intégrer abstraction `DocumentExtractionService` + 1 prestataire réel (Azure ou AWS).
- **EPIC-RH-SIGN** Intégrer wrapper signature + 1 prestataire réel + QR vérification.
- **EPIC-RH-360** Module évaluation 360° anonymisé conforme.
- **EPIC-RH-GPEC** Référentiel compétences-postes + cartographie + écarts.
- **EPIC-RH-FORMATION** Évaluation à froid + générateur certificats.
- **EPIC-RH-CONGES** Auto-approbation conditionnelle + planning continuité service.
- **EPIC-RH-BPMN** Évaluation Camunda vs maintien moteur maison + modèles BPMN versionnés.
- **EPIC-RH-NOTIF** Connecteur SMTP/SendGrid + audit envois.
- **EPIC-RH-PRIM** Prim'Assistant : endpoint backend, intentions, contrôle d'autorisation, confirmation.
- **EPIC-RH-REFACTOR** Découpe `server.cjs` 16 k lignes en modules par domaine (P1, transverse).

**Statut :** rapport prêt pour validation. **N'avance pas en Phase 2 tant que ce rapport n'est pas validé.**
