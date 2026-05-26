# Runbook — Internationalisation (`@angular/localize`)

Référence ADR : [ADR-016](decisions/ADR-016-angular-localize-i18n.md).

## Objectif

Préparer l'anglais (EN) **sans bloquer la livraison V1.0** qui reste 100 % FR
(fr-GN). On marque progressivement les strings — page par page, vague après
vague — pour bâtir le catalogue de traduction sans big-bang.

## Périmètre V1.0 (gate G2 Chantier 4)

Strings marquées (11 trans-units explicites) :

| ID | Source FR | Cible EN | Fichier |
| --- | --- | --- | --- |
| `auth.login.title` | Connexion RH | HR Sign-in | `src/app/authentication/login/login.html` |
| `auth.login.subtitle` | Connectez-vous pour accéder au portail de gestion RH. | Sign in to access the HR management portal. | `src/app/authentication/login/login.html` |
| `auth.login.email_label` | Adresse e-mail | Email address | `src/app/authentication/login/login.html` |
| `auth.login.password_label` | Mot de passe | Password | `src/app/authentication/login/login.html` |
| `auth.login.submit` | Se connecter | Sign in | `src/app/authentication/login/login.html` |
| `personnel.agents.title` | Liste des agents | Agents list | `src/app/modules/personnel/pages/agent-list/agent-list.html` |
| `personnel.agents.create_button` | Nouvel agent | New agent | `src/app/modules/personnel/pages/agent-list/agent-list.html` |
| `personnel.agents.col_matricule` | Matricule | ID number | `src/app/modules/personnel/pages/agent-list/agent-list.html` |
| `personnel.agents.col_fullname` | Nom complet | Full name | `src/app/modules/personnel/pages/agent-list/agent-list.html` |
| `personnel.agents.col_direction` | Direction | Department | `src/app/modules/personnel/pages/agent-list/agent-list.html` |
| `shared.header.toggle_sidebar` | Afficher ou masquer le menu latéral | Show or hide the side menu | `src/app/shared/components/header/header.ts` (`$localize`) |

Toutes les autres strings de l'application restent FR codé en dur — c'est
attendu et acceptable pour V1.0.

`ng-bootstrap` ajoute ~31 trans-units (`ngb.alert.*`, `ngb.datepicker.*`, etc.)
qui apparaissent dans `messages.xlf` mais ne sont pas reprises dans
`messages.en.xlf` — Angular fait un fallback automatique vers la `source`
(anglais d'origine pour ngb), pas besoin de traduire en V1.0.

## Convention IDs

Format : `@@module.scope.element`

- `module` : domaine fonctionnel (`auth`, `personnel`, `shared`, …)
- `scope` : feature / page (`login`, `agents`, `header`, …)
- `element` : libellé court (`title`, `submit`, `col_matricule`, …)

Pourquoi des IDs explicites ? Ils sont **stables** : si on change le texte
source en FR, l'ID reste identique et la traduction EN n'est pas perdue.
Sans ID explicite, Angular génère un hash basé sur le contenu — toute retouche
de la string casse la correspondance.

## Procédure — Ajouter une nouvelle string traduisible

### 1. Marquer la string

Dans un template HTML, ajouter l'attribut `i18n` avec un ID explicite :

```html
<h1 i18n="@@personnel.agents.title">Liste des agents</h1>
```

Pour les attributs (placeholder, aria-label, title) :

```html
<input
  placeholder="Recherche"
  i18n-placeholder="@@personnel.agents.search_placeholder"
/>
```

Dans un fichier `.ts`, utiliser le template tag `$localize` :

```ts
readonly toggleSidebarLabel = $localize`:@@shared.header.toggle_sidebar:Afficher ou masquer le menu latéral`;
```

> Astuce TS : la syntaxe est `$localize\`:@@id:texte source\`` — bien noter les
> deux points autour de l'ID.

### 2. Extraire les strings

```bash
npm run i18n:extract
```

Cela régénère `src/locale/messages.xlf` avec toutes les strings marquées du
projet (les anciennes + la nouvelle). Le fichier est versionné dans Git.

### 3. Reporter la traduction dans le catalogue EN

Ouvrir `src/locale/messages.en.xlf` et ajouter un nouveau bloc `<trans-unit>`
correspondant, en copiant la structure d'un bloc existant :

```xml
<trans-unit id="personnel.agents.search_placeholder" datatype="html">
  <source>Recherche</source>
  <target>Search</target>
  <context-group purpose="location">
    <context context-type="sourcefile">src/app/modules/personnel/pages/agent-list/agent-list.html</context>
    <context context-type="linenumber">14</context>
  </context-group>
</trans-unit>
```

Si une traduction est manquante, le build EN reste fonctionnel : Angular log un
warning `No translation found for "<id>"` et utilise la `source` (FR) comme
fallback. Acceptable en transitoire — à corriger avant la livraison EN.

### 4. Valider les builds

```bash
npm run typecheck            # 0 erreur attendue
npm run test:unit            # tests existants doivent toujours passer
npm run i18n:build:en        # build EN doit compiler sans erreur
```

> Le build EN n'est pas exécuté en CI par défaut V1.0. Le faire localement
> avant la PR jusqu'à ce que la CI soit étendue.

## Limites V1.0

- **Pas de switch runtime** : `@angular/localize` produit un bundle par locale ;
  l'app FR est servie sur `/`, le bundle EN dans `dist/.../en/`. La V1.0 ne
  déploie **que** FR.
- **Strings TypeScript** : seules les strings critiques sont marquées via
  `$localize`. Les nombreux toasts, messages d'erreur et labels FR du code
  TS restent codés en dur — migration progressive.
- **Tests unitaires** : `$localize` est chargé via `src/test-setup.ts`
  (`import '@angular/localize/init'`). Les tests qui comparent des strings
  exactes (`expect(message).toBe('Identifiants invalides')`) restent verts car
  `$localize` en environnement de test (sans translations chargées) retourne
  la `source` (FR).

## Stratégie progressive — Vagues V1.1+

Migrer page par page selon ce priorisation :

1. **V1.1 — pages publiques / haute visibilité** : dashboard, agent-list complet
   (filtres + tableau complet + KPIs), header complet (notifications, profil).
2. **V1.2 — pages métier RH** : recrutement, congés, documents.
3. **V1.3 — admin / paramétrage** : référentiels, rôles, audit.
4. **V1.4 — strings TS résiduelles** : toasts, erreurs API, validations
   formulaires.

À chaque vague :

- ne marquer que les strings de la page traitée ;
- lancer `npm run i18n:extract` puis copier les nouveaux trans-units dans
  `messages.en.xlf` ;
- vérifier `npm run i18n:build:en` au vert ;
- PR séparée pour la vague i18n (revue facilitée).

## Dépannage

| Symptôme | Cause probable | Correction |
| --- | --- | --- |
| `$localize is not defined` au runtime | polyfill manquant | Vérifier `polyfills: ["zone.js", "@angular/localize/init"]` dans `angular.json` |
| `$localize is not defined` dans vitest | setup test incomplet | Ajouter `import '@angular/localize/init';` en haut de `src/test-setup.ts` |
| Build EN ne trouve pas la traduction | trans-unit absent ou ID incorrect dans `messages.en.xlf` | Vérifier que l'ID dans le `<trans-unit id=...>` correspond exactement à `@@...` dans le code |
| `messages.xlf` perd un trans-unit après extract | string supprimée du code (cleanup OK) | Si la string est encore utilisée, vérifier que l'attribut `i18n` ou `$localize` n'a pas été retiré par mégarde |
