import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../generated/prisma/client.js"

// Pass a config object (not a Pool instance) to PrismaPg to avoid a
// version-mismatch bug: @prisma/adapter-pg bundles its own pg version,
// so `instanceof pg.Pool` fails and the adapter treats the Pool as a
// flat config object, passing the pool's `.options` (an Object) as the
// PostgreSQL `options` startup parameter, which crashes on Node.js 22
// (Buffer.byteLength strict validation).
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required")
}
const url = new URL(databaseUrl)
const prismaPgAdapter = new PrismaPg({
  host: url.hostname,
  port: Number(url.port),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ""),
})

/**
 * Single shared PrismaClient instance.
 * Prisma docs: "Create one instance of PrismaClient and re-use it across
 * your application." Each instance creates its own connection pool, so
 * multiple instances can exhaust the database connection limit.
 *
 * @see https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections
 */
export const prisma = new PrismaClient({ adapter: prismaPgAdapter })
