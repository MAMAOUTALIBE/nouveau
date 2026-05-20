# Fiche de modernisation 07 — Plateforme transverse (Workflows BPMN, GED, IA, Notifications, Rapports, Admin, Dashboard)

> Audit code réel — 2026-05-10 — Périmètre : `Final/backend/app/{api,services,models,adapters}` (workflow, document, notification, ai_assistant, dashboard, admin) et `Final/src/app/modules/{workflows,documents,ai-assistant,reports,admin,dashboard}/`

## 0. Résumé exécutif

Plateforme transverse **architecturée comme un produit moderne** (ports/adapters Hexagonaux pour Workflow, Storage, Email, LLM ; factory configurable par variable d'env). La GED est **complète au niveau modèle** (lifecycle, confidentialité, rétention, versioning, OCR, dispatches), l'admin gère utilisateurs/rôles/audit avec audit transactionnel, le Prim'Assistant a un **vrai pipeline d'intentions avec contrôle d'autorisation et confirmation utilisateur**, et le LLM est branchable Anthropic / Ollama / Mock. **Quatre angles morts à fermer pour un usage opérationnel d'État** : (1) **Spiff/BPMN n'est pas câblé en V1** → workflows = automate maison sans modélisation visuelle ni versioning ; (2) **notifications email/SMS pas livrées** (worker arq absent) → tout reste en BDD ; (3) **recherche plein-texte GED non activée** → recherche sur titres uniquement ; (4) **pas d'interopérabilité X-Road / API Gateway** → silo SI Primature, hostile aux échanges paie/État civil/Trésor. Côté souveraineté, l'Ollama local est l'arme qui rend le Prim'Assistant déployable sans flux cloud.

## 1. Périmètre inspecté

| Couche | Localisation |
|---|---|
| Workflow / BPMN | `Final/backend/app/services/workflow_service.py:1-419`, `models/workflow.py`, `adapters/workflow/{internal,spiff,factory}.py`, `api/v1/{workflow,bpmn}.py`, `Final/bpmn/` |
| GED (Documents) | `Final/backend/app/services/document_service.py:1-480`, `models/document.py`, `adapters/storage/{local_fs,minio_s3,factory}.py`, `api/v1/document.py` |
| Prim'Assistant | `Final/backend/app/services/prim_assistant.py:1-216`, `api/v1/ai_assistant.py`, `adapters/llm/{anthropic,ollama,mock,factory}.py`, `Final/src/app/modules/ai-assistant/prim-assistant.ts` |
| Notifications | `Final/backend/app/services/{notification_service,email_dispatcher}.py`, `adapters/email/{smtp,mock,factory}.py`, `api/v1/notification.py`, `models/notification.py` |
| Rapports | `Final/backend/app/services/dashboard_service.py:1-397`, `api/v1/dashboard.py:1-115`, `Final/src/app/modules/reports/pages/hr-reports/`, `dashboard/pages/hr-dashboard/` |
| Admin | `Final/backend/app/services/admin_service.py:1-484`, `api/v1/admin.py`, `Final/src/app/modules/admin/pages/{admin-users,admin-roles,admin-audit}/` |

## 2. État réel (vérifié dans le code)

### Workflow / BPMN

| Sous-module | État | Preuve | Commentaire |
|---|---|---|---|
| Moteur maison (état séquentiel) | ✅ | `workflow_service.py:1-419` | APPROVE/REJECT/ESCALATE/CANCEL/ADVANCE. Référence `WF-YYYY-NNNNNN`, escalation_level, SLA. |
| Console suivi (workflow-instances) | ✅ | `src/app/modules/workflows/pages/workflow-instances/` | OK. |
| Audit per action | ✅ | `workflow_service.py:375-384` | OK. |
| Adapter SpiffWorkflow (BPMN 2.0) | 🟡 | `adapters/workflow/spiff.py` | Présent, **non câblé** (factory utilise `internal` par défaut, Vague 6 PY-062). |
| Modèles BPMN versionnés | 🟡 | `Final/bpmn/{leave_request,attestation_request}.bpmn` + README | **2 modèles existent** (`LEAVE_REQUEST_V1`, `ATTESTATION_V1`) ; convention de nommage documentée (README). **Manquent** : `recruitment_application.bpmn`, `discipline_case.bpmn`, `dossier_signature.bpmn`, `training_request.bpmn`. Spiff non câblé en V1 → modèles non exécutés. |
| Modeleur visuel frontend (bpmn-js) | ❌ | — | Pas d'éditeur. |

### GED / Documents

| Sous-module | État | Preuve | Commentaire |
|---|---|---|---|
| Lifecycle DRAFT→IN_VALIDATION→VALIDATED→PUBLISHED→ARCHIVED | ✅ | `document_service.py:1-480` | OK. |
| DocumentType (module_scope, requires_signature/dispatch/expiry) | ✅ | `models/document.py:1-150+` | OK. |
| Confidentialité (PUBLIC/INTERNAL/CONFIDENTIAL/STRICTLY_CONFIDENTIAL) | ✅ | + `legal_hold` | RBAC `documents:view:sensitive` (l. 241-242). |
| Versioning (current_version_no + table versions) | ✅ | — | OK. |
| Champs extraits typés (TEXT/DATE/NUMBER/BOOLEAN/JSON) | ✅ | `models/document.py:458-517` | + validation humaine. |
| Rétention (retention_days, legal_hold) | 🟡 | tables existent | **Worker de purge/archivage absent** (cf. fiche 02 P6). |
| Diffusion (document_dispatches) | ✅ | modélisé | OK. |
| **Recherche plein-texte** | 🟡 | `document_service.py:227` | `ilike()` sur title/reference uniquement. **Pas de FTS PostgreSQL** (`tsvector` + index GIN). |
| Storage MinIO/S3 SSE-AES256 | ✅ | `adapters/storage/minio_s3.py` | + presigned URL 5 min. |
| Audit OCR_FIELD_VALIDATED + DOCUMENT_STATUS_CHANGED | ✅ | services | OK. |

### Prim'Assistant (IA)

| Sous-module | État | Preuve | Commentaire |
|---|---|---|---|
| Pipeline intentions | ✅ | `prim_assistant.py:1-216` | LEAVE_REQUEST_CREATE, ATTESTATION_REQUEST, STATUS_CHECK, HR_FAQ, UNKNOWN. |
| Contrôle d'autorisation par intent | ✅ | `prim_assistant.py:42-48,146` | `INTENT_PERMISSIONS` map ; bloque si insuffisant. |
| Confirmation utilisateur explicite | ✅ | `prim_assistant.py:184-215` | `requires_confirmation`, `action_draft`, endpoint `confirm`. |
| Audit (intent / blocked / confirmed) | ✅ | services | OK. |
| LLM Adapter (Anthropic / Ollama / Mock) | ✅ | `adapters/llm/factory.py:1-36` | Anthropic avec **prompt caching** (`anthropic.py:1-80+`) ; coût ~−90%. |
| RAG sur base RH | ❌ | knowledge base statique côté front | `prim-assistant.ts:42-` ~35 entrées en dur. |
| Chat agent côté frontend | 🟡 | présent | Pas branché aux endpoints ai_assistant. |
| Streaming (SSE / WS) | ❌ | — | Réponses non streamées → temps perçu plus long. |

### Notifications

| Sous-module | État | Preuve | Commentaire |
|---|---|---|---|
| CRUD notifications + inbox utilisateur | ✅ | `notification_service.py:1-184` | mark_as_read, mark_all_as_read. |
| Modèle delivery (PENDING/SENT/READ/FAILED/CANCELLED, attempts, scheduled_at) | ✅ | `models/notification.py` | OK. |
| Email dispatcher async | 🟡 | `email_dispatcher.py:1-116` | Conçu pour worker arq Vague 4 PY-044 ; **worker absent**. |
| Adapter email (SMTP / SendGrid / Mock) | ✅ | `adapters/email/factory.py:1-35` | OK. |
| Templates email | ❌ | — | Texte plein dans `title`/`message`. |
| Préférences utilisateur (canaux opt-in/out) | ❌ | — | Inexistant. |
| **SMS** | ❌ | — | Aucun adapter, aucun connecteur (Orange API GN, Twilio, africastalking, etc.). |
| Trigger notif depuis modules métier | ❌ | grep modules ↔ notification | **Aucun appel** détecté depuis leave / training / workflow → notification non générée. |

### Rapports

| Sous-module | État | Preuve | Commentaire |
|---|---|---|---|
| Dashboard summary KPI | ✅ | `dashboard_service.py:1-397` | active/on_leave, leave pending, training in_progress, etc. |
| Reports SQL (employees-by-direction, leave-by-status) | ✅ | `api/v1/dashboard.py:1-115` | OK. |
| Filtrage par direction (scope) | ✅ | — | OK. |
| Exports CSV / Excel | 🟡 | `recruitment/bi-export` non implémenté | Quelques exports frontend (CSV) ; rien de standardisé. |
| Indicateurs RH ISO 30414 (TMP, turnover, masse salariale, pyramide) | 🟡 | Turnover proxy via discipline + perf ; masse salariale absente | Couverture partielle. |
| Modernization status (PY-001 → PY-071) | ✅ (statique) | `dashboard_service.py` | 21 DONE / 11 PLANNED. |

### Admin

| Sous-module | État | Preuve | Commentaire |
|---|---|---|---|
| CRUD users | ✅ | `admin_service.py:1-484` | + status ACTIVE/SUSPENDED/DISABLED, password reset. |
| CRUD roles + permissions | ✅ | + system roles protégés | OK. |
| Set user roles (idempotent) | ✅ | `admin_service.py:292-314` | OK. |
| Audit consultation | ✅ | `admin-audit` page front présente | UI existe ; à vérifier filtres/exports. |
| Scope user (GLOBAL/DIRECTION/UNIT) | ✅ | UserScope | OK. |

### Dashboard exécutif

| Sous-module | État | Preuve | Commentaire |
|---|---|---|---|
| KPI temps réel (lite) | ✅ | `hr-dashboard` front | leave_pending, documents_pending_validation, discipline_open, workflows_in_progress. |
| Refresh | 🟡 | polling HTTP | Pas WebSocket/SSE. |
| Filtrage scope | ✅ | — | OK. |
| Visualisations avancées | ⚪ | — | À enrichir (heatmaps, sparklines, comparaisons inter-direction). |

## 3. Comparaison aux standards GovTech

| Standard / Pratique | Position | Écart |
|---|---|---|
| **OMG BPMN 2.0** + moteur exécutable | Spiff prêt, non câblé | 🟡 |
| **France — Démarches Simplifiées** (workflow visuel pour agents non-tech) | Pas d'éditeur visuel | ❌ |
| **GED ISO 19475** / **CECURITY-PEA** (préservation à long terme) | Lifecycle ✅, archivage WORM ❌ | 🟡 |
| **CMMI Search / OpenSearch** (FTS) | `ilike` only | ❌ |
| **Estonia X-Road** (interconnexion services publics) | Aucun | ❌ — point critique pour l'État |
| **France — API Particulier / API Entreprise** style data exchange | Aucun | ❌ |
| **OECD AI in Public Sector** (transparence, audit, contestation) | Audit ✅, contestation par citoyen ❌ | 🟡 |
| **eIDAS — services de confiance** (TSA, SCA) | Absents | ❌ |
| **WCAG 2.1 / RGAA 4.1** sur dashboard et admin | Non audité | 🟡 |
| **OpenTelemetry traces transverses workflows** | Opt-in, pas exploité | 🟡 |

## 4. Risques en exploitation publique

| # | Risque | Sévérité | Délai |
|---|---|---|---|
| R1 | **Workflows non versionnés / non visuels** → modifications de processus = code Python → impossible pour DRH de modeler ses propres processus → goulet d'étranglement IT. | Élevée | Continu |
| R2 | **Notifications jamais envoyées** → tout le SI est silencieux → utilisateurs doivent se connecter pour savoir → adoption faible. | **Critique** | Immédiat |
| R3 | **SMS absent** → exclusion des agents en région à connectivité limitée. | Élevée | Continu |
| R4 | **Recherche GED faible** → DRH cherche un arrêté de 2024 → ne trouve pas → ressaisit → désordre archivistique. | Élevée | Continu |
| R5 | **Aucune interopérabilité** → Trésor demande effectifs par direction par CSV manuel mensuel → erreurs, retards. | Élevée | Mensuel |
| R6 | **LLM Anthropic en prod par défaut** → données RH (FAQ contenant noms agents, CV) hors juridiction GN. | Élevée | À l'activation |
| R7 | **Knowledge base Prim'Assistant figée côté front** → réponses obsolètes dès évolution des règles RH → perte de confiance. | Moyenne | Continu |
| R8 | **Pas de rétention/archivage GED** → croissance MinIO non maîtrisée + non-conformité. | Moyenne | À J+12 mois |
| R9 | **Dashboard polling** → charge inutile + latence visible. | Faible | Continu |
| R10 | **Pas de masse salariale** → indicateur clé RH absent. | Moyenne | Annuel |

## 5. Propositions de modernisation

### Workflow / BPMN

| # | Proposition | Bénéfice | Effort | Priorité | Dépend |
|---|---|---|---|---|---|
| **P1** | **Activer SpiffWorkflow** (`BPMN_PROVIDER=spiff`) + **compléter les modèles BPMN** : ajouter `recruitment_application.bpmn`, `discipline_case.bpmn`, `dossier_signature.bpmn`, `training_request.bpmn` au dossier `Final/bpmn/` (les 2 existants `leave_request.bpmn` + `attestation_request.bpmn` sont déjà au format conforme). Tester l'exécution de chaque modèle bout en bout. | Pivot vers BPMN véritable, auditable. | **6-10 j** | **P1** | SpiffWorkflow |
| **P2** | **Modeleur visuel frontend** : intégrer `bpmn-js` (~70 Ko + 250 Ko bundle) dans une page admin `/workflows/definitions/{id}/edit`. Édition + déploiement nouvelle version. | Autonomie DRH/MOA. | **5-7 j** | **P2** | P1 |
| **P3** | **Versioning + déploiement A/B** : nouvelle version de modèle = nouvelles instances ; instances en cours terminent sur ancienne version. Rollback. | Continuité processus. | **3-4 j** | **P2** | P1 |

### GED

| # | Proposition | Bénéfice | Effort | Priorité |
|---|---|---|---|---|
| **P4** | **Recherche plein-texte PostgreSQL** : colonne générée `tsvector` (titre + description + champs extraits OCR), index GIN, endpoint `/documents/search?q=`. Facettes (type, direction, période, confidentialité). | Lève R4. | **3-4 j** | **P0** |
| **P5** | **Archivage WORM MinIO Object Lock** + worker rétention (cf. fiche 02 P6). | Conformité légale, intégrité. | (cf. fiche 02 P6) | **P1** |
| **P6** | **Visionneuse PDF / image inline** avec annotations + diff entre versions. | UX. | **5-7 j** | **P2** |

### Prim'Assistant

| # | Proposition | Bénéfice | Effort | Priorité |
|---|---|---|---|---|
| **P7** | **Bascule Ollama par défaut** (Mistral-7B-Instruct ou Phi-3-mini) ; Anthropic en option opt-in et nominative. | Souveraineté ; lève R6. | **3 j** | **P0** |
| **P8** | **RAG sur base RH** : indexation des arrêtés / circulaires / FAQ DRH dans pgvector ou Qdrant local ; réponses sourcées avec citations. Mise à jour automatique via worker. | Lève R7. Réponses fiables et à jour. | **8-10 j** | **P1** |
| **P9** | **Streaming SSE** des réponses LLM pour temps perçu < 2 s. | UX. | **2 j** | **P1** |
| **P10** | **Étendre intentions** : `consult_solde_conges`, `liste_subordonnes`, `consult_dossier_self`, `signaler_anomalie_paie`, `demander_attestation`. Chaque nouvelle intention avec test unitaire RBAC. | Adoption agent. | **5-7 j** | **P1** | P7 |

### Notifications

| # | Proposition | Bénéfice | Effort | Priorité |
|---|---|---|---|---|
| **P11** | **Worker arq email_dispatcher** : drainer la queue PENDING en async, retry exponentiel, mark SENT/FAILED. Métriques Prometheus. | Lève R2. | **3-4 j** | **P0** | Worker arq |
| **P12** | **Templates email Jinja2** versionnés en repo : 1 par event (LEAVE_APPROVED, LEAVE_REJECTED, TRAINING_INVITED, COLD_EVAL, WORKFLOW_ESCALATED, etc.) — multilingue FR/EN. | Communications cohérentes. | **3 j** | **P0** | P11 |
| **P13** | **Adapter SMS** : `adapters/sms/{orange_gn,africastalking,twilio,mock}.py` + variable `SMS_PROVIDER`. Coûts maîtrisés via plafonds quotidiens par utilisateur. | Lève R3. | **5-7 j** | **P0** | Convention Orange Guinée ou autre |
| **P14** | **Préférences canaux** : table `notification_preferences` (user_id, event_kind, channels[]), page self-service. | RGPD-friendly. | **3 j** | **P1** | — |
| **P15** | **Triggers métier** : ajouter émission notification depuis leave_service.decide(), training_service.transition(), workflow_service.advance(), etc. Bus d'événements interne (functions ou tasks queue). | Lève R2 fonctionnellement. | **4-5 j** | **P0** | P11 |

### Rapports

| # | Proposition | Bénéfice | Effort | Priorité |
|---|---|---|---|---|
| **P16** | **Exports CSV/Excel/PDF standardisés** : endpoint générique `/reports/{report_id}/export?format=csv|xlsx|pdf` ; templates xlsx par OpenPyXL, PDF par WeasyPrint. Audit chaque export. | Données partageables ; lève R5 partiellement. | **5-7 j** | **P1** | — |
| **P17** | **Indicateurs ISO 30414 complets** : masse salariale (lien paie ou champ `salary` chiffré), pyramide d'âges, taux de féminisation, ratio cadres/non-cadres, mobilité interne, indice satisfaction (depuis 360). Dashboard `/reports/iso-30414`. | Conformité internationale. | **8-12 j** | **P1** | Lien paie |
| **P18** | **Open data** : sous-ensemble anonymisé publié en CSV signé sur `data.prim.gov.gn` (effectifs agrégés par direction, taux d'absentéisme global, % titulaires). Conformité gouvernance ouverte. | Confiance citoyenne. | **3-4 j** | **P2** | — |

### Admin & Dashboard

| # | Proposition | Bénéfice | Effort | Priorité |
|---|---|---|---|---|
| **P19** | **Page admin-audit** enrichie : recherche par utilisateur/action/période/IP, export CSV signé, vérification de l'intégrité (chaîne de hash si fiche 01 P4 livré). | Outil contrôle DSI. | **3-4 j** | **P1** | Fiche 01 P4 |
| **P20** | **Dashboard temps réel SSE** : passage du polling à Server-Sent Events pour KPI critiques (workflows en attente, demandes urgentes). | UX, charge réduite. | **3 j** | **P2** | — |
| **P21** | **Visualisations heatmap / sparkline** sur dashboard exécutif : carte des directions avec couleur = absentéisme, frises temporelles. | Pilotage stratégique. | **3-4 j** | **P2** | — |

### Interopérabilité

| # | Proposition | Bénéfice | Effort | Priorité |
|---|---|---|---|---|
| **P22** | **API Gateway** (Kong ou Traefik+) en façade : authentification clés API par consommateur (Trésor, État civil, Sécurité Sociale, BJ), rate-limit, audit, mTLS. Endpoints publics versionnés `/external/v1/effectifs-direction`, `/external/v1/agent/{matricule}` (avec consentement). | Lève R5. Pose les bases d'un X-Road guinéen. | **8-12 j** | **P1** | API Gateway, mTLS |
| **P23** | **Webhooks sortants** : abonner Trésor à `employee.movement.executed` → ils sont prévenus en push, plus de CSV manuel. | Automatisation. | **3-4 j** | **P2** | P22 |
| **P24** | **Connecteur État Civil GN** (RAVEC ou équivalent) en lecture pour validation des `national_id_number` des nouveaux agents. | Anti-doublons et anti-faux. | **5-7 j** | **P2** | P22 + accès API État Civil |

## 6. Souveraineté & UX terrain

**Souveraineté.** L'architecture Hexagonale rend l'autonomie immédiate :
- `WORKFLOW_PROVIDER=spiff` → BPMN local Python.
- `STORAGE_PROVIDER=minio` → stockage local.
- `EMAIL_PROVIDER=smtp` → SMTP local (Postfix sur l'infra Primature).
- `SMS_PROVIDER=orange_gn` ou `africastalking` → connecteur africain (préférable à Twilio US).
- `LLM_PROVIDER=ollama` → IA locale, modèles ouverts (Mistral, Phi-3, Llama 3 quantifiés Q4).
- `OCR_PROVIDER=tesseract` → OCR local.
- `SIGNATURE_PROVIDER=endesive_local` → signature locale.

Aucune ligne de code à changer pour basculer en mode pleine souveraineté ; uniquement de la configuration.

**UX terrain.**
- Dashboard sur 3G : éviter les recharges complètes ; SSE ou polling 60 s sont meilleurs que polling 5 s.
- Admin audit : table virtuelle pour 100 000+ lignes, pagination serveur.
- Prim'Assistant chat : interface très simple, **boutons d'action prédéfinis** (« Solde congés », « Mon dossier », « Demander attestation ») plutôt que tout en saisie libre.
- SMS : toujours inclure un lien court vers une page web légère, jamais d'action sensible déclenchée uniquement par SMS (KO sécurité).
- Notifications mobile : envisager une **PWA Angular** avec push notifications navigateur (le projet ne gère pas d'app native, à raison).

## 7. Décision recommandée

Trois priorités P0 à enchaîner en 2-3 semaines : **P11 + P12 + P15 (notifications email)**, **P4 (recherche FTS GED)**, **P7 (Ollama par défaut)**. Ces actions débloquent l'usage opérationnel. Coût ≈ **10-14 j-h**.

Phase **P1 (6-8 semaines)** : P1 + P8 + P10 + P13 (SMS) + P14 + P16 + P17 + P19 + P22 = **45-60 j-h**. Plateforme transverse devient un véritable produit GovTech.

Phase **P2** : P2, P3, P5, P6, P9, P18, P20, P21, P23, P24 = enrichissements et interopérabilité étendue.

**Note stratégique.** L'API Gateway + webhooks (P22-P23) est l'investissement à plus haut retour pour positionner ce SI comme **socle d'écosystème inter-administratif** plutôt que comme une application isolée. Sans cela, dans 18 mois, la Primature recevra des demandes manuelles de tous les ministères.
