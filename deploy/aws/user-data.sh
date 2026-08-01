#!/bin/bash
# Telehealth EC2 bootstrap — runs once at first boot as root (cloud-init)
set -euxo pipefail

exec > /var/log/telehealth-userdata.log 2>&1

echo "=== [1/7] swap file (build safety on t3.small) ==="
fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

echo "=== [2/7] system packages ==="
apt-get update -y
apt-get install -y curl git ca-certificates nginx unzip

echo "=== [3/7] Node.js 22 + pnpm 11 + pm2 ==="
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
corepack enable || true
corepack prepare pnpm@11.4.0 --activate || npm i -g pnpm@11.4.0
npm i -g pm2

node -v && pnpm -v && pm2 -v

echo "=== [4/7] clone repo (public) ==="
rm -rf /opt/telehealth
git clone --depth 1 https://github.com/leodyversemilla07/telehealth-app.git /opt/telehealth
cd /opt/telehealth

echo "=== [5/7] pnpm install (prisma generate runs via postinstall) ==="
pnpm install --frozen-lockfile

echo "=== [6/7] build (turbo: api + web + packages) ==="
pnpm build

echo "=== [7/7] done ==="
touch /opt/telehealth/.provisioned
chown -R ubuntu:ubuntu /opt/telehealth
echo "BOOTSTRAP COMPLETE"
