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

# Install pnpm directly
RUN npm install -g pnpm@11.3.0

WORKDIR /app

# Only prod dependencies
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/generated ./apps/api/generated
COPY --from=builder /app/packages ./packages

# Copy RDS CA bundle for SSL connections
COPY apps/api/certs/rds-ca-bundle.pem ./apps/api/certs/rds-ca-bundle.pem

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "apps/api/dist/src/main.js"]
