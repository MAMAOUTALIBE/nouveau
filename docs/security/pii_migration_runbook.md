# Runbook : Activation du chiffrement PII au repos (Sub-B PII)

> **Périmètre** : déploiement en production du chiffrement transparent des
> colonnes PII de `hr.employees`.
> **Public** : équipe DSI Primature, RSSI Primature, ops de garde.
> **Version** : 1.0 — initiale (Sub-B, cycle C12).
> **Dernière mise à jour** : 2026-05-25.
> **Cadre juridique** : loi 037/AN/2016 relative à la cybersécurité et à la
> protection des données à caractère personnel ; cf. `docs/registre-traitements.md`
> (traitement T-01).

## Objectif

Chiffrer au repos les colonnes PII de `hr.employees` (`email`,
`national_id`, `phone`, `birth_date`) via Fernet (AES-128-CBC + HMAC-SHA256
authentifié) et matérialiser un HMAC-SHA256 de lookup sur l'email et le
numéro national pour permettre la recherche et la déduplication
côté applicatif. Après application, la base ne contient plus aucune
PII en clair sur ces colonnes : seuls des ciphertexts opaques au format
`kvN:<token-fernet>`.

## Architecture cible (rappel)

- Chiffrement par TypeDecorators SQLAlchemy : `EncryptedString`
  (`backend/app/core/security/types.py`) et `EncryptedDate`.
- Algorithme : `cryptography.fernet.MultiFernet` (rotation transparente).
- Lookups : `email_lookup_hash` et `national_id_lookup_hash` (VARCHAR(64),
  HMAC-SHA256 hex, indexés). Cf. migration `0011_pii_encryption_at_rest`.
- Script idempotent de chiffrement des données existantes :
  `python -m app.scripts.encrypt_existing_pii`.

## Prérequis

