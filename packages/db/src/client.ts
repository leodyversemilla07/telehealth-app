import "@telehealth/env/load"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../generated/prisma/client.js"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required")
}
// RDS requires TLS (pg_hba rejects "no encryption"). Prisma's CLI enables
// SSL automatically for remote hosts, but the driver adapter must be told
// explicitly. Enable TLS for any non-localhost host (or ?sslmode=require).
const url = new URL(databaseUrl)
const sslMode = url.searchParams.get("sslmode")
const isRemote = !["localhost", "127.0.0.1"].includes(url.hostname)
const ssl =
  sslMode === "require" ||
  sslMode === "prefer" ||
  (sslMode === null && isRemote)
// Pass a config object (connectionString) rather than a pg.Pool instance to
// avoid a version-mismatch bug: @prisma/adapter-pg bundles its own pg version,
// so `instanceof pg.Pool` fails and a Pool is treated as a flat config object.
const prismaPgAdapter = new PrismaPg({
  connectionString: databaseUrl,
  ...(ssl ? { ssl: { rejectUnauthorized: false } } : {}),
})

/**
 * Single shared PrismaClient instance (docs-standard singleton export).
 * Prisma docs: "Create one instance of PrismaClient and re-use it across
 * your application." Each instance creates its own connection pool, so
 * multiple instances can exhaust the database connection limit.
 *
 * @see https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections
 */
export const prisma = new PrismaClient({ adapter: prismaPgAdapter })
