# ──────────────────────────────────────────────────────────────
# Builder stage
# ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# Install pnpm directly (more reliable than corepack on Alpine)
RUN npm install -g pnpm@11.3.0

WORKDIR /app

# Install dependencies (dependency layer is cached separately)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/prisma/schema.prisma apps/api/prisma/schema.prisma
RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/api apps/api
COPY packages packages
COPY turbo.json biome.json ./

# Copy RDS CA bundle for SSL
COPY apps/api/certs apps/api/certs

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build
RUN pnpm --filter api build

# ──────────────────────────────────────────────────────────────
# Production stage
# ──────────────────────────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

# Copy all node_modules from builder (pnpm workspace resolution needs full tree)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/generated ./apps/api/generated
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/packages ./packages

# Copy RDS CA bundle for SSL connections
COPY apps/api/certs/rds-ca-bundle.pem ./apps/api/certs/rds-ca-bundle.pem

# Copy root package files for pnpm workspace resolution
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "apps/api/dist/src/main.js"]
