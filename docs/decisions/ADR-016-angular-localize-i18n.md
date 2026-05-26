# ADR-016 — Internationalisation Angular : `@angular/localize`, FR par défaut, migration progressive

* **Statut** : accepted
* **Date** : 2026-05-26
* **Sponsor** : Équipe RH-ADMIN — Direction technique
* **Décideurs** : Tech Lead front, Coordinateur V1.0 Primature
* **Périmètre** : Front Angular 21 (`src/app/**`) — pas d'impact backend FastAPI

## Contexte

V1.0 cible une livraison FR (fr-GN, français de Guinée). Néanmoins, des partenaires
internationaux (bailleurs, agences techniques) consultent ponctuellement
l'application et l'ouverture multilingue (EN à terme, possiblement langues
nationales par la suite) est un objectif pour V1.5+.

Sans préparation, marquer tous les textes du jour au lendemain est un chantier
risqué et bloquant pour V1.0. Il faut un pipeline qui :

- ne casse pas la livraison FR V1.0 ;
- permet d'ajouter de nouvelles strings traduisibles **page par page** dans les
  vagues suivantes ;
- ne crée pas de dépendance à un service de traduction externe payant.

## Options envisagées

### Option A — `@angular/localize` (officiel Angular)

- **Avantages** : intégré au framework, ID stables `@@module.scope`, AOT,
  extraction native via `ng extract-i18n`, support XLIFF 1.2 / 2.0 / XMB / JSON,
  un bundle par locale (perf SSR-friendly).
- **Inconvénients** : pas de switch runtime entre langues (un build par locale) ;
  marquage `i18n` requis dans HTML et `$localize` dans TS.
- **Coût** : 0 € (open source) ; ~1 j-h pour bootstrap + 0,2–0,5 j-h par page à
  migrer.
- **Souveraineté** : tout reste dans le repo, aucune dépendance SaaS.

### Option B — `ngx-translate` (JSON runtime)

- **Avantages** : switch runtime sans rebuild ; configuration légère.
- **Inconvénients** : plus officiel-Angular pour V21, communauté qui glisse vers
  `@angular/localize`, pipe `| translate` requis partout, fichiers JSON à plat
  fragiles, pas d'aide AOT.
- **Coût** : 0 € + ~0,5 j-h supplémentaires pour la migration des pages.
- **Souveraineté** : OK mais dépendance externe maintenue par tiers.

### Option C — Pas d'i18n / FR codé en dur

- **Avantages** : zéro effort V1.0.
- **Inconvénients** : dette permanente, refonte coûteuse en V1.5+ ; pas d'option
  EN pour les bailleurs.
- **Coût** : 0 j-h V1.0 mais ~10 j-h supplémentaires plus tard (régression).
- **Souveraineté** : N/A.

## Décision

**Option A — `@angular/localize`** retenue, avec stratégie de migration
**progressive page par page** :

- locale source : `fr-GN` (français de Guinée) ;
- locale supplémentaire scaffoldée : `en` (anglais), non distribuée V1.0 ;
- V1.0 marque ~10 strings très visibles (login, agent-list, header) pour valider
  le pipeline ; le reste reste en FR codé en dur ;
- les vagues V1.1, V1.2, … migrent les pages restantes une à une.

Convention IDs : `@@module.scope.element` (cf. `docs/i18n_runbook.md`).

## Conséquences

* **Positives** :
  - pipeline d'extraction prouvé fonctionnel (`npm run i18n:extract`) ;
  - bundle EN compile (`npm run i18n:build:en`) ;
  - dette technique linéaire et maîtrisable, pas de big-bang ;
  - aucun coût licence, aucun service externe.

* **Négatives** :
  - un build par locale (donc deux artefacts en V1.1+ : `/` FR et `/en/`) ;
  - les strings non marquées restent FR — accepter cette dette V1.0.

* **Risques** :
  - oubli d'ID stable lors d'une refonte texte → traduction EN perdue.
    Mitigation : convention `@@module.scope.element` documentée + revue PR.
  - dérive de strings non marquées dans le code TS (toasts, error messages) —
    mitigation : checklist de revue côté vagues suivantes.

* **À mettre en place** :
  - `@angular/localize` déjà en `devDependencies` (Angular 21 fournit init via
    polyfills) ;
  - section `i18n` dans `angular.json` + configuration `production-en` ;
  - scripts npm `i18n:extract` et `i18n:build:en` ;
  - runbook `docs/i18n_runbook.md` pour le pipeline d'ajout de strings ;
  - `src/test-setup.ts` charge `@angular/localize/init` pour que `$localize`
    fonctionne dans vitest.

## Validation

* Validé par : Tech Lead front — 2026-05-26 (Chantier 4 V1.0, gate G2)
* Document(s) de référence :
  - `docs/i18n_runbook.md`
  - `src/locale/messages.xlf` (extraction de référence)
  - `src/locale/messages.en.xlf` (scaffold EN, 11 trans-units traduites)
