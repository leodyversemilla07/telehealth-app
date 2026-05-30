FROM alpine/git AS clone
RUN git clone --depth 1 --branch main https://github.com/leodyversemilla07/telehealth-app.git /repo

FROM node:22-alpine AS builder

RUN npm install -g pnpm@11.3.0

WORKDIR /app

COPY --from=clone /repo/pnpm-lock.yaml /repo/pnpm-workspace.yaml /repo/package.json ./
COPY --from=clone /repo/apps/api/package.json apps/api/package.json
COPY --from=clone /repo/packages/shared/package.json packages/shared/package.json
COPY --from=clone /repo/apps/api/prisma/schema.prisma apps/api/prisma/schema.prisma
RUN pnpm install --frozen-lockfile

COPY --from=clone /repo/apps/api apps/api
COPY --from=clone /repo/packages packages
COPY --from=clone /repo/turbo.json /repo/biome.json ./
COPY --from=clone /repo/apps/api/certs apps/api/certs

RUN cd apps/api && npx prisma generate

RUN pnpm --filter @workspace/shared build
RUN pnpm --filter api build

FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/src/generated ./apps/api/src/generated
COPY --from=builder /app/apps/api/src/generated ./apps/api/dist/src/generated
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/certs/rds-ca-bundle.pem ./apps/api/certs/rds-ca-bundle.pem
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["sh", "-c", "npx prisma migrate deploy && node apps/api/dist/src/main.js"]
