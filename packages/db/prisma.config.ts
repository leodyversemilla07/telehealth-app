// Prisma 7 CLI config — schema, migrations and seed all live in this package.
// Prisma 7 no longer auto-loads .env; we resolve DATABASE_URL from
// packages/db/.env, the API's .env, the repo root .env, or the shell env.
import { config as loadEnv } from "dotenv"
import { defineConfig } from "prisma/config"

loadEnv({ path: [".env", "../apps/api/.env", "../.env"] })

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // process.env (not the strict env() helper) so `prisma generate` still
  // works in fresh installs where DATABASE_URL isn't set yet; migrate/studio
  // read it from packages/db/.env, apps/api/.env, or the shell env.
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
