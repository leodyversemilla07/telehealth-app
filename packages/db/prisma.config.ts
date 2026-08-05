// Prisma 7 CLI config — schema, migrations and seed all live in this package.
// Prisma 7 no longer auto-loads .env; @telehealth/env/load resolves DATABASE_URL
// from the workspace-root .env (+ .env.local), the shell environment, or leaves
// it unset (`prisma generate` works without it; migrate/studio need it set).
import "@telehealth/env/load"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // process.env (not the strict env() helper) so `prisma generate` still works
  // in fresh installs where DATABASE_URL isn't set yet.
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
