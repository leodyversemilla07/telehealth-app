import { config } from "dotenv"

config()

import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import { PrismaClient } from "../generated/prisma/client.js"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set")
}
const url = new URL(databaseUrl)
const pool = new pg.Pool({
  host: url.hostname,
  port: Number(url.port),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ""),
  max: 1,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function run() {
  const email = process.argv[2] || "admin@test.com"
  console.log(`Promoting ${email} to ADMIN ...`)

  const user = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
  })

  console.log(`Successfully updated role to ADMIN for: ${user.email}`)
}

run()
  .catch((err) => {
    console.error("Failed to promote user:", err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
