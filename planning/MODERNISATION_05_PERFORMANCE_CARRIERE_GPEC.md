# Fiche de modernisation 05 — Performance, Carrière, Discipline, GPEC

> Audit code réel — 2026-05-10 — Périmètre : `Final/backend/app/{api,services,models}` (performance, career, discipline, gpec) et `Final/src/app/modules/{performance,careers,discipline}/`

## 0. Résumé exécutif

Module à **deux vitesses** : la **performance 360° et la GPEC sont d'un excellent niveau backend** (anonymat structurel certifié, seuil minimal de répondants, référentiel compétences/postes, snapshots d'écarts critiques par scope) — c'est l'un des points forts du projet, supérieur à beaucoup de SIRH publics francophones ; mais **la carrière statutaire et la discipline restent embryonnaires côté droit FP guinéen** : pas d'avancement automatique à l'ancienneté, pas de référentiel de grades/échelons (cf. fiche 02), pas d'échelle structurée des sanctions, pas de gestion des prescriptions ni des recours. Le **frontend perf/carrière est mock-only** dans plusieurs pages — déconnecté du backend pourtant prêt.

## 1. Périmètre inspecté

| Couche | Localisation |
|---|---|
| Performance | `Final/backend/app/models/performance.py`, `services/performance_service.py`, `api/v1/performance.py` |
| Carrière | `Final/backend/app/models/employee.py:138-199` (movements), `services/career_service.py`, `api/v1/career.py` |
| Discipline | `Final/backend/app/models/discipline.py`, `services/discipline_service.py`, `api/v1/discipline.py` |
| GPEC | `Final/backend/app/models/gpec.py`, `personnel_360.py:31-79` (compétences agent) |
| Pages | `Final/src/app/modules/performance/pages/{perf-campaigns,perf-results}/`, `careers/pages/{advancements,promotions,secondments,transfers}/`, `discipline/pages/discipline-cases/` |

## 2. État réel (vérifié dans le code)

### Performance

| Sous-module | État | Preuve | Commentaire |
|---|---|---|---|
| Campagnes (CLASSIC + SURVEY_360) | ✅ | `models/performance.py:35-77` | États DRAFT→OPEN→CLOSED/CANCELLED. |
| Évaluation 360° multi-évaluateurs | ✅ | `models/performance.py:126-222` | SELF, MANAGER, PEER, SUBORDINATE. |
| **Anonymat structurel** | ✅ | `services/performance_service.py:185-201,454-542` | **Pas de FK répondant ↔ réponse** ; suppression des invitations à clôture pour rendre la traçabilité impossible. **Référence francophone** sur ce point. |
| Seuil minimal répondants | ✅ | `models/performance.py:74-76` ; `services/performance_service.py:511-533` | Défaut N=3, non-divulgation sous seuil. |
| Plans de développement (PDP) | ❌ | — | Aucun endpoint, aucune page. |
| Frontend perf-campaigns / perf-results | 🟡 | `perf-results.ts:29-32` (calculs locaux) | **Mock-backend Angular**, non branché à l'API. |

### Carrière

| Sous-module | État | Preuve | Commentaire |
|---|---|---|---|
| Mouvements (5 types) | ✅ | `models/employee.py:138-199` | TRANSFER, PROMOTION, SECONDMENT, RECLASSIFICATION, EXIT + workflow DRAFT→APPROVED→EXECUTED/REJECTED/CANCELLED. |
| Mutations / transferts / détachements | ✅ | `api/v1/career.py:52-95` | from/to_direction/unit/position. |
| Exécution mouvement (applique au dossier) | ✅ | `services/career_service.py:163-174` | Met à jour `to_direction_id`, `to_position_id`. |
| **Avancement automatique (échelon par ancienneté)** | ❌ | — | Aucune logique date→échelon. |
| **Promotion (changement de grade)** | ❌ | type présent | Pas de table `Grades`, pas de classification hiérarchique. Confusion sémantique avec « promotion = mouvement ». |
| RBAC carrière | ✅ | `api/v1/career.py:36-39` | `careers:view`, `careers:manage`. |
| Frontend careers | 🟡 | `advancements.ts:8` (mock_career_moves) | **Mock-only**, déconnecté du backend. |

