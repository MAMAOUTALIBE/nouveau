# Fiche de modernisation 04 — Congés & Temps de Travail

> Audit code réel — 2026-05-10 — Périmètre : `Final/backend/app/{api,services,models}` (leave, leave_advanced, leave_rules) et `Final/src/app/modules/{leave,time}/`

## 0. Résumé exécutif

Module congés **techniquement bien structuré** : 9 types de congés modélisés, soldes/quota par année fiscale, workflow d'approbation 2 niveaux, règles de couverture service (taux de présence min, headcount min) et règles d'auto-approbation **évaluables mais pas encore branchées à la création**. **Quatre absences notables** : (1) **pas de type de congé Hadj** ni de logique islamique pour un pays à 89 % musulman ; (2) **pas de calendrier guinéen** (Tabaski, Maouloud, Indépendance 02/10) — les calculs se font en jours calendaires ; (3) le **module `time/` est vide** (pointage absent) ; (4) **aucun trigger de notification** lors d'une décision congé. Le frontend est correct mais ne différencie pas les vues agent / manager / DRH.

## 1. Périmètre inspecté

| Couche | Localisation |
|---|---|
| Modèle | `Final/backend/app/models/leave.py`, `leave_rules.py` |
| API | `Final/backend/app/api/v1/leave.py`, `leave_advanced.py` |
| Service | `Final/backend/app/services/leave_service.py`, `leave_advanced_service.py` |
| Seed | `Final/backend/scripts/seed_initial.py:141-150` |
| Frontend | `Final/src/app/modules/leave/pages/{leave-balances,leave-calendar,leave-requests}/` |
| Module Time | `Final/src/app/modules/time/` (vide) |

## 2. État réel (vérifié dans le code)

| Sous-module | État | Preuve | Commentaire |
|---|---|---|---|
| Types de congés (9) | 🟡 | `seed_initial.py:141-150` | ANNUAL, SICK, MATERNITY, PATERNITY, BEREAVEMENT, MARRIAGE, UNPAID, SPECIAL, TRAINING. **Manquent : HADJ, ETUDE, EXPATRIATION, ALLAITEMENT** (droit FP-GN). |
| Soldes (allocated/consumed/remaining) | ✅ | `leave.py:92-95` | `LeaveBalance`, calculé. |
| Année fiscale (carry-over implicite) | ✅ | `leave.py:85` | Champ `fiscal_year`. **Pas de règle de report explicite** (max N jours, expiration M mois après). |
| API leave + RBAC | ✅ | `api/v1/leave.py:38-39,122-124` | `leave:view`, `leave:approve:l1/l2`. |
| Workflow approbation 2 niveaux | ✅ | `leave.py:145-150` | `decided_by_user_id`, `decided_at`, `decision_comment`. |
| Filtre scope manager (DIRECTION) | ✅ | `leave_service.py:79-85` | OK. |
| Auto-approbation — modèle | ✅ | `leave_rules.py:67-111` | `LeaveAutoApprovalRule` (max_duration, require_quota_ok, require_service_coverage, blackout_periods). |
| Auto-approbation — évaluation | ✅ | `leave_advanced_service.py:117-217` | `check_coverage()` calcule overlap, ratio présence. |
| Auto-approbation — branchement à la création | ❌ | `leave_advanced_service.py:11-14` | Commentaire « V1 : API exposée pour preview ; hook arrivera plus tard ». **N'est PAS appliqué automatiquement**. |
| Couverture service — règle | ✅ | `leave_rules.py:25-65` | `LeaveServiceCoverageRule` par DIRECTION/UNIT, `min_presence_ratio`, `min_headcount`. |
| Conflits planning (overlap manager) | ✅ | `leave_advanced_service.py:158-177` | `overlap_count`, `direction_predicted_presence_ratio`. |
| FullCalendar branché | ✅ | `leave-calendar.ts:5-40` | OK. |
| Vues différentiées agent/manager/DRH | ❌ | front | Vue unique. Manager voit ses subordonnés mais pas de vue « équipe » dédiée. Pas de vue DRH global avec heatmap. |
| Demande front (leave-requests) | ✅ | `leave-requests.ts:47` | GridJS, filtres. |
| Calendrier guinéen / jours fériés | ❌ | — | Aucune table `public_holidays`, aucune logique. Les jours **fériés ne sont pas exclus du calcul**. |
| Calendrier hégirien (Tabaski/Maouloud) | ❌ | — | Aucune dépendance Hijri (les dates varient ±1 jour selon observation lunaire). |
| Notifications congé décidé | ❌ | grep notification ↔ leave | **Aucun lien** détecté entre la décision et `notification_service`. L'agent n'est pas prévenu. |
| Module Time / pointage | ❌ | `src/app/modules/time/` vide (0 fichiers) | Absent. |
| Signal de conflit avant soumission | ❌ | front | L'agent ne sait pas qu'il sera refusé avant de soumettre. |
| Quotas par grade/cadre (statut FP) | ❌ | `LeaveBalance.allocated_days` libre | 30 j / 25 j FP-GN non hard-codés. |
| Continuité ministérielle (rôles critiques) | ❌ | — | Pas de blackout par rôle/grade (ex : interdire congé simultané de 3 secrétaires de même direction). |

