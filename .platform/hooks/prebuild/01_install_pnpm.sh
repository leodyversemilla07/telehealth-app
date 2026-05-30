#!/bin/bash
set -e

echo "=== Telehealth API — Prebuild: Install pnpm + npm wrapper ==="

# ─── INSTALL COREPACK ───────────────────────────────────────
# Amazon Linux 2023 does NOT include corepack unlike standard
# nodejs.org Node.js distributions. Bootstrap via npm first.
echo "Installing corepack..."
npm install -g corepack

# ─── ENABLE PNPM VIA COREPACK ──────────────────────────────
# 'corepack enable' creates a shim at /usr/bin/pnpm
# 'corepack prepare' downloads the real binary (prevents interactive prompt)
echo "Enabling corepack and installing pnpm..."
corepack enable
corepack prepare pnpm@9.12.3 --activate

# ─── VERIFY INSTALLATION ───────────────────────────────────
if ! command -v pnpm &> /dev/null; then
  echo "ERROR: pnpm installation failed!"
  exit 1
fi
echo "pnpm installed: $(pnpm --version)"

# ─── THE NPM WRAPPER ───────────────────────────────────────
# EB on AL2023 hardcodes `npm --omit=dev install` — can't change it.
# Replace /usr/bin/npm with a wrapper that intercepts install/ci
# and redirects to pnpm. All other npm commands pass through.
#
# CRITICAL: Always restore original npm first (safety net).
echo "Creating npm wrapper..."
if [ -f /usr/bin/npm_original ]; then
  mv /usr/bin/npm_original /usr/bin/npm
fi

mv /usr/bin/npm /usr/bin/npm_original

cat > /usr/bin/npm << 'WRAPPER'
#!/bin/bash
# npm wrapper — intercepts install/ci and redirects to pnpm
for arg in "$@"; do
  case "$arg" in
    install|ci|add)
      echo "[npm-wrapper] Intercepted install → using pnpm"
      pnpm install --frozen-lockfile
      exit $?
      ;;
    rebuild|update|prune|dedupe)
      echo "[npm-wrapper] Intercepted $arg → skipping (pnpm handles this)"
      exit 0
      ;;
  esac
done
# Everything else (--version, run, start, etc) → use original npm
/usr/bin/npm_original "$@"
WRAPPER

chmod +x /usr/bin/npm
echo "npm wrapper created successfully"

echo "=== Prebuild complete ==="
