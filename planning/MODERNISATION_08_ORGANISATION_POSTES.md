# Fiche de modernisation 08 — Organisation & Postes

> Audit code réel — 2026-05-10 — Périmètre : `Final/backend/app/{api,services,models}` (organization, position) et `Final/src/app/modules/organization/`

## 0. Résumé exécutif

Module **bien charpenté techniquement** : modèle Organization → Direction → Unit (avec auto-référence `parent_unit_id` pour arborescences imbriquées) + Position avec effectifs budgétés et statuts (OPEN/FILLED/FROZEN/CLOSED), org-chart frontend avec construction récursive, détection de cycles, drill-down, simulation localStorage avec workflow approbation/publication, export CSV. Toutes les écritures auditées. **Trois manques structurants pour un État** : (1) **aucune dimension budgétaire / paie** sur le poste (pas de coût indiciaire, pas d'enveloppe, pas de masse salariale calculée) → impossible de piloter financièrement ; (2) **libellés de fonction en texte libre** (pas de référentiel partagé inter-ministériel) → effectifs métiers incomparables ; (3) **seed démonstratif** ne reflète pas la structure réelle Primature/État guinéen (Cabinet PM → SG → DG → DC → DR → Préfectures). L'org-chart « simulé » en localStorage avant publication est une bonne idée mais n'est pas persisté en backend (versioning de l'organigramme manquant).

## 1. Périmètre inspecté

| Couche | Localisation |
|---|---|
| Modèles | `Final/backend/app/models/organization.py` (74 lignes), `models/position.py` (52 lignes), `models/employee.py:50-60` (FK direction/unit/position) |
| API | `Final/backend/app/api/v1/organization.py` (188 lignes) |
| Service | `Final/backend/app/services/organization_service.py` (326 lignes) |
| Frontend org-chart | `Final/src/app/modules/organization/pages/org-chart/org-chart.ts`, `org-chart.utils.ts`, `org-chart.utils.spec.ts` |
| Frontend postes budgétés | `Final/src/app/modules/organization/pages/budgeted-positions/budgeted-positions.ts` |
| Frontend postes vacants | `Final/src/app/modules/organization/pages/vacant-positions/vacant-positions.ts` |
| Seed démo | `Final/backend/scripts/seed_initial.py:233` |

## 2. État réel (vérifié dans le code)

| Sous-module | État | Preuve | Commentaire |
|---|---|---|---|
| Modèle Organization | ✅ | `organization.py:18-26` | `code` unique + statut. |
| Modèle Direction (FK Org) | ✅ | `organization.py:28-45` | `org_code` unique par organisation, manager_name. |
| Modèle Unit (FK Direction + auto-FK parent) | ✅ | `organization.py:47-75` | **`parent_unit_id` permet arborescence N niveaux**. |
| Modèle Position (effectifs + statut) | ✅ | `position.py:15-53` | `budgeted_headcount`, statut OPEN/FILLED/FROZEN/CLOSED, `grade` (string libre). |
| API CRUD complet (Directions/Units/Positions) | ✅ | `api/v1/organization.py:32-189` | Filtres direction_id/unit_id/status. |
| RBAC | ✅ | `organization:view` / `organization:manage` | OK (mais front sans guard — voir fiche 01 P5). |
| Construction org-chart récursive | ✅ | `services/organization_service.py:229-326` | `build_org_chart()` avec employee_count par nœud. |
| Audit (DIRECTION_CREATED, UNIT_CREATED, POSITION_CREATED) | ✅ | services | OK. |
| Frontend org-chart visuel | ✅ | `org-chart.ts` | Drill-down, collapse/expand, sélection unité. |
| Org-chart utils (cycle detection + tri) | ✅ | `org-chart.utils.ts` | `buildOrgTree()` avec détection auto-référence cycles. |
| Org-chart simulation + workflow publication | 🟡 | `org-chart.ts` | Snapshot brouillon en **localStorage** front, soumission/approbation/rejet/publication, mais **pas persisté backend** → un autre utilisateur ne voit pas les brouillons. |
| Export CSV org-chart | ✅ | `org-chart.ts:554-596` | 9 colonnes (code, nom, parent, responsable, effectif, niveau, sous-unités, postes vacants). |
| Page postes budgétés (CRUD) | ✅ | `budgeted-positions.ts:38-91` | code, structure, titre, grade, statut Ouvert/Occupé, titulaire. |
| Page postes vacants (CRUD + priorité) | ✅ | `vacant-positions.ts:38-91` | code, structure, titre, grade, openedOn, priorité Haute/Normale/Basse. |
| Affectation agent à poste | ✅ | `employee.py:50-60` | `position_id` FK. |
| Mouvements respectent organigramme | ✅ | `employee.py:138-197` | TRANSFER/PROMOTION avec from/to direction/unit/position. |
| **Coût / budget poste** | ❌ | `position.py` | **Aucun champ `salary_grade_indice`, `monthly_cost_estimate`, `annual_envelope`**. Impossible de calculer masse salariale. |
| **Référentiel fonctions inter-ministériel** | ❌ | grade en string | Pas de table `civil_service_function_referential` partagée → libellés non réconciliables. |
| **Versioning organigramme (historique)** | ❌ | — | L'org-chart actuel est l'unique source ; pas de snapshot historique « organigramme au 01/01/2025 vs 01/01/2026 ». |
| Taux d'occupation calculé (occupés / budgétés) | 🟡 | requêtes ad-hoc | Pas de vue agrégée prête à l'emploi (`vw_position_occupancy`). |
| Ancienneté de la vacance / SLA pourvoi | 🟡 | `openedOn` capturé front | Pas d'algo d'urgence backend, pas d'alerte « poste vacant > 6 mois ». |
| Lien vers recrutement (poste vacant → campagne) | ❌ | — | Aucun bouton « lancer recrutement » depuis la page vacants. |
| Seed structure ministérielle GN réelle | ❌ | `seed_initial.py:233` | « Direction Générale du Cabinet » uniquement. Pas de structure type Primature → SG → DG → DC → DR → Préfectures. |
| Workflow création/suppression de poste (validation budget) | ❌ | — | Création directe par RH, sans validation DAF / Cabinet. |