## 3. Comparaison aux standards GovTech

| Standard / Pratique | Position | Écart |
|---|---|---|
| **Statut Général FP-GN — congés annuels statutaires** (~30 j cadres, 25 j agents) | Allocation libre | ❌ Pas de règle par statut. |
| **Convention OIT 132** (congés annuels payés) | Couvert si bien configuré | 🟡 Dépend de la config. |
| **Congé maternité — Convention OIT 183** (14 sem mini) | Type présent | 🟡 Pas de durée minimum imposée par règle. |
| **Congé Hadj** (droit coutumier ouest-africain reconnu en GN) | Absent | ❌ |
| **Calendrier OFJG** (Office des fêtes / Journées fériées Guinée) — 11 jours fériés/an | Aucun | ❌ |
| **France — DGAFP RenoiRH** (référence SIRH État FR) — auto-approbation conditionnelle, alertes conflits | Modèle prêt, hook absent | 🟡 |
| **Sénégal — SIRH Marina (UCAD)** — gestion congés 360 | Plus simple côté guinéen | 🟡 |
| **Estonie e-Personnel** — auto-approbation par défaut, validation par exception | Inverse (validation par défaut) | À discuter politiquement. |
| **WCAG AA** sur calendrier | Non audité | 🟡 |

## 4. Risques en exploitation publique

| # | Risque | Sévérité | Délai |
|---|---|---|---|
| R1 | **Absence du Hadj** → tension sociale, contournement par autres types (« congé maladie » de complaisance), opacité statistique. | **Critique** | À chaque saison du Hadj |
| R2 | **Jours fériés non calculés** → un congé du 30/09 au 03/10 consomme 2 jours, alors que le 02/10 (Indépendance) est férié → décompte erroné, contestations en série. | **Critique** | Immédiat, à chaque période férié |
| R3 | **Auto-approbation non câblée** → règle existe sur le papier, n'est jamais appliquée → workflow manuel toujours, surcharge managers. | Élevée | Continu |
| R4 | **Pas de notification décision** → agent en absence non avertie → désorganisation, voyage non prévu. | Élevée | Continu |
| R5 | **Continuité ministérielle non garantie** → 3 secrétaires en congé même semaine → cabinet bloqué. | Élevée | Saison estivale / fêtes |
| R6 | **Vues unifiées** → DRH n'a pas de heatmap par direction → décisions à l'aveugle. | Moyenne | Continu |
| R7 | **Pointage absent** → impossible de croiser présence réelle ↔ congés ↔ paie. | Moyenne | Dès intégration paie |
| R8 | **Quotas non statutaires** → un cadre A et un agent C ont la même allocation par défaut → injustice perçue. | Moyenne | À chaque solde annuel |

## 5. Propositions de modernisation

