# =============================================================================
# Telehealth App — Production Dockerfile (Multi-stage build)
# =============================================================================

# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

WORKDIR /app

# Copy package files first (for better caching)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/prisma/schema.prisma apps/api/prisma/schema.prisma

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# Copy source code
COPY apps/api apps/api
COPY packages packages
COPY turbo.json biome.json ./

# Generate Prisma Client
RUN cd apps/api && npx prisma generate

# Build API
RUN pnpm --filter api build

# ── Stage 2: Production ────────────────────────────────────────────────────
FROM node:22-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

# Copy only production dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy built files
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/src/generated ./apps/api/src/generated
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/packages ./packages

# Copy root package files (needed for pnpm workspace)
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Copy RDS CA bundle (if using RDS)
COPY apps/api/certs/rds-ca-bundle.pem ./apps/api/certs/rds-ca-bundle.pem

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app

# Set ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3001

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ || exit 1

# Use dumb-init to handle PID 1 and signal forwarding
ENTRYPOINT ["dumb-init", "--"]

# Run migrations then start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node apps/api/dist/src/main.js"]
