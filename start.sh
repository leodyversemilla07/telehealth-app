#!/bin/bash

# Change to the api directory
cd /var/app/current/apps/api || exit 1

# Log the DATABASE_URL being used (masked)
echo "=== Starting at $(date) ==="
echo "DATABASE_URL is set: $([ -n "$DATABASE_URL" ] && echo 'YES' || echo 'NO')"
echo "DATABASE_URL prefix: ${DATABASE_URL%%:*}"

# Run prisma migrations with output
echo "=== Running prisma migrate deploy ==="
npx prisma migrate deploy 2>&1 | tee /var/log/prisma-migrate.log
MIGRATE_EXIT_CODE=${PIPESTATUS[0]}

echo "=== Prisma migrate exit code: $MIGRATE_EXIT_CODE ==="
echo "=== Migration log contents ==="
cat /var/log/prisma-migrate.log

# Change back to root directory
cd /var/app/current || exit 1

# Start the application
exec node apps/api/dist/main.js