| # | Proposition | Bénéfice | Effort | Priorité | Dépend |
|---|---|---|---|---|---|
| **P1** | **Calendrier guinéen** : table `public_holidays` (date, label, is_movable, hijri_year) + service `holidays_service.compute_business_days(start, end)` excluant fériés et week-ends (vendredi-samedi vs samedi-dimanche selon convention). Seed avec les 11 fériés GN + dates Tabaski/Maouloud sur 5 ans (table mise à jour annuellement). | Décompte correct, fin des contestations. | **3-4 j** | **P0** | — |
| **P2** | **Type de congé Hadj** : nouveau type `HADJ`, durée typique 30 j, quota max 1 fois tous les 5 ans par agent, règle de priorité ancienneté + tirage au sort si surdemande, blackout durant période critique pour rôles essentiels. Workflow validation DRH + Cabinet. | Apaisement social, formalisation d'un droit existant. | **3-4 j** | **P0** | P1 |
| **P3** | **Brancher l'auto-approbation** : intercepteur `LeaveRequest.create()` qui évalue `LeaveAutoApprovalRule`, applique APPROVED si toutes conditions OK, sinon laisse PENDING. Audit `LEAVE_AUTO_APPROVED` distinct. UI affiche « auto-approuvé selon règle XYZ ». | Décharge managers, cohérence. | **2-3 j** | **P0** | Modèle déjà prêt |
| **P4** | **Notifications décision** : event `LeaveDecided` → `notification_service.create()` (email + SMS si configuré). Templates « Congé approuvé » / « Congé refusé » avec motif. Manager prévenu des nouvelles demandes (digest quotidien). | Transparence, pas de no-show surprise. | **2-3 j** | **P0** | Notification + SMTP |
| **P5** | **Vues différentiées** : (a) Vue agent : « mes demandes + mon solde + calendrier mes équipes » ; (b) Vue manager : Kanban demandes en attente + calendrier équipe + alertes conflit ; (c) Vue DRH : heatmap absences par direction × semaine + indicateurs de tension service. | Bon outil pour chaque rôle. | **5-7 j** | **P1** | — |
| **P6** | **Quotas par grade/cadre statutaire** : table `leave_default_allocation` (corps_id, grade_id, leave_type_code, days_per_year, carry_over_max, expiry_months). Job nocturne 1er janvier qui crée les soldes. | Conformité statut, équité. | **3-4 j** | **P1** | Fiche 02 P1 (statutaire) |
| **P7** | **Pré-vérification avant soumission** : endpoint `POST /leave/preview` retourne `{ would_be_approved, conflicts: [...], coverage_warning: bool, jours_décomptés }`. UI affiche badges « ✅ approbation auto probable » / « ⚠️ conflit avec X collègues » avant soumission. | Réduit demandes refusées (gain RH + UX agent). | **3-4 j** | **P1** | P3 |
| **P8** | **Continuité ministérielle — règles par rôle** : étendre `LeaveServiceCoverageRule` avec dimension `applies_to_roles[]` (ex : `secretaire_general`). Empêche approbation simultanée. | Évite blocages cabinet. | **3 j** | **P1** | — |
| **P9** | **Module Time / pointage léger** : pas de badgeuse mais déclaration matin/soir (mobile) + télétravail/présentiel + géolocalisation optionnelle (Conakry vs préfectures, sans précision GPS au-delà du district). Indicateur de cohérence avec congés. | Suivi présence sans matériel. | **8-12 j** | **P2** | — |
| **P10** | **Calendrier hégirien dynamique** : intégrer la lib `hijri-converter` ou un service externe (Diyanet TR, calendrier officiel GN) pour dates Tabaski/Maouloud avec fenêtre ±1 j et confirmation manuelle DRH/Cabinet. | Précision dates fériées islamiques. | **2 j** | **P1** | P1 |
| **P11** | **Export iCal congés** : URL signée par agent → calendrier intégré dans Outlook/Google Calendar du manager. | Adoption douce, intégration outils existants. | **2 j** | **P2** | — |
| **P12** | **Allaitement** : congé fractionné quotidien (2 × 30 min/jour pendant 12 mois, comme statut FP français équivalent) + suivi. | Conformité droits femmes agentes. | **3 j** | **P2** | — |

## 6. Souveraineté & UX terrain

**Souveraineté.** Aucune dépendance cloud externe nécessaire. Le calendrier hégirien peut tourner via lib Python locale ou être maintenu manuellement (le Cabinet/Présidence publie les dates officielles chaque année).

**UX terrain.**
- Demande de congé en mobilité : formulaire **3 champs** (type, dates, motif) — déjà OK probablement.
- Approbation manager en mobilité : notification SMS/email avec lien magique court → 1 clic Approuver/Refuser. Aujourd'hui le manager doit ouvrir l'app, naviguer, cliquer. **À simplifier** (page web légère liée à un token signé court).
- Vue solde : un agent veut voir son solde en 5 secondes. Page d'accueil agent (`self-service`) doit l'afficher en hero card + dernière demande.
- Hadj : interface dédiée avec étapes (intention → tirage au sort → confirmation → cession billet → départ → retour) car c'est un voyage long, ritualisé.
- Pour les fonctionnaires en région (Kankan, N'Zérékoré, Boké, Labé) : l'app doit fonctionner en 2G pour cas dégradés. SMS de notification = essentiel (voir Fiche 07 — connecteur Twilio Africa ou Orange API local).

## 7. Décision recommandée

Quatre actions P0 (P1 calendrier, P2 Hadj, P3 auto-approbation, P4 notifications) = **10 à 14 j-h** font passer le module de « bon design théorique » à « utilisable au quotidien dans la fonction publique guinéenne ».

Phase **P0 (2 semaines)** : P1, P2, P3, P4 = **10-14 j-h**.
Phase **P1 (4 semaines)** : P5, P6, P7, P8, P10 = **16-22 j-h**.
Phase **P2** : P9, P11, P12 = enrichissement progressif.

**Note politique.** Le congé Hadj n'est pas un détail technique. Sa formalisation dans le SIRH est un acte symbolique fort de reconnaissance institutionnelle ; à coordonner avec le Cabinet du Premier Ministre.
