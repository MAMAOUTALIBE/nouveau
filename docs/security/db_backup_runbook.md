# Runbook : Sauvegarde et restauration de la base PostgreSQL

> **Périmètre** : sauvegardes automatisées quotidiennes + restauration vérifiée
> de `rh_primature` (PostgreSQL 16, container `rh-postgres`).
> **Public** : équipe DSI Primature, ops de garde, RSSI.
> **Version** : 1.0 — initiale (P0 #3 cycle G2).
> **Dernière mise à jour** : 2026-05-25.
> **Référence croisée** : `docs/security/pii_migration_runbook.md` (clés de
> chiffrement à sauvegarder hors-base).

## Objectif

- **RPO (Recovery Point Objective)** : 1 jour. Au plus 24 h de données
  perdues en cas d'incident majeur (dump quotidien à 02h30).
- **RTO (Recovery Time Objective)** : 4 heures. Délai maximal pour
  restaurer le service à partir d'un dump propre, hors reconstruction
  applicative.
- **Rétention** : 90 jours en local (rotation auto) ; durée illimitée
  côté offsite (S3/MinIO) — à arbitrer avec le RSSI.

## Architecture

```
        +----------------------------+
        | rh-postgres (container)    |
        | volume rh_postgres_data    |
        +-------------+--------------+
                      |
                      | pg_dump (custom, compress=9)
                      v
        +----------------------------+
        | /var/backups/rh-primature  |   <-- VPS Hostinger, rotation 90j
        +-------------+--------------+
                      |
                      | aws s3 cp (si BACKUP_S3_BUCKET défini)
                      v
        +----------------------------+
        | Bucket offsite (S3/MinIO)  |   <-- stockage longue durée
        +----------------------------+
```

- Format du dump : `pg_dump --format=custom --compress=9 --no-owner --no-acl`.
  Permet un restore granulaire (`pg_restore --table=...`) et reste compact.
- Nomenclature : `rh_primature_YYYY-MM-DD_HHMMSS.dump`.
- Logs : `/var/log/rh-primature-backup.log` (à logrotate).

## Installation sur le VPS

### 1. Pré-requis sur le VPS

```bash
# Outils Postgres client (déjà via container rh-postgres, mais ici on appelle
# depuis l'hôte) :
sudo apt-get install -y postgresql-client-16

# Si offsite S3/MinIO souhaité :
sudo apt-get install -y awscli
```

### 2. Déploiement des scripts

```bash
# Les scripts vivent dans le repo cloné en /opt/rh-primature.
sudo mkdir -p /var/backups/rh-primature
sudo chown root:root /var/backups/rh-primature
sudo chmod 700 /var/backups/rh-primature

# Aucune copie nécessaire : les scripts sont exécutés depuis /opt/rh-primature.
ls -l /opt/rh-primature/scripts/db-backup.sh
```

### 3. Configuration des variables d'environnement

Créer **`/etc/rh-primature/backup.env`** (mode 600, propriétaire root) :

```ini
# Connexion à rh-postgres exposé sur localhost via mapping Docker
# (à adapter selon docker-compose.prod.yml — par défaut, le port 5432
# du container n'est PAS publié ; cf. section "Branchement Docker").
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
POSTGRES_USER=rh_user
POSTGRES_DB=rh_primature
POSTGRES_PASSWORD=<copier depuis .env de prod>

BACKUP_DIR=/var/backups/rh-primature
BACKUP_RETENTION_DAYS=90

# Offsite (recommandé) — MinIO Hostinger ou S3 AWS :
BACKUP_S3_BUCKET=s3://rh-primature-backups/
BACKUP_S3_ENDPOINT=https://minio.example.org
BACKUP_S3_PROFILE=rh-primature
```

Permissions strictes :

```bash
sudo mkdir -p /etc/rh-primature
sudo chmod 700 /etc/rh-primature
sudo touch /etc/rh-primature/backup.env
sudo chmod 600 /etc/rh-primature/backup.env
```

### 4. Branchement Docker (rh-postgres)

Le container `rh-postgres` n'expose pas le port 5432 sur l'hôte par défaut.
Deux options :

- **Option A (recommandée)** : exécuter `pg_dump` *à l'intérieur* du
  container via `docker exec`. Wrapper d'exemple ajouté à `backup.env` :
  ```bash
  POSTGRES_HOST=rh-postgres  # ignoré ; on remplace l'invocation
  ```
  Et appeler depuis cron/systemd :
  ```bash
  docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" rh-postgres \
      pg_dump -U rh_user -d rh_primature --format=custom --compress=9 \
              --no-owner --no-acl > /var/backups/rh-primature/...
  ```
  Pour rester simple et générique, le script actuel attend `pg_dump` sur
  l'hôte ; voir l'option B.

- **Option B** : publier le port 5432 du container `rh-postgres` sur
  `127.0.0.1:5432` (jamais sur l'IP publique). Ajouter à
  `docker-compose.prod.yml` :
  ```yaml
  ports:
    - "127.0.0.1:5432:5432"
  ```
  C'est l'option présupposée par le script tel quel.

### 5. Planification

#### Cron (simple)

```bash
sudo cp /opt/rh-primature/scripts/db-backup.cron /etc/cron.d/rh-primature-backup
sudo chmod 644 /etc/cron.d/rh-primature-backup
```

#### systemd (préféré sur distros modernes)

```bash
sudo cp /opt/rh-primature/scripts/db-backup.service /etc/systemd/system/
sudo cp /opt/rh-primature/scripts/db-backup.timer   /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now db-backup.timer
systemctl list-timers --all | grep db-backup
```

## Procédure de restauration en cas d'incident

### 1. Identifier le dump à restaurer

```bash
ls -lh /var/backups/rh-primature/ | tail
# ou depuis l'offsite :
aws s3 ls s3://rh-primature-backups/ | tail
```

### 2. Restaurer dans une DB de TEST d'abord (non-prod)

```bash
RESTORE_HOST=127.0.0.1 \
RESTORE_PORT=5432 \
RESTORE_USER=rh_user \
RESTORE_DB=rh_primature_restore_check \
RESTORE_PASSWORD=*** \
bash /opt/rh-primature/scripts/db-restore.sh \
     /var/backups/rh-primature/rh_primature_2026-05-24_023007.dump
```

Vérifier l'intégrité (effectifs, dernière migration appliquée, schéma `hr`).

### 3. Restaurer en production (cas extrême)

**Avant** : arrêter le backend pour éviter les écritures concurrentes.

```bash
docker compose -f docker-compose.prod.yml stop backend
```

Puis :

```bash
RESTORE_HOST=127.0.0.1 \
RESTORE_PORT=5432 \
RESTORE_USER=rh_user \
RESTORE_DB=rh_primature \
RESTORE_PASSWORD=*** \
bash /opt/rh-primature/scripts/db-restore.sh \
     /var/backups/rh-primature/rh_primature_2026-05-24_023007.dump \
     --allow-prod
```

Le flag `--allow-prod` est **obligatoire** pour cibler `rh_primature` sur
un host non-`localhost` (garde-fou anti-écrasement). Redémarrer ensuite :

```bash
docker compose -f docker-compose.prod.yml start backend
```

## Vérification mensuelle (obligatoire)

Le 1er de chaque mois, exécuter le test E2E sur un environnement de
recette (jamais sur la prod) :

```bash
TEST_PG_HOST=localhost \
TEST_PG_PORT=5432 \
TEST_PG_USER=rh_user \
TEST_PG_PASSWORD=*** \
bash /opt/rh-primature/scripts/test-backup-restore.sh
```

Consigner le résultat (date + exit code) dans le registre d'exploitation.

## Caveats critiques

1. **Clés de chiffrement PII (`PII_ENCRYPTION_KEYS`)** : le dump contient
   les colonnes PII chiffrées au format `kvN:<token-fernet>`. **Sans la
   clé Fernet correspondante**, le dump est inutile (PII non
   déchiffrables). Conséquence : sauvegarder les clés
   ***séparément*** du dump (coffre-fort, gestionnaire de secrets, ou
   support hors-ligne). Cf. `docs/security/pii_migration_runbook.md`
   section "Gestion des clés".

2. **Pas de chiffrement GPG du dump** : ce runbook ne couvre PAS le
   chiffrement applicatif du fichier `.dump` (le contenu PII est déjà
   chiffré en base via Fernet). Pour le reste (schéma, autres données),
   sécuriser via le transport S3 (HTTPS + SSE) et les permissions du
   bucket. À renforcer en P1.

3. **Pas de monitoring Prometheus** : surveiller manuellement
   `/var/log/rh-primature-backup.log` et l'exit code systemd via
   `journalctl -u db-backup.service`. À automatiser en P1 (alerte si
   pas de dump > 26h).

4. **Restore JAMAIS testé = pas un backup**. La vérification mensuelle
   n'est pas optionnelle.

## Référence

- `docs/security/pii_migration_runbook.md` — gestion des clés PII.
- `PROCEDURE-DEPLOIEMENT.md` — procédure de déploiement prod globale.
- Loi 037/AN/2016 (cybersécurité Guinée) — exigence de continuité.
