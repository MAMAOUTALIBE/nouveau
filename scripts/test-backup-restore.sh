#!/usr/bin/env bash
# =============================================================================
# test-backup-restore.sh — Test E2E backup + restore en local
# =============================================================================
#
# Scénario :
#   1. Crée DB source rh_primature_backup_test avec quelques données seed
#   2. Lance db-backup.sh pour produire un dump
#   3. Lance db-restore.sh vers rh_primature_restore_test
#   4. Vérifie l'intégrité des données restaurées
#   5. Cleanup systématique (drop DBs + suppression dump)
#
# Variables d'environnement (toutes optionnelles, défauts pensés pour macOS brew) :
#   TEST_PG_HOST       (défaut: localhost)
#   TEST_PG_PORT       (défaut: 5433)
#   TEST_PG_USER       (défaut: utilisateur courant — $USER)
#   TEST_PG_PASSWORD   (défaut: vide — autorisé en local avec trust)
#
# Exit codes :
#   0 tout est OK
#   1 échec quelque part (cf. logs)
# =============================================================================

set -o errexit
set -o nounset
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DB="rh_primature_backup_test"
TARGET_DB="rh_primature_restore_test"
BACKUP_DIR="$(mktemp -d -t rh-backup-test-XXXXXX)"

TEST_PG_HOST="${TEST_PG_HOST:-localhost}"
TEST_PG_PORT="${TEST_PG_PORT:-5433}"
TEST_PG_USER="${TEST_PG_USER:-$USER}"
TEST_PG_PASSWORD="${TEST_PG_PASSWORD:-}"

log() {
    printf '[%s] [test-backup-restore] %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*"
}

err() {
    printf '[%s] [test-backup-restore] [ERROR] %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*" >&2
}

# -----------------------------------------------------------------------------
# Cleanup garanti (trap EXIT).
# -----------------------------------------------------------------------------
# shellcheck disable=SC2329  # invoked via `trap EXIT` ci-dessous.
cleanup() {
    local exit_code=$?
    log "Cleanup (exit_code=$exit_code)"
    export PGPASSWORD="$TEST_PG_PASSWORD"

    # Drop DBs (en ignorant les erreurs, on est en cleanup).
    psql -h "$TEST_PG_HOST" -p "$TEST_PG_PORT" -U "$TEST_PG_USER" -d postgres \
        -c "DROP DATABASE IF EXISTS $SOURCE_DB" >/dev/null 2>&1 || true
    psql -h "$TEST_PG_HOST" -p "$TEST_PG_PORT" -U "$TEST_PG_USER" -d postgres \
        -c "DROP DATABASE IF EXISTS $TARGET_DB" >/dev/null 2>&1 || true

    unset PGPASSWORD

    # Supprimer le dossier de dump.
    if [[ -d "$BACKUP_DIR" ]]; then
        rm -rf -- "$BACKUP_DIR"
    fi

    exit "$exit_code"
}
trap cleanup EXIT

# -----------------------------------------------------------------------------
# Vérifications préalables.
# -----------------------------------------------------------------------------
for cmd in psql pg_dump pg_restore createdb; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        err "Commande manquante : $cmd"
        exit 1
    fi
done

if ! [[ -x "$SCRIPT_DIR/db-backup.sh" ]]; then
    err "$SCRIPT_DIR/db-backup.sh introuvable ou non exécutable."
    exit 1
fi
if ! [[ -x "$SCRIPT_DIR/db-restore.sh" ]]; then
    err "$SCRIPT_DIR/db-restore.sh introuvable ou non exécutable."
    exit 1
fi

log "Postgres cible : $TEST_PG_USER@$TEST_PG_HOST:$TEST_PG_PORT"
log "Dossier dump   : $BACKUP_DIR"

export PGPASSWORD="$TEST_PG_PASSWORD"

# Sanity : connexion possible ?
if ! psql -h "$TEST_PG_HOST" -p "$TEST_PG_PORT" -U "$TEST_PG_USER" -d postgres -tAc "SELECT 1" >/dev/null 2>&1; then
    err "Impossible de se connecter à $TEST_PG_HOST:$TEST_PG_PORT en tant que $TEST_PG_USER."
    err "Vérifiez que Postgres tourne et que TEST_PG_USER/TEST_PG_PASSWORD sont corrects."
    exit 1
