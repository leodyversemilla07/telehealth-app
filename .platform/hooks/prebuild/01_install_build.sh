#!/bin/bash
set -e

echo "=== Installing pnpm ==="
npm install -g pnpm@11.3.0

echo "=== Installing dependencies ==="
pnpm install --frozen-lockfile

echo "=== Generating Prisma client ==="
cd apps/api && npx prisma generate && cd ../..

echo "=== Building NestJS API ==="
pnpm --filter api build

echo "=== Running Prisma migrations ==="
cd apps/api && npx prisma migrate deploy && cd ../..

echo "=== Build complete ==="
