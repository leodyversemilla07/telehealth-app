#!/bin/bash

# Change to the api directory
cd /var/app/current/apps/api || exit 1

# Run prisma migrations
npx prisma migrate deploy

# Change back to root directory
cd /var/app/current || exit 1

# Start the application
exec node apps/api/dist/main.js