fi

# -----------------------------------------------------------------------------
# Étape 1 : Préparer la DB source avec un seed.
# -----------------------------------------------------------------------------
log "Étape 1 : création DB source $SOURCE_DB + seed"
psql -h "$TEST_PG_HOST" -p "$TEST_PG_PORT" -U "$TEST_PG_USER" -d postgres \
    -c "DROP DATABASE IF EXISTS $SOURCE_DB" >/dev/null
createdb -h "$TEST_PG_HOST" -p "$TEST_PG_PORT" -U "$TEST_PG_USER" "$SOURCE_DB"

psql -h "$TEST_PG_HOST" -p "$TEST_PG_PORT" -U "$TEST_PG_USER" -d "$SOURCE_DB" <<'SQL' >/dev/null
CREATE TABLE foo (
    id   SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);
INSERT INTO foo (name) VALUES ('alpha'), ('bravo'), ('charlie');
SQL

SOURCE_COUNT=$(psql -h "$TEST_PG_HOST" -p "$TEST_PG_PORT" -U "$TEST_PG_USER" \
    -d "$SOURCE_DB" -tAc "SELECT count(*) FROM foo")
log "Seed OK : $SOURCE_COUNT lignes dans foo."

if [[ "$SOURCE_COUNT" != "3" ]]; then
    err "Seed inattendu (attendu 3, obtenu $SOURCE_COUNT)."
    exit 1
fi

unset PGPASSWORD

# -----------------------------------------------------------------------------
# Étape 2 : lancer db-backup.sh.
# -----------------------------------------------------------------------------
log "Étape 2 : exécution de db-backup.sh"
POSTGRES_HOST="$TEST_PG_HOST" \
POSTGRES_PORT="$TEST_PG_PORT" \
POSTGRES_USER="$TEST_PG_USER" \
POSTGRES_DB="$SOURCE_DB" \
POSTGRES_PASSWORD="$TEST_PG_PASSWORD" \
BACKUP_DIR="$BACKUP_DIR" \
BACKUP_RETENTION_DAYS=90 \
bash "$SCRIPT_DIR/db-backup.sh"

# Récupérer le dump produit.
DUMP_FILE=$(find "$BACKUP_DIR" -maxdepth 1 -type f -name 'rh_primature_*.dump' | head -n 1)
if [[ -z "$DUMP_FILE" ]]; then
    err "Aucun dump produit dans $BACKUP_DIR."
    exit 1
fi
log "Dump produit : $DUMP_FILE"

# -----------------------------------------------------------------------------
# Étape 3 : restore vers DB cible.
# -----------------------------------------------------------------------------
log "Étape 3 : exécution de db-restore.sh"
RESTORE_HOST="$TEST_PG_HOST" \
RESTORE_PORT="$TEST_PG_PORT" \
RESTORE_USER="$TEST_PG_USER" \
RESTORE_DB="$TARGET_DB" \
RESTORE_PASSWORD="$TEST_PG_PASSWORD" \
bash "$SCRIPT_DIR/db-restore.sh" "$DUMP_FILE"

# -----------------------------------------------------------------------------
# Étape 4 : vérifier l'intégrité.
# -----------------------------------------------------------------------------
log "Étape 4 : vérification des données restaurées"
export PGPASSWORD="$TEST_PG_PASSWORD"
TARGET_COUNT=$(psql -h "$TEST_PG_HOST" -p "$TEST_PG_PORT" -U "$TEST_PG_USER" \
    -d "$TARGET_DB" -tAc "SELECT count(*) FROM foo" | tr -d ' ')
unset PGPASSWORD

if [[ "$TARGET_COUNT" != "$SOURCE_COUNT" ]]; then
    err "Décalage : source=$SOURCE_COUNT vs cible=$TARGET_COUNT"
    exit 1
fi
log "Vérification OK : $TARGET_COUNT lignes restaurées dans foo."

log "TEST E2E backup/restore : SUCCÈS"
exit 0
