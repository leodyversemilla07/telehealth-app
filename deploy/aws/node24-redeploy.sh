#!/usr/bin/env bash
set -e
export PATH=/usr/local/bin:/usr/bin:/bin:/usr/local/sbin
echo "DEPLOY_START user=$(whoami) node=$(node -v) cwd=$PWD"

cd /opt/telehealth
git fetch origin >/dev/null 2>&1
git reset --hard origin/main
echo "HEAD=$(git rev-parse --short HEAD)"

# refresh deps + native modules under Node 24
pnpm install --prefer-offline 2>&1 | tail -4

# free RAM for the build (t3.small)
pm2 stop web 2>&1 | tail -1 || true
pm2 stop api 2>&1 | tail -1 || true

echo "BUILD_START"
pnpm build 2>&1 | tail -6
echo "BUILD_END"

# restart apps (plain restart preserves NODE_ENV/rate-limit config)
pm2 restart api web 2>&1 | tail -2
pm2 save >/dev/null 2>&1 || true
sleep 5

echo "NODE_FINAL=$(node -v)"
pm2 status 2>&1 | head -14 || true

echo "PROBE web=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/ || echo fail)"
echo "PROBE api=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/auth/get-session || echo fail)"
echo "DEPLOY_END"