| Item | Détail |
|---|---|
| Accès VPS | SSH en tant que `root` (ou compte sudo) sur le VPS Hostinger qui héberge la stack `rh-postgres` / `rh-backend` / `rh-frontend` (cf. `PROCEDURE-DEPLOIEMENT.md`). |
| Accès DB | `docker compose -f docker-compose.prod.yml exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"` (le port 5432 est interne au réseau Docker, pas exposé sur l'hôte). |
| Backups | Répertoire `/var/backups/rh-primature/` créé avec `chmod 700`, owner `root` (ou `postgres` si un dépôt cron tourne sous ce compte). |
| Clés | Deux dépositaires de la clé maître : RSSI Primature et DSI Primature. |
| Fenêtre | ~30 min minimum (volume ≈ 500 agents — temps réel du script < 1 min, le reste = vérifications + backup). |
| Capacité disque | Backup `pg_dump` non compressé ≈ 100 Mo pour le volume actuel ; prévoir 1 Go disponible sous `/var/backups/`. |

## Étapes (à exécuter sur le VPS prod, dans cet ordre strict)

### 1. Génération des clés maîtres (UNIQUE — à conserver en vault gouvernemental)

À ne réaliser **qu'une seule fois** lors du premier déploiement. Pour les
mises à jour ultérieures, voir la section *Rotation des clés*.

Les commandes ci-dessous sont à exécuter sur un poste **administrateur
hors VPS** (poste DSI durci, sans accès internet pendant l'opération si
possible) :

```bash
# Clé Fernet (utilisée par MultiFernet pour chiffrer/déchiffrer les PII)
python3 -c "from cryptography.fernet import Fernet; print('kv1:' + Fernet.generate_key().decode())"

# Clé HMAC pour les lookups (32 bytes hex minimum, cf. crypto._parse_hmac_key)
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Stocker les deux valeurs dans un fichier de secrets root-only sur le VPS :

```bash
sudo install -d -m 0700 -o root -g root /etc/rh-primature
sudo tee /etc/rh-primature/secrets.env >/dev/null <<'EOF'
PII_ENCRYPTION_KEYS=kv1:<valeur-fernet-générée>
EMAIL_LOOKUP_HMAC_KEY=<hex-64-caracteres>
EOF
sudo chmod 600 /etc/rh-primature/secrets.env
sudo chown root:root /etc/rh-primature/secrets.env
```

Backup chiffré hors VPS (OBLIGATOIRE — perte = données irrécupérables) :

```bash
# Sur le poste admin, GPG-chiffrer le fichier secrets pour les deux dépositaires
gpg --encrypt --armor \
    --recipient rssi.primature@gouv.gn \
    --recipient dsi.primature@gouv.gn \
    -o rh-primature-secrets-2026-05-25.asc \
    secrets.env
```

Stocker le fichier `.asc` dans le coffre-fort numérique de la Primature
(et un duplicata papier scellé en coffre physique RSSI). Détruire le fichier
clair (`shred -u secrets.env`).

> **Ne jamais committer** `PII_ENCRYPTION_KEYS` ou `EMAIL_LOOKUP_HMAC_KEY`
> dans Git, ni dans le fichier `.env` standard du `docker-compose.prod.yml`
> s'il n'est pas chiffré (cf. ADR-004 : sealed-secrets ciblé pour
> Kubernetes ; la stack Docker Compose courante utilise un secrets.env
> séparé).

### 2. Backup DB pré-migration (OBLIGATOIRE)

```bash
cd /opt/rh-primature  # racine du déploiement Docker Compose
STAMP=$(date +%Y%m%d-%H%M%S)
sudo install -d -m 0700 /var/backups/rh-primature
docker compose -f docker-compose.prod.yml exec -T postgres \
    pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=plain --no-owner \
    | sudo tee "/var/backups/rh-primature/pre_0011_${STAMP}.sql" >/dev/null
sudo chmod 600 "/var/backups/rh-primature/pre_0011_${STAMP}.sql"
```

Vérification de l'intégrité du dump avant de poursuivre :

```bash
# Le dump doit contenir une ligne PostgreSQL database dump complete à la fin
sudo tail -1 "/var/backups/rh-primature/pre_0011_${STAMP}.sql"
# Sortie attendue : -- PostgreSQL database dump complete

# Taille non nulle, comptage des INSERT cohérent (≈ 500 agents attendus)
sudo wc -l "/var/backups/rh-primature/pre_0011_${STAMP}.sql"
sudo grep -c "INSERT INTO hr.employees" "/var/backups/rh-primature/pre_0011_${STAMP}.sql" || true
```

Conservation **90 jours minimum** (rétention conforme à la politique de
sauvegarde Primature ; voir aussi ADR-002 sur le site DR secondaire).

### 3. Application de la migration 0011

```bash
cd /opt/rh-primature

# Stopper l'app (la migration alembic ne tourne pas dans un worker actif)
docker compose -f docker-compose.prod.yml stop backend frontend

# Charger les secrets PII dans l'environnement du shell ops
set -a
source /etc/rh-primature/secrets.env
set +a

# Vérifier que les vars sont chargées (sans afficher la valeur)
test -n "$PII_ENCRYPTION_KEYS" && echo "PII_ENCRYPTION_KEYS : OK"
test -n "$EMAIL_LOOKUP_HMAC_KEY" && echo "EMAIL_LOOKUP_HMAC_KEY : OK"

# Appliquer la migration via le conteneur one-shot rh-migrate.
# (Le service migrate du compose lit déjà DATABASE_URL ; on injecte
# les secrets PII pour cohérence des imports.)
docker compose -f docker-compose.prod.yml run --rm \
    -e PII_ENCRYPTION_KEYS \
    -e EMAIL_LOOKUP_HMAC_KEY \
    migrate alembic upgrade head
```

Vérifications :

```bash
# 1. Tête Alembic = 0011
docker compose -f docker-compose.prod.yml run --rm migrate alembic current
# Sortie attendue : 0011 (head)

# 2. DDL : email et birth_date doivent etre TEXT ; les hash lookups doivent exister
docker compose -f docker-compose.prod.yml exec -T postgres \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\d hr.employees"
# Verifier dans la sortie :
#   email                     | text
#   birth_date                | text
#   email_lookup_hash         | character varying(64)
#   national_id_lookup_hash   | character varying(64)
# Et l'index ix_employees_email_lookup_hash sur email_lookup_hash.
```

### 4. Chiffrement des données existantes (idempotent)

Le script est conçu pour être rejouable sans effet de bord : une ligne
déjà chiffrée (préfixe `kvN:`) est skippée, seules les valeurs en clair
sont chiffrées et hachées.

**4.a Dry-run** (aucun UPDATE émis, comptage uniquement) :

```bash
docker compose -f docker-compose.prod.yml run --rm \
    -e PII_ENCRYPTION_KEYS \
    -e EMAIL_LOOKUP_HMAC_KEY \
    backend python -m app.scripts.encrypt_existing_pii --dry-run --verbose
```

Lire le résumé en fin de sortie (clés `rows_scanned`, `rows_to_encrypt`,
`already_encrypted`, `errors`). Si `errors > 0`, **ne pas passer à la
suite** ; analyser les logs structurés (catégorie d'erreur).

**4.b Run réel** :

```bash
docker compose -f docker-compose.prod.yml run --rm \
    -e PII_ENCRYPTION_KEYS \
    -e EMAIL_LOOKUP_HMAC_KEY \
    backend python -m app.scripts.encrypt_existing_pii --batch-size 500 --verbose
```

Sortie attendue : `stats.errors == 0`, et `rows_encrypted` égal à la valeur
`rows_to_encrypt` annoncée en dry-run.

Vérification SQL post-script :

```bash
docker compose -f docker-compose.prod.yml exec -T postgres \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
        SELECT
          COUNT(*) FILTER (WHERE email IS NOT NULL AND email NOT LIKE 'kv%:%') AS email_clair,
          COUNT(*) FILTER (WHERE email IS NOT NULL AND email_lookup_hash IS NULL) AS email_sans_hash,
          COUNT(*) FILTER (WHERE birth_date IS NOT NULL AND birth_date NOT LIKE 'kv%:%') AS bdate_clair
        FROM hr.employees;
    "
```

Les trois compteurs doivent valoir **0**.

### 5. Smoke tests post-migration

Redémarrer le backend avec les secrets PII en environnement (cf. étape 6
pour la commande durable ; pour le smoke test on peut redémarrer
temporairement) :

```bash
docker compose -f docker-compose.prod.yml --env-file /etc/rh-primature/secrets.env \
    up -d backend frontend
```

Tests fonctionnels (en remplaçant `<token>` par un JWT admin valide) :

```bash
# 5.a Lecture : les emails en clair doivent revenir dans la reponse API
curl -fsS -H "Authorization: Bearer <token>" \
    http://localhost:8000/personnel/agents?limit=5 \
    | jq '.items[] | {id, email, birth_date}' | head -20

# 5.b Recherche par hash (email exact)
curl -fsS -H "Authorization: Bearer <token>" \
    "http://localhost:8000/personnel/agents?search=jeanne.doe@gouv.gn" \
    | jq '.total'
# Sortie attendue : >= 1 si l'email existe en base.

# 5.c Audit logs : creation d'un agent test puis verification de la redaction
# (Les logs ne doivent contenir AUCUNE valeur PII en clair.)
docker compose -f docker-compose.prod.yml logs --tail=200 backend \
    | grep -iE 'email|national_id|phone|birth' \
    | grep -viE 'redacted|<redacted>|kv[0-9]+:' \
    | head
# Sortie attendue : vide (aucune fuite).
```

### 6. Redémarrage de l'application en mode chiffré durable

Pour que le backend dispose des secrets PII en permanence, deux options
selon l'organisation ops :

**Option A — fusion dans le `.env` du compose** (déploiements actuels) :

```bash
cd /opt/rh-primature
# Ajouter les deux lignes a la fin de .env (root-only)
sudo sh -c 'cat /etc/rh-primature/secrets.env >> /opt/rh-primature/.env'
sudo chmod 600 /opt/rh-primature/.env

# Redeployer la stack
docker compose -f docker-compose.prod.yml up -d
```

**Option B — `env_file` dédié** (recommandé à terme, isolation plus fine) :
ajouter `env_file: /etc/rh-primature/secrets.env` au service `backend`
dans une override `docker-compose.prod.override.yml` non versionnée, puis :

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.prod.override.yml up -d
```

Health checks :

```bash
# 1. Le backend doit etre healthy
docker compose -f docker-compose.prod.yml ps
# Attendu : rh-backend / rh-frontend / rh-postgres en Up (healthy).

# 2. Endpoint sante
curl -fsS http://localhost:8000/health
# Sortie attendue : {"status":"ok",...}

# 3. Monitoring du warning legacy
docker compose -f docker-compose.prod.yml logs --since=10m backend \
    | grep -c pii_legacy_plaintext_read || true
# Sortie attendue : 0 (si > 0, voir Rollback / cas 2 ci-dessous).
```

> **Si `pii_legacy_plaintext_read` apparaît plusieurs fois** : l'étape 4
> a échoué partiellement. Relancer le script (étape 4.b) — il est
> idempotent et reprendra les lignes restantes en clair.

### 7. Checkpoint validation (J+1 à J+7)

- **J+1** : compteur `pii_legacy_plaintext_read` à 0 ; aucune erreur 5xx
  attribuée au module `personnel` ou `crypto` dans les logs.
- **J+7** : si tout est OK, archiver le dump pré-migration vers le
  stockage long terme (site DR secondaire, cf. ADR-002).
- Tagger le déploiement : `git tag -a pii-encryption-prod-$(date +%Y%m%d) -m "Sub-B PII activé en prod"`.

## Rollback

### Cas 1 — Échec immédiat (avant étape 4)

La migration a été appliquée mais aucune donnée n'a encore été chiffrée
par le script.

```bash
cd /opt/rh-primature
docker compose -f docker-compose.prod.yml stop backend frontend
docker compose -f docker-compose.prod.yml run --rm migrate alembic downgrade -1
docker compose -f docker-compose.prod.yml up -d backend frontend
```

> **Note** : le `downgrade()` de la migration 0011 émet un `ALTER text::date`
> sur `birth_date`. Avant l'étape 4 c'est sûr (les valeurs sont au format
> `YYYY-MM-DD` natif). Après l'étape 4 ce n'est plus sûr (cf. cas 2).

### Cas 2 — Échec post-script `encrypt_existing_pii`

**À CE STADE, LA BASE CONTIENT DES CIPHERTEXTS QUE SEULE LA CLÉ PEUT
DÉCHIFFRER**. Le downgrade Alembic est techniquement possible mais
détruirait toute lisibilité des PII (`ALTER text::date` échouera sur
les valeurs `kv1:...`).

Procédure de rollback réelle = restauration du dump pré-migration :

```bash
cd /opt/rh-primature
docker compose -f docker-compose.prod.yml stop backend frontend migrate

# Vider et restaurer le schema hr (le dump pre-migration le recree)
docker compose -f docker-compose.prod.yml exec -T postgres \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
    -c "DROP SCHEMA hr CASCADE;"

# Restaurer le dump (le fichier exact depend de l'horodatage de l'etape 2)
cat /var/backups/rh-primature/pre_0011_<date>.sql \
    | docker compose -f docker-compose.prod.yml exec -T postgres \
        psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

docker compose -f docker-compose.prod.yml up -d backend frontend
```

Toute donnée saisie **entre le moment du dump et la décision de rollback**
sera perdue. C'est pourquoi cette décision doit être prise rapidement (idéalement
dans la fenêtre de maintenance, avant remise en production).

