# Backlog V1.5 — Fonctionnalités à câbler (backend)

> Établi le 2026-05-22 à partir d'un audit complet des modules
> (parcours automatisé des 57 routes × 3 rôles).

## Contexte

Certains écrans Angular sont en place mais leur **backend n'est pas encore
implémenté**. Pour éviter que le frontend ne casse, ces endpoints sont servis
par un routeur de placeholders : [`backend/app/api/v1/_stubs.py`](../backend/app/api/v1/_stubs.py).
Un stub renvoie une réponse vide bien formée (`[]`, `{}`, `{"status":"stub"}`)
avec l'en-tête HTTP `X-Implementation-Status: stub-v1.5`.

**Règle de livraison :** quand une fonctionnalité est livrée, retirer la route
stub correspondante de `_stubs.py` — sinon le stub masque la vraie route et
l'écran reste vide (cas déjà rencontré avec `GET /documents/requests`).

Les écrans concernés **s'ouvrent sans erreur** ; seuls les widgets alimentés
par ces endpoints restent vides. Ce ne sont donc pas des bugs, mais du
développement backend à planifier.

---

## Personnel — 3 fonctionnalités

| Fonctionnalité | Description | Endpoints stub |
|---|---|---|
| **Anti-doublons agents** | Détection des fiches en double à la création / import, puis fusion | `GET /personnel/agents/duplicate-index`, `GET /personnel/agents/duplicate-cases`, `POST /personnel/agents/merge` |
| **Suggestion de matricule** | Génération automatique du matricule + journal d'audit des suggestions | `GET /personnel/agents/matricule-suggestion`, `GET /personnel/agents/matricule-suggestion-audit` |
| **Téléversement de pièces** | Upload de documents rattachés à la fiche agent | `POST /personnel/uploads` |

> Note : `GET /personnel/risques-turnover` est un alias historique stub ; la
> vraie page « Risques turn-over » utilise déjà l'endpoint réel.

## Absences — 1 fonctionnalité

| Fonctionnalité | Description | Endpoints stub |
|---|---|---|
| **Journal d'événements congés** | Fil chronologique des actions sur une demande de congé | `GET /leave/events` |

## Documents — 5 fonctionnalités

| Fonctionnalité | Description | Endpoints stub |
|---|---|---|
| **Analytics documentaire** | Tableaux de bord d'usage des documents | `GET /documents/analytics` |
| **Boîte de réception / file de traitement** | Documents à traiter, en file, en retard | `GET /documents/inbox`, `GET /documents/processing-queue`, `GET /documents/overdue` |
| **Journal d'audit documentaire** | Traçabilité des accès et modifications | `GET /documents/audit-logs` |
| **Exigences documentaires** | Pièces obligatoires par type de dossier | `GET /documents/requirements` |
| **Archivage** | Campagnes d'archivage et purge des archives | `POST /documents/archive-run`, `POST /documents/purge-archives` |

## Recrutement — 7 fonctionnalités (chantier principal, ~35 endpoints)

| Fonctionnalité | Description | Endpoints stub |
|---|---|---|
| **Scoring des candidatures** | Notation automatique des candidatures + politique de scoring + simulation | `GET /recruitment/application-scores`, `GET /recruitment/scoring-policy`, `POST /recruitment/rules/simulate` |
| **Anti-doublons candidatures** | Détection et liaison/fusion des candidatures en double | `GET /recruitment/applications/duplicates`, `GET·POST /recruitment/applications/duplicates/links`, `POST /recruitment/applications/duplicates/link` |
| **Entretiens** | Planification, banque de questions, évaluations, report d'entretien | `GET /recruitment/interviews`, `GET /recruitment/interview-question-bank` (+ `import`/`export`), `POST /recruitment/interviews/{id}/reschedule`, `POST /recruitment/interviews/{id}/evaluations` |
| **Présélection / shortlists** | Suggestion et validation de shortlists | `POST /recruitment/shortlists/suggest`, `GET /recruitment/shortlists/validations`, `POST /recruitment/shortlists/{reference}/validate` |
| **Onboarding 30/60/90 jours** | Suivi d'intégration, scores de réussite, feedback, synchronisation | `GET /recruitment/onboarding/306090`, `GET /recruitment/onboarding/success-scores`, `GET /recruitment/onboarding/sync-logs`, `POST /recruitment/onboarding/{ref}/306090-feedback`, `POST /recruitment/onboarding/{ref}/sync` |
| **Règles d'automatisation** | Moteur de règles de recrutement + historique d'exécution | `GET /recruitment/rules`, `GET /recruitment/rules/executions` |
| **Pilotage & BI** | Control tower, dashboard exécutif, export BI, observabilité, prévision de charge, budgets de campagne, notifications, audit | `GET /recruitment/control-tower`, `GET /recruitment/executive-dashboard` (+ `export`), `GET /recruitment/bi-export` (+ `logs`), `GET /recruitment/observability` (+ `events`), `GET /recruitment/campaigns/workload-forecast`, `GET /recruitment/campaigns/budgets`, `GET /recruitment/notifications`, `GET /recruitment/audit-logs` |

## Workflows — 1 fonctionnalité

| Fonctionnalité | Description | Endpoints stub |
|---|---|---|
| **Automation / orchestrateur SLA** | Relances automatiques sur dépassement de SLA, canaux de notification, politique configurable, simulation et cycle d'exécution | `GET /workflows/automation/status`, `GET·PUT /workflows/automation/policy`, `GET /workflows/automation/channels`, `GET /workflows/automation/events`, `POST /workflows/automation/run-cycle`, `POST /workflows/automation/simulate`, `POST /workflows/automation/events/clear` |

> Dépend du moteur BPMN, déjà identifié dans le code pour une vague ultérieure.

## Tableau de bord — dormant

Les routes stub `GET /dashboard/operations` et `GET /dashboard/pilotage`
existent mais les pages actuelles ne les appellent pas — rien à câbler côté
écran.

---

## Priorisation suggérée

1. **Recrutement** représente ~60 % du reste-à-faire — à découper en lots :
   d'abord *Scoring* et *Entretiens*, puis *Onboarding* et *Anti-doublons*,
   enfin *Pilotage & BI*.
2. **Documents** (inbox, exigences, archivage) — cohérent avec la fonctionnalité
   « demandes de documents » déjà livrée.
3. **Personnel** (anti-doublons, suggestion de matricule) — petit lot à fort
   impact sur la qualité des données.
4. **Workflows automation** — à planifier avec le moteur BPMN.

## Rappel — à faire à chaque livraison

- [ ] Implémenter le service + les endpoints réels.
- [ ] Retirer la/les route(s) stub de `backend/app/api/v1/_stubs.py`.
- [ ] Vérifier que l'écran affiche bien les données (le stub ne doit plus masquer la vraie route).
