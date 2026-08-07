#!/usr/bin/env bash
# Dumps the CRM's Postgres database to a timestamped, gzipped file.
# Runs pg_dump inside the running postgres container, so no local
# postgres client install is required — just Docker.
#
# Usage:
#   ./scripts/backup-db.sh                 # backup, keep last 14
#   RETENTION_DAYS=30 ./scripts/backup-db.sh
#
# Schedule daily backups with cron, e.g.:
#   0 2 * * * cd /path/to/indiamart-crm && ./scripts/backup-db.sh >> db-backups/backup.log 2>&1

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

POSTGRES_USER="${POSTGRES_USER:-crm}"
POSTGRES_DB="${POSTGRES_DB:-indiamart_crm}"
COMPOSE_SERVICE="${COMPOSE_SERVICE:-postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
BACKUP_DIR="$REPO_ROOT/db-backups"

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUT_FILE="$BACKUP_DIR/${POSTGRES_DB}_${TIMESTAMP}.sql.gz"

echo "Backing up '$POSTGRES_DB' from the '$COMPOSE_SERVICE' container..."
docker compose exec -T "$COMPOSE_SERVICE" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$OUT_FILE"

echo "Backup written to $OUT_FILE ($(du -h "$OUT_FILE" | cut -f1))"

echo "Pruning backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "${POSTGRES_DB}_*.sql.gz" -mtime "+${RETENTION_DAYS}" -print -delete

echo "Done."