### Discipline

| Sous-module | État | Preuve | Commentaire |
|---|---|---|---|
| Cycle (ouverture → enquête → sanction → clôture) | ✅ | `models/discipline.py:30-77` | OPEN, UNDER_INVESTIGATION, SANCTION_PROPOSED, SANCTION_APPLIED, CLOSED, DISMISSED. |
| Sévérité (Faible/Modéré/Élevé/Critique) | ✅ | `models/discipline.py:39-40` | Échelle scalaire libre. |
| Sanction (champ libre string) | 🟡 | `models/discipline.py:71-72` | **Pas d'ENUM normalisé** sur l'échelle des sanctions FP-GN (avertissement, blâme, suspension N j, déplacement d'office, abaissement d'échelon, révocation). |
| Événements immutables (audit trail) | ✅ | `models/discipline.py:80-106` | OK. |
| **Prescription (déchéance)** | ❌ | — | Aucun champ `prescription_expires_at`, aucune logique. |
| **Recours / appels structurés** | ❌ | présent côté front mock | Backend muet. |
| Référentiel sanctions FP-GN | ❌ | — | Sanctions libres → impossible à statistiquer / contester. |
| Frontend discipline-cases | 🟡 | `src/app/modules/discipline/pages/discipline-cases/discipline-cases.ts:41` | Mock partiel. |

### GPEC

| Sous-module | État | Preuve | Commentaire |
|---|---|---|---|
| Référentiel compétences | ✅ | `models/gpec.py:26-48` | `CompetencyReferential` (code, label, category, description). |
| Exigences par poste | ✅ | `models/gpec.py:51-88` | `PositionCompetencyRequirement` (level: Débutant/Intermédiaire/Avancé/Expert, is_critical). |
| Cartographie agent ↔ compétence | ✅ | `models/personnel_360.py:31-79` | `EmployeeCompetency` (level, last_assessed_at, source). |
| Calcul écarts critiques | ✅ | `services/career_service.py:345-461` | Déterministe (meeting vs below par niveau requis), persistance JSONB avec count écarts critiques. |
| Snapshots par scope | ✅ | `models/gpec.py:90-131` | GLOBAL, DIRECTION, UNIT, POSITION. |
| Plan de formation aligné GPEC | ❌ | — | `CompetencyGapsSnapshot.payload` existe mais aucune génération automatique de besoins de formation. |
| Référentiel métiers FP (familles, domaines) | ❌ | — | Aucune couche `RéférentielMétiersFP`. |

## 3. Comparaison aux standards GovTech

