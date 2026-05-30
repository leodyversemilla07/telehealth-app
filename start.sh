#!/bin/bash

set -e

# Install dependencies if node_modules is missing
if [ ! -d "/var/app/current/node_modules" ]; then
  echo "=== Installing dependencies ==="
  cd /var/app/current
  npm install --omit=dev
fi

# Change to the api directory
cd /var/app/current/apps/api || exit 1

# Run prisma migrations (ignore errors if already applied)
echo "=== Running prisma migrate deploy ==="
npx prisma migrate deploy || echo "Migration may have already been applied"

# Change back to root directory  
cd /var/app/current || exit 1

# Start the application
exec node apps/api/dist/main.js
