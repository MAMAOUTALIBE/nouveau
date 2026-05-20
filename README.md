# RH-ADMIN

Application RH Angular 21 basée sur le dossier `Final`.

## Prérequis

- Node.js `20.19.5` minimum ou `22.12.0+`
- npm `10+`

Le projet fournit un fichier `.nvmrc` :

```bash
nvm use
```

## Démarrage local

Frontend Angular :

```bash
npm run start
```

API mock locale :

```bash
npm run start:api
```

Le frontend utilise `proxy.conf.json` et relaie `/api/*` vers `http://localhost:8080` en développement.

## Vérifications qualité

Typage :

```bash
npm run typecheck
```

Tests unitaires :

```bash
npm run test:unit
```

Tests end-to-end :

```bash
npm run test:e2e
```

## Build de production

```bash
npm run build
```

Les artefacts sont générés dans `dist/nowa-angular-21/`.

Pour un déploiement sous sous-répertoire, fournissez explicitement le `base-href` :

```bash
npm run build -- --base-href=/mon/sous-chemin/
```

## Notes de déploiement

- Le shell applicatif ne dépend plus de scripts Google Maps ni de polices Google chargées à l’exécution.
- Le quality gate CI exécute `typecheck`, `test:unit` et `build`.
- La route `/dashboard` pointe désormais vers la page métier `HrDashboardPage`.

## Base de donnees (cible production)

- Strategie et plan de migration:
  - [strategie-base-donnees-rh.md](/Volumes/Verbatim/GPA-GOUVE/Final/docs/strategie-base-donnees-rh.md)
- Schema SQL PostgreSQL v1:
  - [001_init_rh_schema.sql](/Volumes/Verbatim/GPA-GOUVE/Final/db/postgresql/001_init_rh_schema.sql)
- Guide rapide des migrations:
  - [db/postgresql/README.md](/Volumes/Verbatim/GPA-GOUVE/Final/db/postgresql/README.md)

## Sync PostgreSQL du mock backend

Le backend `mock-backend/server.cjs` peut synchroniser les données mémoire vers PostgreSQL.

Variables d'environnement principales :

- `DATABASE_URL` : URL de connexion PostgreSQL
- `DB_SYNC_ENABLED` : active la sync (`true`/`false`)
- `DB_SYNC_INTERVAL_MS` : fréquence de synchronisation (défaut `15000`)
- `DB_BOOTSTRAP_SCHEMA` : applique automatiquement `db/postgresql/001_init_rh_schema.sql` au démarrage (`true`/`false`)
- `DB_SSL_REQUIRE` : active SSL pour la connexion PostgreSQL (`true`/`false`)

Le statut de sync est exposé dans `GET /health` via le champ `postgresSync`.

## Déploiement en ligne de test

Le dépôt est prêt pour un déploiement simple sur Railway avec un seul service :

- `npm run build` compile Angular dans `dist/nowa-angular-21/`
- `npm run start:prod` lance `mock-backend/server.cjs`
- le backend sert aussi le frontend compilé et les routes SPA (`/`, `/auth/login`, `/dashboard`, etc.)
- la configuration Railway est versionnée dans `railway.json`

Étapes minimales :

```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

Si vous déployez via GitHub :

1. poussez la branche sur GitHub
2. créez un projet Railway depuis le dépôt
3. laissez Railway utiliser `railway.json`
4. générez un domaine public depuis Railway

Points d'attention :

- ne déployez pas le backend mock sur un environnement exposé sans remplacer l'authentification et la gestion des accès
- les fichiers téléversés par le mock backend sont stockés localement sur le conteneur et peuvent disparaître lors d'un redéploiement
- pour la production réelle, remplacez le mock backend et le stockage local des uploads
