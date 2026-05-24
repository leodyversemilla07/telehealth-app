/**
 * Development seed script.
 *
 * Creates:
 *   - 1 admin user (admin@example.com)
 *   - 2 standard users
 *
 * Usage: node --import tsx prisma/seed.ts
 *
 * Prerequisites:
 *   - PostgreSQL running (docker compose up -d)
 *   - Migrations applied
 */

import { config } from "dotenv"
config()

import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import { PrismaClient } from "../generated/prisma/client.js"

const url = new URL(process.env.DATABASE_URL!)
const pool = new pg.Pool({
  host: url.hostname,
  port: Number(url.port),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ""),
  max: 5,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function seed() {
  console.log("🌱 Seeding database ...")

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      emailVerified: true,
      role: "ADMIN",
    },
  })
  console.log(`  ✓ Admin: ${admin.email}`)

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      name: "Alice Johnson",
      emailVerified: true,
      role: "USER",
    },
  })
  console.log(`  ✓ User: ${alice.email}`)

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      email: "bob@example.com",
      name: "Bob Smith",
      emailVerified: true,
      role: "USER",
    },
  })
  console.log(`  ✓ User: ${bob.email}`)

  console.log("")
  console.log("✅ Seed complete. Users (set passwords via sign-up UI):")
  console.log("   admin@example.com — alice@example.com — bob@example.com")
}

seed()
  .catch((err) => {
    console.error("❌ Seed failed:", err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())