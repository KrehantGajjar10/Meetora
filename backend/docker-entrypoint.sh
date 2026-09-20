#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL must be set}"

max_attempts="${DB_WAIT_MAX_ATTEMPTS:-30}"
attempt=1

echo "Waiting for PostgreSQL to accept connections..."
while ! pg_isready --dbname="$DATABASE_URL" >/dev/null 2>&1; do
    if [ "$attempt" -ge "$max_attempts" ]; then
        echo "PostgreSQL did not become ready after $max_attempts attempts." >&2
        exit 1
    fi
    attempt=$((attempt + 1))
    sleep 2
done

echo "PostgreSQL is ready. Running database migrations..."
if ! alembic upgrade head; then
    echo "Database migrations failed; refusing to start the API." >&2
    exit 1
fi

echo "Database migrations completed. Starting API..."
exec "$@"