### Cas 3 — Perte de la clé maître

**CATASTROPHE : les données PII chiffrées sont irrécupérables.**

C'est exactement pourquoi la procédure de l'étape 1 impose **deux
dépositaires** et un **backup GPG hors VPS**. La procédure d'urgence est
identique au cas 2 : restauration du dump pré-migration le plus récent.
Toutes les PII saisies depuis ce dump sont perdues. Un incident DPO
formel doit être ouvert (cf. ADR-009) et un signalement à l'autorité de
contrôle envisagé selon la nature des données.

## Rotation des clés (procédure régulière)

- **Cadence** : 12 mois en régime de croisière, ou **immédiatement** si
  compromission suspectée.
- **Principe** : `MultiFernet` accepte une liste de clés et tente le
  déchiffrement de la plus récente à la plus ancienne. On peut donc
  ajouter une nouvelle clé en tête sans casser les lectures.

```bash
# 1. Generer la nouvelle clé (cf. etape 1)
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# 2. Editer /etc/rh-primature/secrets.env : la nouvelle clé devient kv2 en tête,
#    l'ancienne kv1 reste en queue pour les lectures.
# Exemple :
# PII_ENCRYPTION_KEYS=kv2:<nouvelle-fernet>,kv1:<ancienne-fernet>

# 3. Restart backend (les nouvelles ecritures utilisent kv2, les lectures
#    legacy kv1 fonctionnent toujours)
docker compose -f docker-compose.prod.yml up -d backend
```

