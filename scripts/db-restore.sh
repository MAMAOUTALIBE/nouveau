#!/usr/bin/env bash
# =============================================================================
# db-restore.sh — Restauration d'un dump PostgreSQL RH Primature
# =============================================================================
#
# Usage :
#   RESTORE_PASSWORD=*** bash scripts/db-restore.sh <dump_file> [--allow-prod]
#
# Variables d'environnement :
#   RESTORE_HOST      (défaut: localhost)
#   RESTORE_PORT      (défaut: 5432)
#   RESTORE_USER      (défaut: rh_user)
#   RESTORE_DB        (défaut: rh_primature_restore_test)
#   RESTORE_PASSWORD  (requis)
#
# Sécurité :
#   Refus si RESTORE_DB == "rh_primature" ET RESTORE_HOST != "localhost"
#   sans le flag explicite --allow-prod (anti-écrasement accidentel).
#
# Exit codes :
#   0 succès
#   1 erreur
#
# Référence runbook : docs/security/db_backup_runbook.md
# =============================================================================

set -o errexit
set -o nounset
set -o pipefail

log() {
    printf '[%s] [db-restore] %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*"
}

err() {
    printf '[%s] [db-restore] [ERROR] %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*" >&2
}

usage() {
    cat <<'EOF'
Usage: db-restore.sh <dump_file> [--allow-prod]

Arguments :
  <dump_file>    Chemin du fichier .dump à restaurer
  --allow-prod   Autorise la restauration vers la DB de prod (anti-erreur)

Variables d'env requises : RESTORE_PASSWORD
EOF
}

# -----------------------------------------------------------------------------
# Parsing arguments.
# -----------------------------------------------------------------------------
ALLOW_PROD=0
DUMP_FILE=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --allow-prod)
            ALLOW_PROD=1
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        -*)
            err "Option inconnue : $1"
            usage
            exit 1
            ;;
        *)
            if [[ -z "$DUMP_FILE" ]]; then
                DUMP_FILE="$1"
            else
                err "Argument inattendu : $1"
                usage
                exit 1
            fi
            shift
            ;;
    esac
done

if [[ -z "$DUMP_FILE" ]]; then
    err "Argument dump_file manquant."
    usage
    exit 1
fi

# -----------------------------------------------------------------------------
# Configuration.
# -----------------------------------------------------------------------------
RESTORE_HOST="${RESTORE_HOST:-localhost}"
RESTORE_PORT="${RESTORE_PORT:-5432}"
RESTORE_USER="${RESTORE_USER:-rh_user}"
RESTORE_DB="${RESTORE_DB:-rh_primature_restore_test}"

# RESTORE_PASSWORD doit être DÉFINI (vide autorisé en local trust).
if [[ -z "${RESTORE_PASSWORD+x}" ]]; then
    err "RESTORE_PASSWORD doit être défini (variable d'environnement, vide autorisé en local trust)."
    exit 1
fi

# -----------------------------------------------------------------------------
# Garde-fou prod.
# -----------------------------------------------------------------------------
if [[ "$RESTORE_DB" == "rh_primature" && "$RESTORE_HOST" != "localhost" && "$ALLOW_PROD" -ne 1 ]]; then
    err "Refus : RESTORE_DB=rh_primature sur un host distant ($RESTORE_HOST)."
    err "Cela écraserait la production. Ajoutez explicitement --allow-prod si c'est volontaire."
    exit 1
fi

# -----------------------------------------------------------------------------
# Vérifications préalables.
# -----------------------------------------------------------------------------
if ! command -v pg_restore >/dev/null 2>&1; then
    err "pg_restore introuvable dans le PATH."
    exit 1
fi
if ! command -v psql >/dev/null 2>&1; then
    err "psql introuvable dans le PATH."
    exit 1
fi
if ! command -v createdb >/dev/null 2>&1; then
    err "createdb introuvable dans le PATH."
    exit 1
fi

if [[ ! -f "$DUMP_FILE" ]]; then
    err "Fichier de dump introuvable : $DUMP_FILE"
    exit 1
fi

DUMP_SIZE_BYTES=$(wc -c < "$DUMP_FILE" | tr -d ' ')
if [[ "$DUMP_SIZE_BYTES" -lt 1024 ]]; then
    err "Dump trop petit ($DUMP_SIZE_BYTES octets < 1 KB), restauration annulée."
    exit 1
fi

log "Restauration : host=$RESTORE_HOST port=$RESTORE_PORT db=$RESTORE_DB"
log "Source       : $DUMP_FILE (${DUMP_SIZE_BYTES} octets)"

export PGPASSWORD="$RESTORE_PASSWORD"

# -----------------------------------------------------------------------------
# Créer la DB cible si absente.
# -----------------------------------------------------------------------------
DB_EXISTS=$(psql -h "$RESTORE_HOST" -p "$RESTORE_PORT" -U "$RESTORE_USER" \
    -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$RESTORE_DB'" || echo "")

if [[ "$DB_EXISTS" != "1" ]]; then
    log "DB $RESTORE_DB absente — création."
    if ! createdb -h "$RESTORE_HOST" -p "$RESTORE_PORT" -U "$RESTORE_USER" "$RESTORE_DB"; then
        err "createdb a échoué."
        unset PGPASSWORD
        exit 1
    fi
else
    log "DB $RESTORE_DB existe — restauration avec --clean."
fi

# -----------------------------------------------------------------------------
# Restore.
# -----------------------------------------------------------------------------
START_TS="$(date +%s)"
# --clean + --if-exists permet de réinitialiser proprement le contenu sans
# bloquer la première restauration où les objets n'existent pas encore.
if ! pg_restore \
        --host="$RESTORE_HOST" \
        --port="$RESTORE_PORT" \
        --username="$RESTORE_USER" \
        --dbname="$RESTORE_DB" \
        --no-owner \
        --no-acl \
        --clean \
        --if-exists \
        "$DUMP_FILE"; then
    err "pg_restore a renvoyé une erreur (warnings éventuels — vérifier les logs)."
    unset PGPASSWORD
    exit 1
fi
END_TS="$(date +%s)"
DURATION=$(( END_TS - START_TS ))

log "Restore terminé en ${DURATION}s"

# -----------------------------------------------------------------------------
# Sanity check : au moins une table dans le schéma hr ?
# (Si le dump provient d'une DB sans schéma hr — cas du test e2e — on n'exige
# pas ce check : on contrôle juste qu'au moins une table utilisateur existe.)
# -----------------------------------------------------------------------------
HR_TABLES=$(psql -h "$RESTORE_HOST" -p "$RESTORE_PORT" -U "$RESTORE_USER" -d "$RESTORE_DB" \
    -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='hr'" || echo "0")
ANY_TABLES=$(psql -h "$RESTORE_HOST" -p "$RESTORE_PORT" -U "$RESTORE_USER" -d "$RESTORE_DB" \
    -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema')" || echo "0")

unset PGPASSWORD

log "Tables schéma hr  : $HR_TABLES"
log "Tables utilisateur: $ANY_TABLES"

if [[ "$HR_TABLES" -lt 1 && "$ANY_TABLES" -lt 1 ]]; then
    err "Sanity check échoué : aucune table après restauration."
    exit 1
fi

if [[ "$HR_TABLES" -lt 1 ]]; then
    log "Avertissement : schéma 'hr' absent (OK si dump non-prod, suspect si dump prod)."
fi

log "Restore OK"
exit 0