## 3. Comparaison aux standards GovTech

| Standard / Pratique | Position | Écart |
|---|---|---|
| **France — DGAFP / RIME** (Répertoire Interministériel des Métiers de l'État) | Pas de référentiel | ❌ |
| **France — DGFiP / Loi Organique 2001** : pilotage par programme + masse salariale | Pas de coût | ❌ |
| **Norme ISO 30414** : ratios cadres/non-cadres, taux d'encadrement | Calcul manuel | 🟡 |
| **OCDE — Government at a Glance** indicateurs effectifs FP | Données partielles | 🟡 |
| **Estonie — Riigi Personali Register** organigramme public en open data | localStorage front | ❌ |
| **Sénégal — Statistiques DGFP** par fonction × ministère | Possible ad-hoc | 🟡 |
| **France — data.gouv.fr** organigrammes publiés (annuaire-administration) | Aucune page publique | ❌ |
| **Open Data Charter** — transparence des structures publiques | Aucune | ❌ |

## 4. Risques en exploitation publique

| # | Risque | Sévérité | Délai |
|---|---|---|---|
| R1 | **Pas de coût par poste** → impossibilité de produire le projet de loi de finances RH par direction → écart politique avec DAF / MEF. | **Critique** | À l'arbitrage budgétaire annuel |
| R2 | **Libellés libres** → 53 « directeur » différents écrits 53 manières, 0 statistique fiable inter-ministérielle. | Élevée | À chaque rapport |
| R3 | **Pas de versioning organigramme** → impossible de répondre à la question « combien d'agents au cabinet en mars 2024 ? » → contestations historiques. | Élevée | À chaque audit |
| R4 | **Brouillons en localStorage** → DRH change de poste / réinstalle son navigateur → travail perdu. | Élevée | Continu |
| R5 | **Pas de SLA pourvoi vacance** → poste critique vacant 18 mois sans alerte. | Élevée | Continu |
| R6 | **Pas de workflow création poste avec validation budget** → créations sauvages, dépassements de masse salariale. | Élevée | Continu |
| R7 | **Seed démo** → confusion en démo, et obligation de tout saisir manuellement à la mise en service. | Moyenne | Au déploiement |
| R8 | **Pas de poste vacant → recrutement automatique** → désynchronisation ouverture/recrutement. | Moyenne | Continu |

## 5. Propositions de modernisation

| # | Proposition | Bénéfice | Effort | Priorité | Dépend |
|---|---|---|---|---|---|
| **P1** | **Dimension budgétaire du poste** : champs `Position.salary_grade_id` (FK vers `civil_service_grade` cf. fiche 02 P1), `monthly_cost_min/max/avg` calculé depuis indice + charges, `annual_envelope`. Vue `vw_position_occupancy` (budgétés vs réels, masse salariale réelle vs budgétée). Dashboard `/organization/masse-salariale` filtrable par direction. | Lève R1. Pilotage budgétaire crédible. | **6-8 j** | **P0** | Fiche 02 P1 |
| **P2** | **Référentiel fonctions FP-GN** : table `civil_service_function` (code REPC-XXXXX, libellé, famille métier RIME-équivalent, niveau hiérarchique, description). `Position.function_id` FK. Seed par DGFP avec ~150 fonctions standards de l'État. UI = liste fermée + recherche. Migration des libellés existants par mapping manuel ou suggestion fuzzy. | Lève R2. Pose les bases de l'agrégation inter-ministérielle. | **8-12 j** + travail référentiel | **P0** | Validation DGFP |
| **P3** | **Versioning organigramme backend** : table `organization_chart_snapshot` (id, taken_at, scope, payload JSONB signé Ed25519). Job nocturne snapshot quotidien + snapshot manuel à chaque publication. Endpoint `/organization/chart?at=2024-03-15` reconstruit l'organigramme historique. | Lève R3. Audits historiques possibles. | **5-7 j** | **P0** | — |
| **P4** | **Persister les brouillons backend** : table `organization_draft` (id, owner_user_id, payload, created_at, status DRAFT/SUBMITTED/APPROVED/REJECTED/PUBLISHED), workflow validation (créateur → manager → DRH → SG selon scope). Plus de localStorage. Notifications à chaque transition (cf. fiche 07 P11-P15). | Lève R4. Multi-utilisateur, traçable. | **5-7 j** | **P0** | Workflow + notifications |
| **P5** | **Alerte vacance** : worker hebdo qui calcule `days_open` depuis `openedOn`, classifie en NORMAL/URGENT/CRITIQUE selon priorité × ancienneté. Notification DRH + manager direction. Tableau de bord `vacances-critiques`. | Lève R5. Réduit délais pourvoi. | **3 j** | **P1** | Worker arq |
| **P6** | **Workflow création/suppression poste** : modèle `PositionChangeRequest` (kind: CREATE/CLOSE/FREEZE, position_id ou draft, justification, budget_impact). Workflow DRH → DAF (vérif enveloppe) → SG (validation politique) → publication. | Lève R6. Conformité gestion publique. | **5-7 j** | **P1** | Workflow, P1 |
| **P7** | **Bouton « lancer recrutement »** depuis poste vacant → pré-remplit campagne (titre, structure, grade, fonction, exigences GPEC depuis `position_competency_requirements`). | Lève R8. UX continue. | **2-3 j** | **P1** | Recrutement, GPEC |
| **P8** | **Seed Primature réel** : script `seed_primature_structure.py` qui crée Cabinet PM, Secrétariat Général, ~10 directions générales, leurs directions centrales et services types. Validable par DRH Primature avant prod. | Lève R7. Lancement réaliste. | **2-3 j** + travail collecte | **P1** | Validation DRH |
| **P9** | **Page publique organigramme** (open data) : `/transparence/organigramme` accessible sans auth, vue arborescente publique (sans noms d'agents en dessous d'un certain niveau), export PDF officiel signé, version JSON consommable par d'autres SI. | Conformité Open Data Charter, transparence. | **5-7 j** | **P2** | P2, P3 |
| **P10** | **Indicateurs ISO 30414 / OCDE** : taux d'encadrement (cadres / non-cadres), taux de féminisation par direction, pyramide d'âges par cadre, ratio postes administratifs/opérationnels. Rapport mensuel automatique. | Conformité internationale. | **3-4 j** | **P1** | P2 |
| **P11** | **Carte géographique des préfectures** (Leaflet déjà dans le projet via `@bluehalo/ngx-leaflet`) : visualisation des effectifs FP par préfecture, taux d'encadrement, vacances critiques. Filtrage par cadre. | Vision territoriale. | **5-7 j** | **P2** | Leaflet (déjà OK) |
| **P12** | **Édition organigramme drag-and-drop** : permettre au DRH de réorganiser visuellement (déplacer une unité d'une direction à une autre) avec validation graphique des règles (pas de boucle, parent valide). | UX excellence. | **5-7 j** | **P2** | bpmn-js drag/drop philosophy |

## 6. Souveraineté & UX terrain

**Souveraineté.** Aucune dépendance externe nécessaire. La carte des préfectures (P11) peut être construite à partir des fonds OpenStreetMap (libres) avec tuiles auto-hébergées si besoin (tile server local).

**UX terrain.**
- **Org-chart sur mobile** : actuel rendu desktop riche, à doter d'une vue alternative « liste hiérarchique » plus tactile pour Android entrée de gamme.
- **Édition postes vacants** : DRH décentralisée (Kankan, N'Zérékoré) doit pouvoir saisir en mode dégradé (formulaire simple, pas de WYSIWYG complexe).
- **Carte préfectures** : utiliser tuiles raster basse résolution + clustering pour limiter le téléchargement en 3G.
- **Seed Primature** : prévoir un import depuis fichier Excel/CSV (la DGFP a probablement déjà des fichiers maîtres en xlsx).

## 7. Décision recommandée

Module fonctionnellement présent mais **conceptuellement incomplet pour un État** : sans dimension budgétaire (P1), sans référentiel fonctions (P2), sans versioning (P3), il reste un organigramme « papier » numérisé.

Phase **P0 (3 semaines)** : P1, P2, P3, P4 = **24 à 34 j-h** (dont travail collecte référentiel non chiffré ici). Le module devient un outil de pilotage gouvernemental.
Phase **P1 (4-5 semaines)** : P5, P6, P7, P8, P10 = **15-20 j-h**.
Phase **P2** : P9, P11, P12 = visibilité publique et excellence UX.

**Note politique.** La validation du référentiel fonctions (P2) par la DGFP est un investissement institutionnel transverse à plusieurs SIRH ministériels. Le projet GPA-GOUVE peut **porter cette initiative** et en tirer un avantage durable de référence.
