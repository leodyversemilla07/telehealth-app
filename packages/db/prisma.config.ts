// Prisma 7 CLI config — schema, migrations and seed all live in this package.
// The connection URL comes from DATABASE_URL: either a packages/db/.env,
// the API's .env, the repo root .env, or the shell environment.
import { config as loadEnv } from "dotenv"
import { defineConfig } from "prisma/config"

loadEnv({ path: [".env", "../apps/api/.env", "../.env"] })

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