| Standard / Pratique | Position | Écart |
|---|---|---|
| **France — RIME (Répertoire Interministériel des Métiers de l'État)** | Pas de référentiel familles métiers | ❌ Pas de cartographie nationale des métiers. |
| **France — DGAFP CIA (Compte Individuel d'Activité)** plan développement | Absent | ❌ |
| **Statut Général FP-GN — échelle des sanctions** | String libre | ❌ Non opposable. |
| **OIT — Convention 158** (cessation de la relation de travail, droit recours) | Workflow recours absent | ❌ |
| **Norme ISO 30414** (HR analytics) — turnover, performance, GPEC | Indicateurs partiels | 🟡 |
| **Estonie — Personnel Information System** plans de développement individuels | Absent | ❌ |
| **OECD — Public Service Skills Framework** (compétences clés FP) | Référentiel libre | 🟡 À aligner si la GN ratifie un référentiel régional CEDEAO. |
| **CNIL FR — anonymisation enquête 360** | ✅ Conforme | Référence. |

## 4. Risques en exploitation publique

| # | Risque | Sévérité | Délai |
|---|---|---|---|
| R1 | **Sanctions sans référentiel statutaire** → décisions disciplinaires contestables systématiquement (recours TA). | **Critique** | À chaque sanction |
| R2 | **Prescription non gérée** → poursuite après délai légal (2 ans pour faute simple, 5 ans pour faute lourde, variable selon code FP-GN) → annulation. | **Critique** | À chaque dossier ancien |
| R3 | **Avancement automatique absent** → calculé manuellement par DRH → erreurs, retards, contentieux paie. | Élevée | Continu |
| R4 | **Frontend perf/carrière déconnecté** → données saisies en démo perdues, impossible de boucler le cycle annuel d'évaluation. | Élevée | À l'ouverture campagne |
| R5 | **Pas de plan développement** → la 360 n'engage à rien → cynisme des agents. | Moyenne | Au cycle suivant |
| R6 | **Pas de référentiel métiers** → GPEC silotée par direction → pas de mobilité inter-ministérielle ni de planification stratégique. | Moyenne | Continu |
| R7 | **Recours discipline absents** → contentieux non tracés → indicateur de qualité opaque. | Moyenne | À chaque recours |
| R8 | **Sévérité sur 4 niveaux libres** → utilisations divergentes par direction. | Faible | Continu |

## 5. Propositions de modernisation

| # | Proposition | Bénéfice | Effort | Priorité | Dépend |
|---|---|---|---|---|---|
| **P1** | **Référentiel sanctions FP-GN structuré** : table `discipline_sanction_catalog` (code, libelle, statut_legal, degre, duree_max_jours, is_removable, prescription_jours_par_severite). Champ `DisciplineCase.proposed_sanction_code FK`. UI = liste fermée. Seed à valider Ministère FP. | Décisions opposables. Statistiques exploitables. | **3-4 j** | **P0** | Validation Ministère FP |
| **P2** | **Prescription** : champ `prescription_deadline` calculé depuis `incident_date` + sévérité. Job nocturne qui notifie DRH J-30 et J-7 ; auto-clôture en `DISMISSED_PRESCRIPTION` au-delà. Affichage sur la fiche dossier. | Conformité statut. Évite poursuites prescrites. | **2-3 j** | **P0** | P1 |
| **P3** | **Avancement automatique à l'ancienneté** : worker mensuel `compute_pending_advancements` qui itère agents, vérifie `anciennete_grade_jours >= duree_min_echelon`, propose un `EmployeeMovement(type=ADVANCEMENT, status=DRAFT)`. UI DRH = file d'attente d'avancements à confirmer/signer. | Suppression des erreurs paie, équité. | **5-7 j** | **P0** | Fiche 02 P1 (statutaire) |
| **P4** | **Distinguer Promotion de grade vs Mouvement géographique** : ajouter type `GRADE_PROMOTION` séparé, lier à `civil_service_grade_id`. Workflow validation nominale (DRH → Cabinet pour cadres A). | Clarté sémantique, conformité statut. | **3 j** | **P0** | Fiche 02 P1, P3 |
| **P5** | **Connecter le frontend perf/carrière aux APIs** : remplacer les `mock_career_moves` et calculs locaux dans `perf-results.ts:29-32` par appels services réels. Tests e2e Playwright sur cycle complet 360. | Module utilisable de bout en bout. | **5-7 j** | **P0** | Backend déjà OK |
| **P6** | **Plans de développement individuels** : modèle `IndividualDevelopmentPlan` (employee_id, period, gaps_snapshot_id, planned_trainings[], planned_actions[], reviews[]). Lien performance → GPEC → formation. Workflow signature manager + agent. | Boucler la 360. Crédibilité du dispositif. | **6-8 j** | **P1** | Performance, GPEC, Training |
| **P7** | **Recours et appels** : modèle `DisciplineAppeal` (case_id, filed_by, filed_at, grounds, status, decision, decided_at, decided_by). Workflow conseil de discipline puis recours hiérarchique puis TA si applicable. Audit immutable. | Conformité OIT 158. Traçabilité contentieux. | **5-7 j** | **P1** | P1 |
| **P8** | **Référentiel métiers FP-GN** : table `civil_service_job_family` (famille, sous-famille, RIME-equivalent), `position_job_family_mapping`. Vue agrégée GPEC par famille (taux de couverture, profils rares). | Planification stratégique RH État. Mobilité inter-ministérielle. | **5-8 j** (+ travail référentiel) | **P1** | Validation Ministère FP |
| **P9** | **Génération automatique de besoins de formation depuis écarts GPEC** : worker hebdo qui transforme `CompetencyGapsSnapshot.gaps_critical[]` en `TrainingNeed`, alimentant la file de demandes formation (cf. fiche 06). | Bascule de la GPEC théorique à la formation effective. | **3-4 j** | **P1** | GPEC + Training |
| **P10** | **Tableau de bord exécutif RH 360°** : page DRH/SG agrégée (taux de campagne complétée, taux de répondants 360, écarts critiques par direction, mouvements en attente, sanctions en cours, prescriptions imminentes). | Vision stratégique en un écran. | **3-4 j** | **P1** | P1-P9 |
| **P11** | **Anonymisation 360 — preuve cryptographique** : ajouter une preuve d'absence de FK par hash (snapshot signé Ed25519 publié). Permet à un magistrat de vérifier l'anonymat sans accès BDD. | Réfutation préventive contre accusation de levée d'anonymat. | **2-3 j** | **P2** | Audit P4 fiche 01 |
| **P12** | **Sévérité normalisée** : enum stricte avec définitions juridiques (Faible = manquement aux usages ; Critique = atteinte intégrité service). Documentation Markdown intégrée à l'UI (tooltip). | Cohérence inter-direction. | **1 j** | **P2** | — |

## 6. Souveraineté & UX terrain

**Souveraineté.** Aucun service externe nécessaire pour ce module. Tous les calculs (écarts GPEC, anonymisation 360, prescription) sont déterministes et locaux.

**UX terrain.**
- Évaluation 360 : doit être faisable en **5-10 minutes par évaluateur** sur mobile. Formulaire en sliders (1-5) + commentaires courts. Lien d'invitation par token signé court (similaire P4 fiche 04).
- Avancement automatique : DRH doit avoir une vue « 87 avancements à valider ce mois » avec sélection multiple + signature batch (1 PV pour N agents).
- Discipline : interface très sobre, presque ascétique, aucune gamification. Templates de courriers (notification d'enquête, convocation conseil, notification sanction) pré-remplis avec variables.
- Carrière agent : un agent veut voir sa **trajectoire** : grade actuel, prochain échelon estimé (date + indice), historique des mouvements. Page « ma carrière » dans `self-service`.

## 7. Décision recommandée

Le 360° et la GPEC sont **excellents** — protégez-les. Mais le module ne peut pas vivre sans la couche statutaire (cf. fiche 02 P1 et fiche 05 P1, P2, P3, P4). Branchez le frontend (P5) immédiatement, sinon vous perdez les bénéfices du backend solide.

Phase **P0 (3-4 semaines)** : P1, P2, P3, P4, P5 = **18 à 24 j-h**. Cette phase fait passer le module de « démontrable » à « gérable légalement ».
Phase **P1 (5-6 semaines)** : P6, P7, P8, P9, P10 = **22-31 j-h**.
Phase **P2** : P11, P12 = consolidation.

**Note métier.** L'anonymat 360 démontré formellement (P11) est un investissement modeste pour une **garantie politique majeure** : si un agent contesté révèle une 360 médiocre, la défense de l'État (« nous ne pouvons pas savoir qui a noté quoi, voici la preuve cryptographique ») devient inattaquable.