Re-chiffrement forcé (pour passer toutes les lignes existantes en `kv2`) :
un script dédié n'est **pas livré en Sub-B**. Il sera ajouté en V1.1 ou
sur ticket dédié. Pour Sub-B, la rotation reste une **option opérationnelle
latente** : les anciennes lignes resteront en `kv1` tant qu'elles ne sont
pas modifiées par l'application (chaque `UPDATE` re-chiffre avec la clé
en tête). Une fois toutes les lignes converties (vérifiable via
`SELECT email FROM hr.employees WHERE email LIKE 'kv1:%' LIMIT 1` —
doit ne plus rien retourner), on peut retirer `kv1` du CSV après une
période d'observation de 30 jours.

## Limites connues (Sub-B)

1. **Ciphertext sans hash (crash mid-flight)** : si un crash laisse une
   ligne avec `email = "kv1:..."` mais `email_lookup_hash = NULL`, le
   script `encrypt_existing_pii` **ne recalculera pas** le hash (par
   design — il n'a pas le plaintext). Remédiation : un script
   complémentaire qui passe par l'ORM (qui sait déchiffrer) pour
   recalculer les hashs orphelins. À ajouter en V1.1 si rencontré.

2. **Recherche par sous-chaîne d'email impossible** : `LIKE '%domain%'`
   ne fonctionne plus ; seul le match exact via HMAC est supporté.
   Conforme à la sécurité, mais limite l'UX si un endpoint
   « rechercher les agents par pattern d'email » est demandé.

3. **Recherche par tranche de date de naissance impossible** :
   `WHERE birth_date BETWEEN ... AND ...` ne fonctionne plus
   (la colonne stocke des ciphertexts). Si la fonctionnalité est
   demandée, prévoir une colonne sœur `birth_year INT` indexée et
   non-PII en soi.

4. **CITEXT résiduel** : `recruitment.candidate_email` et
   `users.email` / `users.username` restent en CITEXT. Hors scope Sub-B
   (ce sont des PII de candidats/comptes, pas d'agents). À traiter dans
   un cycle dédié si chiffrement requis.

5. **Downgrade Alembic 0011 non sûr après script** : le `ALTER text::date`
   échouera sur des valeurs `kv1:...`. Documenté dans la docstring
   `downgrade()` de la migration. Le rollback réel post-script passe
   obligatoirement par la restauration du dump (cf. cas 2).

## Monitoring post-déploiement

- **Dashboard Grafana** (à provisionner) : taux de logs structurés
  `event=pii_legacy_plaintext_read`. Cible : 0 après J+1.
- **Alerte** : si > 0 après J+7, le script d'étape 4 a probablement
  échoué partiellement → relancer.
- **Compteur ops** (cron quotidien recommandé) :

  ```sql
  SELECT COUNT(*) FROM hr.employees
   WHERE email IS NOT NULL AND email_lookup_hash IS NULL;
  ```

  Cible : 0. Toute valeur > 0 indique un crash mid-flight (cf. limite 1).

- **Audit logs** : pas de PII en clair attendue ; vérification
  ponctuelle via `docker compose logs backend | grep -iE 'email|phone|national_id'`
  doit ne retourner que des valeurs `<redacted>` ou des ciphertexts
  `kvN:...`.

## Contacts

| Rôle | Contact |
|---|---|
| RSSI Primature | *(à compléter par la DSI)* |
| DSI Primature | *(à compléter par la DSI)* |
| DPO Primature | cf. ADR-009 (désignation formelle en cours) |
| Support technique pipeline | équipe @coder / Anthropic Claude Code |

## Références internes

- Migration : `backend/alembic/versions/0011_pii_encryption_at_rest.py`
- TypeDecorators : `backend/app/core/security/types.py`
- Module crypto : `backend/app/core/security/crypto.py`
- Script de chiffrement : `backend/app/scripts/encrypt_existing_pii.py`
- ADR liés : `docs/decisions/ADR-004-secrets-management.md`,
  `docs/decisions/ADR-002-site-dr-secondaire.md`,
  `docs/decisions/ADR-009-dpo-designation.md`
- Registre RGPD : `docs/registre-traitements.md` (T-01)
- Procédure de déploiement générale : `PROCEDURE-DEPLOIEMENT.md`,
  `DEPLOYMENT.md`
