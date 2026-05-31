import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import { PrismaClient } from "../generated/prisma/client.js"

const isRds = process.env.DATABASE_URL?.includes("rds.amazonaws.com")

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isRds
    ? {
        rejectUnauthorized: false,
      }
    : undefined,
})

const prismaPgAdapter = new PrismaPg(pool)

/**
 * Single shared PrismaClient instance.
 * Prisma docs: "Create one instance of PrismaClient and re-use it across
 * your application." Each instance creates its own connection pool, so
 * multiple instances can exhaust the database connection limit.
 *
 * @see https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections
 */
export const prisma = new PrismaClient({ adapter: prismaPgAdapter })
