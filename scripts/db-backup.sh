#!/usr/bin/env bash
# =============================================================================
# db-backup.sh — Sauvegarde quotidienne de la base PostgreSQL RH Primature
# =============================================================================
#
# Usage :
#   POSTGRES_PASSWORD=*** bash scripts/db-backup.sh
#
# Variables d'environnement :
#   POSTGRES_HOST          (défaut: localhost)
#   POSTGRES_PORT          (défaut: 5432)
#   POSTGRES_USER          (défaut: rh_user)
#   POSTGRES_DB            (défaut: rh_primature)
#   POSTGRES_PASSWORD      (requis)
#   BACKUP_DIR             (défaut: /var/backups/rh-primature)
#   BACKUP_RETENTION_DAYS  (défaut: 90)
#   BACKUP_S3_BUCKET       (optionnel, ex: s3://bucket/rh-primature/)
#   BACKUP_S3_ENDPOINT     (optionnel, MinIO/S3-compatible)
#   BACKUP_S3_PROFILE      (optionnel, profil aws CLI)
#
# Exit codes :
#   0 succès complet
#   1 erreur (cf. logs)
#
# Référence runbook : docs/security/db_backup_runbook.md
# =============================================================================

set -o errexit
set -o nounset
set -o pipefail

# -----------------------------------------------------------------------------
# Logging — pas de PII (uniquement paths, tailles, durées).
# -----------------------------------------------------------------------------
log() {
    printf '[%s] [db-backup] %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*"
}

err() {
    printf '[%s] [db-backup] [ERROR] %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*" >&2
}

# -----------------------------------------------------------------------------
# Configuration (avec défauts).
# -----------------------------------------------------------------------------
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-rh_user}"
POSTGRES_DB="${POSTGRES_DB:-rh_primature}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/rh-primature}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-90}"
BACKUP_S3_BUCKET="${BACKUP_S3_BUCKET:-}"
BACKUP_S3_ENDPOINT="${BACKUP_S3_ENDPOINT:-}"
BACKUP_S3_PROFILE="${BACKUP_S3_PROFILE:-}"

# -----------------------------------------------------------------------------
# Vérifications préalables.
# -----------------------------------------------------------------------------
# POSTGRES_PASSWORD doit être DÉFINI (même vide pour auth trust en local).
# `-z ${VAR+x}` distingue "non défini" vs "défini, même vide".
if [[ -z "${POSTGRES_PASSWORD+x}" ]]; then
    err "POSTGRES_PASSWORD doit être défini (variable d'environnement, vide autorisé en local trust)."
    exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
    err "pg_dump introuvable dans le PATH."
    exit 1
fi

# -----------------------------------------------------------------------------
# Préparation du dossier de destination.
# -----------------------------------------------------------------------------
if ! mkdir -p "$BACKUP_DIR"; then
    err "Impossible de créer le dossier de backup: $BACKUP_DIR"
    exit 1
fi

TIMESTAMP="$(date '+%Y-%m-%d_%H%M%S')"
DUMP_FILE="$BACKUP_DIR/rh_primature_${TIMESTAMP}.dump"

log "Démarrage du backup : host=$POSTGRES_HOST port=$POSTGRES_PORT db=$POSTGRES_DB"
log "Destination locale  : $DUMP_FILE"

# -----------------------------------------------------------------------------
# Dump.
# -----------------------------------------------------------------------------
START_TS="$(date +%s)"
export PGPASSWORD="$POSTGRES_PASSWORD"

if ! pg_dump \
        --host="$POSTGRES_HOST" \
        --port="$POSTGRES_PORT" \
        --username="$POSTGRES_USER" \
        --dbname="$POSTGRES_DB" \
        --format=custom \
        --compress=9 \
        --no-owner \
        --no-acl \
        --file="$DUMP_FILE"; then
    err "pg_dump a échoué."
    unset PGPASSWORD
    rm -f "$DUMP_FILE"
    exit 1
fi
unset PGPASSWORD

END_TS="$(date +%s)"
DURATION=$(( END_TS - START_TS ))

# -----------------------------------------------------------------------------
# Vérification de taille (>1 KB sinon dump suspect).
# -----------------------------------------------------------------------------
if [[ ! -f "$DUMP_FILE" ]]; then
    err "Fichier de dump absent après pg_dump : $DUMP_FILE"
    exit 1
fi

# wc -c est portable (macOS + Linux).
DUMP_SIZE_BYTES=$(wc -c < "$DUMP_FILE" | tr -d ' ')
if [[ "$DUMP_SIZE_BYTES" -lt 1024 ]]; then
    err "Dump trop petit ($DUMP_SIZE_BYTES octets < 1 KB), suspect d'échec silencieux."
    rm -f "$DUMP_FILE"
    exit 1
fi

log "Dump réussi : ${DUMP_SIZE_BYTES} octets en ${DURATION}s"

# -----------------------------------------------------------------------------
# Upload S3 / MinIO (optionnel).
# -----------------------------------------------------------------------------
if [[ -n "$BACKUP_S3_BUCKET" ]]; then
    if ! command -v aws >/dev/null 2>&1; then
        err "aws CLI introuvable mais BACKUP_S3_BUCKET défini."
        exit 1
    fi

    AWS_CMD=(aws)
    if [[ -n "$BACKUP_S3_PROFILE" ]]; then
        AWS_CMD+=(--profile "$BACKUP_S3_PROFILE")
    fi
    if [[ -n "$BACKUP_S3_ENDPOINT" ]]; then
        AWS_CMD+=(--endpoint-url "$BACKUP_S3_ENDPOINT")
    fi

    # Normaliser : s'assurer que le bucket finit par '/'.
    S3_TARGET="${BACKUP_S3_BUCKET%/}/$(basename "$DUMP_FILE")"

    log "Upload offsite : $S3_TARGET"
    UPLOAD_START="$(date +%s)"
    if ! "${AWS_CMD[@]}" s3 cp "$DUMP_FILE" "$S3_TARGET" --only-show-errors; then
        err "Upload S3 a échoué."
        exit 1
    fi
    UPLOAD_DURATION=$(( $(date +%s) - UPLOAD_START ))
    log "Upload offsite OK (${UPLOAD_DURATION}s)"
else
    log "BACKUP_S3_BUCKET non défini — upload offsite ignoré."
fi

# -----------------------------------------------------------------------------
# Rotation locale : supprimer les dumps plus vieux que N jours.
# -----------------------------------------------------------------------------
log "Rotation locale : suppression des dumps > ${BACKUP_RETENTION_DAYS}j dans $BACKUP_DIR"
DELETED_COUNT=0
# -mtime utilise des jours entiers ; on liste, on compte, on supprime.
while IFS= read -r -d '' old; do
    rm -f -- "$old"
    DELETED_COUNT=$(( DELETED_COUNT + 1 ))
done < <(find "$BACKUP_DIR" -maxdepth 1 -type f -name 'rh_primature_*.dump' -mtime "+${BACKUP_RETENTION_DAYS}" -print0)
log "Rotation terminée : ${DELETED_COUNT} dump(s) supprimé(s)"

log "Backup OK"
exit 0
