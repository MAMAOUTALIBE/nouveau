# Procédure de déploiement — RH DRH

Runbook **spécifique** à l'installation en production sur le VPS Hostinger.
Pour mettre à jour l'application après une modification, voir directement la
**section 2** (c'est la procédure du quotidien).

> Guide générique séparé : [DEPLOYMENT.md](DEPLOYMENT.md). Le présent document
> décrit l'installation **réelle** déjà en service.

---

## 1. L'essentiel — coordonnées

| Élément | Valeur |
|---|---|
| Site public | **https://rhgn.cloud** |
| Dépôt GitHub | https://github.com/MAMAOUTALIBE/nouveau |
| Branche | `main` |
| VPS — IP publique | `187.127.228.197` |
| VPS — accès SSH | `ssh root@187.127.228.197` |
| Dossier du projet sur le VPS | `/root/nouveau-app` (`~/nouveau-app`) |
| Fichier compose de production | `docker-compose.prod.yml` |
| Connexion admin | `admin@primature.gov.gn` (mot de passe défini à la mise en service) |

**Conteneurs en production :** `rh-postgres` (base), `rh-migrate` (migrations,
one-shot), `rh-backend` (API), `rh-frontend` (app Angular + nginx).

---

## 2. ⭐ Redéployer après une modification

C'est la procédure à suivre **chaque fois** qu'on améliore l'application.
Trois temps : pousser le code → tirer + reconstruire sur le VPS → vérifier.

### Étape A — Côté développement (là où on modifie le code)

```bash
# 1. Vérifier que le code est sain AVANT de pousser
npm run typecheck          # frontend
# (backend) : cd backend && uv run ruff check app && uv run mypy app

# 2. Committer et pousser sur GitHub
git add .
git commit -m "description de la modification"
git push origin main
```

### Étape B — Côté serveur (VPS) — appliquer la mise à jour

```bash
ssh root@187.127.228.197

cd ~/nouveau-app
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Ce que fait cette dernière commande, automatiquement :
- reconstruit les images frontend et backend avec le nouveau code ;
- `rh-migrate` applique les éventuelles **nouvelles migrations** de base de
  données, puis s'arrête ;
- redémarre `rh-backend` et `rh-frontend` sans toucher aux données.

⏱️ Le rebuild prend quelques minutes (recompilation Angular).

### Étape C — Vérifier

```bash
docker compose -f docker-compose.prod.yml ps
curl -s http://localhost:8090/api/v1/health
```

Attendu : `rh-postgres` / `rh-backend` / `rh-frontend` en `Up (healthy)`,
`rh-migrate` en `Exited (0)`, et `health` qui répond
`{"status":"ok",...,"database":"up"}`.

Puis ouvrir **https://rhgn.cloud** dans le navigateur (avec `Ctrl+F5` pour
forcer le rechargement, le navigateur garde l'ancienne version en cache).

---

## 3. Architecture déployée

```
Internet ──► Traefik (Hostinger, ports 80/443, HTTPS Let's Encrypt)
                  │  route rhgn.cloud
                  ▼
            rh-frontend (nginx + app Angular)
                  │  /api/* en interne
                  ▼
            rh-backend (FastAPI)
                  │
                  ▼
            rh-postgres (PostgreSQL)
```

- **Traefik** est géré par Hostinger ; il route le domaine vers `rh-frontend`
  grâce aux *labels* définis dans `docker-compose.prod.yml`.
- `rh-frontend` sert l'app et relaie `/api/*` vers `rh-backend`.
- `rh-backend` et `rh-postgres` ne sont **pas** exposés sur Internet.
- Le HTTPS (certificat Let's Encrypt) est obtenu et renouvelé automatiquement
  par Traefik.

---

## 4. Commandes d'exploitation

Toutes à lancer depuis `~/nouveau-app` sur le VPS.

```bash
# Voir les logs en direct
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs migrate     # migrations

# État des conteneurs
docker compose -f docker-compose.prod.yml ps -a

# Redémarrer sans reconstruire
docker compose -f docker-compose.prod.yml restart

# Sauvegarder la base de données (À FAIRE avant toute grosse mise à jour)
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U rh_user rh_primature > ~/sauvegarde-$(date +%F).sql

# Restaurer une sauvegarde
cat ~/sauvegarde-AAAA-MM-JJ.sql | docker compose -f docker-compose.prod.yml \
  exec -T postgres psql -U rh_user -d rh_primature

# Arrêter / relancer toute la stack (les données PostgreSQL sont conservées)
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

---

## 5. Configuration (`.env`)

Le fichier `~/nouveau-app/.env` sur le VPS contient les secrets
(mot de passe base, clé JWT, domaine). Il **n'est pas versionné** dans Git.

Si une amélioration nécessite une **nouvelle variable d'environnement** :
1. l'ajouter dans `docker-compose.prod.yml` (versionné) ;
2. l'ajouter dans `~/nouveau-app/.env` sur le VPS (valeur réelle) ;
3. redéployer (section 2).

Contenu actuel du `.env` (valeurs à ne pas divulguer) :
`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `JWT_SECRET_KEY`,
`ALLOWED_ORIGINS`, `HTTP_PORT`.

---

## 6. Pièges connus (déjà résolus — à ne pas reproduire)

| Piège | Règle à respecter |
|---|---|
| **Migrations** | Ne jamais mettre `RUN_MIGRATIONS_ON_STARTUP=true`. Les migrations sont gérées par le conteneur dédié `rh-migrate`. |
| **Schéma SQL `db/postgresql/`** | La migration baseline lit ces fichiers ; ils sont montés dans `rh-migrate` via `docker-compose.prod.yml`. Ne pas retirer ce montage. |
| **Conflit de domaine Traefik** | Ne **pas** recréer l'ancien projet `nouveau` (frontend seul) dans le Docker Manager Hostinger : il définit le même routeur `rhgn` et casse le routage du domaine. Seul `nouveau-app` doit exister. |
| **Port 80** | Réservé à Traefik. Le frontend est publié sur le port `8090` (variable `HTTP_PORT`) ; le domaine passe par Traefik, pas par ce port. |
| **Cache navigateur** | Après un redéploiement, recharger avec `Ctrl+F5` sinon l'ancienne version s'affiche. |

---

## 7. Gérer les données

- **Comptes initiaux** (déjà créés) : `admin`, `hr`, `manager`, `agent` —
  créés une seule fois via
  `docker compose -f docker-compose.prod.yml exec backend python -m scripts.seed_initial`.
- Les **agents** se créent dans l'application : Personnel → *Nouvel agent*.
- La base de production est **indépendante** de tout environnement de test
  local : les données créées en local n'apparaissent pas en ligne.

---

## 8. Dépannage rapide

| Symptôme | À vérifier |
|---|---|
| Le site ne répond pas | `docker compose -f docker-compose.prod.yml ps` — un conteneur arrêté ? |
| `rh-backend` redémarre en boucle | `logs backend` — souvent base injoignable ou migration échouée. |
| `404 page not found` sur le domaine | Conflit de routeur Traefik — voir section 6 (ancien projet `nouveau`). |
| Erreur HTTPS / certificat | DNS de `rhgn.cloud` doit pointer sur `187.127.228.197` ; Traefik régénère le certificat ensuite. |
| Modif invisible après redéploiement | Recharger avec `Ctrl+F5` ; vérifier que `git pull` a bien récupéré le commit. |

---

## 9. Première installation (référence)

Procédure déjà réalisée — utile uniquement pour réinstaller de zéro :

```bash
ssh root@187.127.228.197
cd ~
git clone https://github.com/MAMAOUTALIBE/nouveau.git nouveau-app
cd nouveau-app
cat > .env <<EOF
POSTGRES_USER=rh_user
POSTGRES_PASSWORD=<mot-de-passe-fort>
POSTGRES_DB=rh_primature
JWT_SECRET_KEY=<clé-aléatoire-32-caractères-min>
ALLOWED_ORIGINS=https://rhgn.cloud
HTTP_PORT=8090
EOF
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backend python -m scripts.seed_initial
```

Puis : DNS de `rhgn.cloud` (enregistrement `A`) → `187.127.228.197`, et le
routage HTTPS se fait via les labels Traefik du service `frontend`.
