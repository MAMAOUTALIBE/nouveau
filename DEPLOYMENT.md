# Déploiement en ligne — RH Primature

Guide de mise en production sur un **VPS Hostinger** via Docker.

## Architecture

L'application est composée de trois services orchestrés par Docker Compose :

| Service | Rôle | Image |
|---|---|---|
| `postgres` | Base de données PostgreSQL 16 | `postgres:16-alpine` |
| `backend` | API Python / FastAPI | construite depuis `backend/Dockerfile` |
| `frontend` | Application Angular servie par nginx + reverse-proxy `/api` | construite depuis `Dockerfile` |

Seul le **frontend** est exposé sur Internet (port HTTP). Il sert l'application
Angular et relaie les appels `/api/*` vers le backend, qui reste privé sur le
réseau Docker interne. La base de données n'est jamais exposée.

> ⚠️ **Type d'hébergement requis : VPS.** Cette application a besoin d'exécuter
> en continu Python et PostgreSQL. L'**hébergement mutualisé** Hostinger
> (« Hébergement Web ») ne le permet pas — il faut un **VPS Hostinger**.

## Prérequis

- Un **VPS Hostinger** (Ubuntu 22.04+ recommandé, 2 Go RAM minimum — 4 Go
  conseillés pour confort lors du build).
- Un accès SSH au VPS.
- Un nom de domaine pointant (enregistrement DNS `A`) vers l'IP du VPS.

## Étape 1 — Installer Docker sur le VPS

Connecté en SSH au VPS :

```bash
curl -fsSL https://get.docker.com | sh
```

Vérifier : `docker --version` et `docker compose version`.

## Étape 2 — Récupérer le code depuis GitHub

```bash
git clone https://github.com/MAMAOUTALIBE/nouveau.git
cd nouveau
```

## Étape 3 — Configurer les variables d'environnement

```bash
cp .env.prod.example .env
nano .env
```

Renseigner **obligatoirement** :

- `POSTGRES_PASSWORD` — un mot de passe fort.
- `JWT_SECRET_KEY` — une clé aléatoire de 32 caractères minimum.
  Générer avec : `openssl rand -hex 32`
- `ALLOWED_ORIGINS` — l'URL publique, ex. `https://rh.mondomaine.com`.

Le fichier `.env` contient des secrets : il n'est pas versionné, ne pas le
committer.

## Étape 4 — Lancer la stack

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Le premier lancement compile les images (quelques minutes). Un conteneur
dédié `rh-migrate` applique les migrations de base de données, puis le
backend démarre une fois les migrations terminées.

Vérifier que tout tourne :

```bash
docker compose -f docker-compose.prod.yml ps
curl -s http://localhost/api/v1/health
```

La réponse attendue : `{"status":"ok",...,"database":"up"}`.

## Étape 5 — Créer les comptes initiaux

À faire **une seule fois**, après le premier démarrage :

```bash
docker compose -f docker-compose.prod.yml exec backend python -m scripts.seed_initial
```

Cela crée les rôles, les types de congés et 4 comptes de démonstration
(`admin`, `hr`, `manager`, `agent` — mot de passe `ChangeMe!2026`).

> 🔒 **Important** : connectez-vous immédiatement et changez ces mots de passe,
> ou supprimez les comptes inutiles. Ne laissez jamais les mots de passe par
> défaut en production.

## Étape 6 — Domaine et HTTPS

1. Dans le DNS de votre domaine, créez un enregistrement `A` pointant vers
   l'IP du VPS.
2. L'application répond alors en HTTP sur `http://votre-domaine.com`.
3. Pour le **HTTPS** (indispensable en production), au choix :
   - activer le SSL depuis le panneau Hostinger du VPS ;
   - ou installer un reverse-proxy avec certificat Let's Encrypt automatique
     (Caddy, ou nginx + certbot) devant le service `frontend`.

## Exploitation courante

```bash
# Voir les logs
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend

# Redémarrer
docker compose -f docker-compose.prod.yml restart

# Mettre à jour après un nouveau commit sur GitHub
git pull
docker compose -f docker-compose.prod.yml up -d --build

# Sauvegarder la base de données
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U rh_user rh_primature > sauvegarde-$(date +%F).sql

# Arrêter (les données PostgreSQL sont conservées dans le volume)
docker compose -f docker-compose.prod.yml down
```

## Dépannage

| Symptôme | Piste |
|---|---|
| `JWT_SECRET_KEY requis` au démarrage | Variable absente ou vide dans `.env`. |
| Backend redémarre en boucle | Vérifier `docker compose ... logs backend` — souvent un souci de connexion à PostgreSQL ou de migration. |
| Build frontend échoue (mémoire) | VPS sous-dimensionné : passer à 4 Go de RAM, ou construire l'image ailleurs et la transférer. |
| Page blanche / 404 sur les routes | Normal uniquement si nginx ne sert pas le SPA — vérifier que `deploy/nginx.conf` est bien dans l'image. |
| `/api` renvoie 502 | Le backend n'est pas prêt — attendre la fin des migrations, vérifier ses logs. |

## Notes

- `node_modules/`, `dist/` et `.angular/cache` ne sont pas versionnés : ils sont
  régénérés pendant le build Docker.
- `backend/.env` (configuration de développement local) n'est pas utilisé en
  production — la configuration vient du `.env` racine via `docker-compose.prod.yml`.
- Les fichiers téléversés par le backend sont stockés dans le conteneur ; pour
  une production durable, prévoir un volume Docker dédié ou un stockage objet
  (S3 / MinIO) — voir les adaptateurs `backend/app/adapters/storage/`.
