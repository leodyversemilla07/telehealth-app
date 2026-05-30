#!/bin/bash
set -e

echo "=== Telehealth API — Predeploy: Build application ==="

cd /var/app/staging

# ─── STEP 1: Build workspace dependencies FIRST ────────────
echo "=== Building @workspace/shared ==="
pnpm --filter @workspace/shared build

# ─── STEP 2: Generate Prisma client ────────────────────────
echo "=== Generating Prisma client ==="
cd /var/app/staging/apps/api
pnpm exec prisma generate

# ─── STEP 3: Build NestJS API ──────────────────────────────
echo "=== Building NestJS API ==="
cd /var/app/staging
pnpm --filter api build

echo "=== Build complete ==="
