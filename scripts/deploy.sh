#!/usr/bin/env bash
set -euo pipefail

# Package monorepo apps for AWS Elastic Beanstalk
#
# Usage:
#   ./scripts/deploy.sh api    → dist/deploy/api-deploy.zip
#   ./scripts/deploy.sh web    → dist/deploy/web-deploy.zip
#   ./scripts/deploy.sh all    → both zips

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-all}"

if [[ "$TARGET" == "-h" || "$TARGET" == "--help" ]]; then
  sed -n '2,7p' "$0"
  exit 0
fi

cd "$ROOT"

# Build everything first
echo "→ Building monorepo ..."
pnpm run build

package() {
  local name="$1"       # api or web
  local dir="$2"        # source directory under apps/
  shift 2
  local extra="$@"      # extra files/dirs relative to apps/$name/

  local tmp="$ROOT/tmp/eb-$name"
  rm -rf "$tmp" && mkdir -p "$tmp"
  mkdir -p "$ROOT/dist/deploy"

  # Copy app source
  for item in dist .next public package.json Procfile .ebextensions $extra; do
    if [[ -e "apps/$name/$item" ]]; then
      cp -r "apps/$name/$item" "$tmp/"
    fi
  done

  # Copy workspace dependencies
  mkdir -p "$tmp/packages"
  for pkg in shared typescript-config; do
    if [[ -d "packages/$pkg" ]]; then
      mkdir -p "$tmp/packages/$pkg"
      cp -r "packages/$pkg/dist" "$tmp/packages/$pkg/" 2>/dev/null || true
      cp -r "packages/$pkg/package.json" "$tmp/packages/$pkg/"
    fi
  done

  # Install production dependencies
  cd "$tmp"
  npm install --production --legacy-peer-deps 2>/dev/null || npm install --production
  cd "$ROOT"

  # Zip
  cd "$tmp"
  zip -r "$ROOT/dist/deploy/$name-deploy.zip" . -x "node_modules/.cache/**"
  cd "$ROOT"
  rm -rf tmp

  echo "   ✓ dist/deploy/$name-deploy.zip"
}

mkdir -p "$ROOT/dist/deploy"

case "$TARGET" in
  api)
    package "api" "api" "generated paths-register.js"
    ;;
  web)
    package "web" "web" "next.config.mjs next-env.d.ts"
    ;;
  all)
    package "api" "api" "generated paths-register.js"
    package "web" "web" "next.config.mjs next-env.d.ts"
    ;;
  *)
    echo "Usage: $0 [api|web|all]"
    exit 1
    ;;
esac

echo "✓ Done – upload the .zip to Elastic Beanstalk"