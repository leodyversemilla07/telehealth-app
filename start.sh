#!/bin/bash
set -e

# Debug: log env vars available to the process (mask sensitive values)
DEBUG_LOG="/var/log/startup-debug.log"
echo "=== start.sh debug $(date) ===" > "$DEBUG_LOG"
echo "DATABASE_URL is set: $([ -n \"$DATABASE_URL\" ] && echo 'YES' || echo 'NO')" >> "$DEBUG_LOG"
echo "DATABASE_URL prefix: $(echo \"$DATABASE_URL\" | cut -c1-30)..." >> "$DEBUG_LOG"
echo "BETTER_AUTH_SECRET is set: $([ -n \"$BETTER_AUTH_SECRET\" ] && echo 'YES' || echo 'NO')" >> "$DEBUG_LOG"
echo "NODE_ENV: $NODE_ENV" >> "$DEBUG_LOG"
echo "PORT: $PORT" >> "$DEBUG_LOG"
echo "CORS_ORIGIN: $CORS_ORIGIN" >> "$DEBUG_LOG"
echo "SMTP_USER is set: $([ -n \"$SMTP_USER\" ] && echo 'YES' || echo 'NO')" >> "$DEBUG_LOG"
echo "LIVEKIT_API_KEY is set: $([ -n \"$LIVEKIT_API_KEY\" ] && echo 'YES' || echo 'NO')" >> "$DEBUG_LOG"
echo "BETTER_AUTH_URL: $BETTER_AUTH_URL" >> "$DEBUG_LOG"
echo "--- All env keys containing KEY/URL/SECRET/PASS ---" >> "$DEBUG_LOG"
env | grep -iE '(KEY|URL|SECRET|PASS|SMTP|LIVEKIT|DATABASE|VAPID|NIM|CORS|AUTH|PORT|NODE)' | sed 's/\(.\{20\}\).\{20\}/\1***MASKED***/' >> "$DEBUG_LOG"

# Run prisma migrations then start the app
cd /var/app/current/apps/api
npx prisma migrate deploy 2>&1 | tee -a "$DEBUG_LOG"
cd /var/app/current
exec node apps/api/dist/main.js
