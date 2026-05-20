# Fiche de modernisation 06 — Formation

> Audit code réel — 2026-05-10 — Périmètre : `Final/backend/app/{api,services,models}/training*` et `Final/src/app/modules/training/`

## 0. Résumé exécutif

Modélisation **complète et propre** : catalogue, sessions, participants, demandes, **évaluations à chaud ET à froid (J+90)** dans le schéma, certificats avec hash + verification code, endpoints publics anonymes pour répondre aux évaluations et vérifier un certificat. **Trois trous opérationnels** : (1) **pas de scheduler** pour relancer les évaluations à froid (l'admin doit appeler manuellement `/cold-evaluations/launch-pending`) ; (2) la **génération PDF du certificat n'est jamais appelée** (le hook existe mais l'orchestrateur ne le déclenche pas) ; (3) l'**impact formation** (corrélation formation → performance / mobilité) n'est **pas mesuré** ; pas de plan de formation annuel ni d'alignement automatique avec la GPEC. Côté frontend, **deux pages essentielles manquent** : formulaire d'évaluation à chaud/froid (pour répondre via lien d'invitation) et émission/consultation des certificats.

## 1. Périmètre inspecté

| Couche | Localisation |
|---|---|
| Modèle | `Final/backend/app/models/training.py:1-279` |
| Service | `Final/backend/app/services/training_service.py:1-744` |
| API | `Final/backend/app/api/v1/training.py:1-394` |
| Schemas | `Final/backend/app/schemas/training.py` |
| Pages | `Final/src/app/modules/training/pages/{training-catalog,training-requests,training-sessions}/` |

## 2. État réel (vérifié dans le code)

| Sous-module | État | Preuve | Commentaire |
|---|---|---|---|
| Catalogue (intitulé, organisme, code, catégorie, durée) | ✅ | `models/training.py:34-54` | OK + `is_active`. |
| Sessions (dates, lieu, capacité, workflow) | ✅ | `models/training.py:57-98` | PLANNED→IN_PROGRESS→COMPLETED/CANCELLED. **`cold_eval_scheduled_for` calculé J+90** ✅. |
| Participants (REGISTERED/ATTENDED/PARTIAL/NO_SHOW/CANCELLED) | ✅ | `models/training.py:100-136` | + score final + validation instructeur. |
| Demandes (PENDING→APPROVED/REJECTED/CANCELLED) | ✅ | `models/training.py:138-180` | + motif, décision, trace décideur. |
| Évaluations à chaud + à froid | ✅ (modèle) | `models/training.py:182-227` | `kind` HOT/COLD, unicité (session, employee, kind), invitation token, JSONB answers, score 0-100. |
| Certificats (file_id, document_id, verification_code, signature_hash) | ✅ (modèle) | `models/training.py:229-279` | Template version. |
| API CRUD complète | ✅ | `api/v1/training.py:41-352` | Catalogue, sessions, participants, demandes, certificats. |
| Endpoints publics anonymes | ✅ | `api/v1/training.py:357-394` | Évaluations + vérification certificat par token/code. |
| Audit | ✅ | services + API | TRAINING_*_CREATED/TRANSITIONED/ISSUED. |
| Frontend training-catalog | ✅ | `training-catalog.ts:1-248` | GridJS, filtres, export CSV, RBAC. |
| Frontend training-requests | ✅ | `training-requests.ts:1-364` | Approve/Reject avec motif. |
| Frontend training-sessions | ✅ (présent) | `training-sessions.ts` | Pas inspecté en profondeur. |
| **Frontend page éval (HOT et COLD)** | ❌ | — | Endpoints publics existent, pas de UI Angular. |
| **Frontend page certificats** | ❌ | — | API existe, pas de composant. |
| Évaluation à chaud — déclenchement | ❌ | — | Pas de trigger automatique à passage `COMPLETED`. |
| Évaluation à froid — scheduler | ❌ | manuel | `POST /cold-evaluations/launch-pending` doit être appelé par un admin. **Aucun cron / arq schedule**. |
| Notifications (email d'invitation éval) | ❌ | `training_service.py:502` (TODO PY-044) | Pas envoyées. |
| **Génération PDF certificat** | ❌ | `training_service.py:655-674` | `issue_certificates_for_session` ne remplit pas `file_id`/`document_id` — `PdfRenderer` existe mais n'est pas appelé. |
| Archivage certificat dans dossier agent | ❌ | FK existe inutilisée | À chaîner. |
| **Impact formation (corrélation perf, mobilité)** | ❌ | — | Aucun lien training ↔ performance / GPEC / employee_movement. |
| **Plan de formation annuel** | ❌ | — | Pas de table `training_plan`, pas de CRUD. |
| Suivi budgétaire (coût) | ❌ | aucun champ `cost` | Modèle catalogue n'a pas de `cost_per_seat`, sessions pas de `total_budget`. |

## 3. Comparaison aux standards GovTech

| Standard / Pratique | Position | Écart |
|---|---|---|
| **France — DGAFP / Plan annuel de formation** (chaque administration produit un plan) | Absent | ❌ |
| **France — Mon Compte Formation (CPF)** transposé FP | Absent | ⚪ Pas applicable directement, mais une logique « droits formation par agent » est attendue. |
| **OPCA / OPCO FR** (suivi prestataires) | Absent | ⚪ |
| **Sénégal — ENA / Cellule Formation** (mutualisation inter-ministérielle) | Tout est `organization_id`-scopé | ❌ Pas de pooling. |
| **Convention Kirkpatrick — niveaux 1 à 4** (réaction, apprentissage, comportement, résultats) | Niveaux 1 (chaud) ✅ et 3 (froid J+90) ✅ modélisés ; 4 (résultats) absent | 🟡 Bonne base, à exploiter. |
| **ISO 30414** indicateurs formation (heures/agent, coût/agent, taux complétion) | Absent | ❌ |
| **eIDAS — certificats** (signature, vérification publique) | Hash + verification_code modélisés | 🟡 Pas de vraie signature (cf. fiche 02 P2). |
| **WCAG / RGAA** sur portail public éval/vérif | Absent (pas de UI) | ❌ |
| **France — RNCP/RS** (référentiel certifications) | Aucun lien | ⚪ V2+. |

## 4. Risques en exploitation publique

| # | Risque | Sévérité | Délai |
|---|---|---|---|
| R1 | **Évaluations à froid jamais lancées** → preuve d'efficacité absente → budget formation contesté à l'arbitrage budgétaire. | **Critique** | À J+90 de la 1re session |
| R2 | **Certificats sans PDF** → agents ne reçoivent rien → pas de trace dans leur dossier → contestation lors d'un avancement. | **Critique** | À chaque session |
| R3 | **Pas de plan annuel** → formations à la demande → désalignement avec besoins GPEC → gaspillage budget. | Élevée | À l'année budgétaire |
| R4 | **Pas de coût** → impossible de produire le rapport « coût formation par agent / par direction ». | Élevée | À première demande Trésor |
| R5 | **Pas de notification** → demandeurs ignorent leur convocation → no-show massif. | Élevée | Continu |
| R6 | **Pas de UI éval** → seul un développeur peut répondre via curl → 0 % de complétion. | **Critique** | Immédiat |
| R7 | **Pas de mutualisation inter-ministérielle** → chaque ministère re-négocie ENA → coûts +30 %. | Moyenne | Annuel |
| R8 | **Pas de Kirkpatrick niveau 4** (impact business) → pas de ROI → coupes budgétaires. | Moyenne | Annuel |

## 5. Propositions de modernisation

| # | Proposition | Bénéfice | Effort | Priorité | Dépend |
|---|---|---|---|---|---|
| **P1** | **Génération PDF certificat** : appeler `pdf/renderer` dans `issue_certificates_for_session` avec template `certificat_formation.html` (en-tête République de Guinée, intitulé, formateur, dates, score, hash + QR code de vérification). Stockage MinIO + lien `file_id` + lien `document_id` pour archivage dossier agent. | Certificats émis et archivés. Levée du R2. | **3-4 j** | **P0** | PDF + Storage |
| **P2** | **Frontend page éval (chaud + froid)** : route publique `/public/training/evaluations/{token}` (sans auth) → formulaire dynamique depuis JSONB schema, soumission. Page Angular standalone légère. | Lève le R6 (passage de 0 % à >50 % de réponses). | **3-4 j** | **P0** | — |
| **P3** | **Frontend page certificats** : (a) admin RH peut émettre par session (batch), (b) agent voit ses certificats dans son self-service avec lien téléchargement signé, (c) vérification publique `/public/certificats/verify/{code}` → page sobre montrant validité. | Boucle complète émission/consultation. | **2-3 j** | **P0** | P1 |
| **P4** | **Scheduler évaluations à froid** : worker arq nocturne ou cron `launch_pending_cold_evaluations` (J = scheduled_for ≤ today). Notification email + SMS à chaque évaluateur attendu. Relance J+7 si pas répondu. | Lève R1. Mesure d'efficacité automatique. | **2-3 j** | **P0** | Worker arq, notifications |
| **P5** | **Trigger éval à chaud à transition COMPLETED** : à chaque session passant COMPLETED, créer `TrainingEvaluation(HOT)` pour chaque participant ATTENDED/PARTIAL et envoyer invitation immédiate. | Évaluation à chaud systématique. | **1-2 j** | **P0** | Notifications |
| **P6** | **Plan de formation annuel** : modèle `TrainingPlan` (year, organization_id, status DRAFT/APPROVED/CLOSED), `TrainingPlanItem` (catalog_id, target_population, expected_seats, estimated_cost). Workflow validation DRH → DAF → Cabinet. Page de pilotage % réalisation. | Lève R3, R4. Conformité gestion publique. | **6-8 j** | **P1** | Workflow |
| **P7** | **Champ coût et budget** : `TrainingCatalog.cost_per_seat`, `TrainingSession.total_budget`, `TrainingSession.actual_cost`, `TrainingPlanItem.allocated_budget`. Dashboard `formation/budget` avec dépenses réelles vs prévues, par direction. | Pilotage financier. | **3-4 j** | **P1** | P6 |
| **P8** | **Lien GPEC → besoins formation** : worker hebdo qui transforme `CompetencyGapsSnapshot` en `TrainingNeed` (cf. P9 fiche 05). Plan annuel pré-rempli avec ces besoins. | Bascule formation au mérite (besoin réel) vs au népotisme. | **3 j** | **P1** | Fiche 05 P9 |
| **P9** | **Mutualisation inter-ministérielle** : table `TrainingProvider` (organisme, contacts, agrément), `TrainingCatalog.provider_id`, `TrainingCatalogPool.shared_organizations[]`. Catalogue central DGFP visible par tous ministères. | Économies, qualité. Lève R7. | **5-7 j** | **P1** | Validation DGFP |
| **P10** | **Indicateurs ISO 30414** : `taux_completion_plan`, `heures_par_agent`, `cout_par_agent`, `taux_satisfaction_chaud`, `taux_satisfaction_froid`, `taux_certif`, `delai_moyen_certif`. Page `formation/indicateurs`. | Lève R8. Crédibilité. | **3 j** | **P1** | P1-P5 |
| **P11** | **Kirkpatrick niveau 4 (impact)** : croisement `training_certificates` ↔ `performance_evaluations` (avant/après) ↔ `employee_movements` (promotion post-formation). Rapport « ROI formation » par catégorie. | Différenciation forte. Justifie budget. | **5-7 j** | **P1** | Performance + Career |
| **P12** | **Carnet de bord formateur** : page formateur qui marque la présence à la session (mobile-friendly), valide les participants (nécessaire pour le certif), saisit observations. Endpoint dédié + RBAC `training:instructor`. | Saisie temps réel, fin des « fiches d'émargement papier ». | **3-4 j** | **P2** | — |
| **P13** | **Conventions ENA Guinée formalisées** : modèle `TrainingPartnership` (provider_id, convention_ref, period, quota, agrement_id), affichable sur l'admin formation. | Traçabilité juridique partenariats. | **2-3 j** | **P2** | P9 |

## 6. Souveraineté & UX terrain

**Souveraineté.** Pas de dépendance externe. Le PDF est généré localement (WeasyPrint), la signature est locale (cf. fiche 02 P2), la vérification publique se fait sur le SI Primature.

**UX terrain.**
- **Évaluation par lien magique** : un agent reçoit un SMS « Évaluez votre formation X — lien valide 30 j : prim.gov.gn/eval/AB12CD34 ». Page se charge en < 200 Ko, fonctionne en 2G. 5 questions max, sliders, 1 commentaire libre. Sauvegarde brouillon localStorage en cas de coupure.
- **Certificat agent** : page « Mon dossier formation » → liste téléchargeable, QR à l'écran pour vérification employeur futur (présentation à un recruteur privé).
- **Formateur en région** : carnet de bord doit fonctionner offline (PWA + sync différée), car les centres de formation à Kankan/Labé ont une connexion intermittente.
- **Catalogue** : recherche full-text simple (PostgreSQL `tsvector`) plutôt que GridJS filtrage client si > 200 entrées.
- **Notifications SMS** essentielles : 35 % des fonctionnaires (estimation) consultent rarement leur email professionnel.

## 7. Décision recommandée

Le module est **à 70 % d'un état excellent** ; les 30 % manquants sont concentrés sur 5 actions à fort levier (P1 à P5) qui ferment le cycle complet émission → certif → impact.

Phase **P0 (3 semaines)** : P1, P2, P3, P4, P5 = **11-16 j-h**. Le module devient utilisable de bout en bout.
Phase **P1 (5-6 semaines)** : P6, P7, P8, P9, P10, P11 = **25-32 j-h**. Le module devient un outil de pilotage stratégique.
Phase **P2** : P12, P13 = enrichissement.

**Note politique.** La capacité à produire un rapport « coût formation par direction × ROI mesuré à J+90 » à demande du Cabinet est la **différence** entre un budget formation pérenne et un budget formation érodé chaque arbitrage.
