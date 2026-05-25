/**
 * Development seed script.
 *
 * Creates:
 *   - 1 admin user (admin@example.com)
 *   - 1 provider user (doctor@example.com)
 *   - 2 standard patient users
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
  max: 5,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function seed() {
  console.log("🌱 Seeding database ...")

  // Admin
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

  // Provider
  const doctor = await prisma.user.upsert({
    where: { email: "doctor@example.com" },
    update: {},
    create: {
      email: "doctor@example.com",
      name: "Dr. Maria Santos",
      emailVerified: true,
      role: "PROVIDER",
    },
  })

  // Create a provider profile for the doctor
  await prisma.providerProfile.upsert({
    where: { userId: doctor.id },
    update: {},
    create: {
      userId: doctor.id,
      specialty: "General Practice",
      prcLicenseNumber: "PRC-123456",
      prcLicenseExpiry: new Date("2027-12-31"),
      philhealthAccreditation: "PHAC-001",
      bio: "Experienced general practitioner with over 10 years of clinical practice.",
      clinicAddress: "123 Medical Plaza, Makati City",
      pricePerVisit: 500,
      isApproved: true,
    },
  })
  console.log(`  ✓ Provider: ${doctor.email} (approved)`)

  // Patients
  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      name: "Alice Johnson",
      emailVerified: true,
      role: "PATIENT",
    },
  })

  await prisma.patientProfile.upsert({
    where: { userId: alice.id },
    update: {},
    create: {
      userId: alice.id,
      phone: "+639123456789",
    },
  })
  console.log(`  ✓ Patient: ${alice.email}`)

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      email: "bob@example.com",
      name: "Bob Smith",
      emailVerified: true,
      role: "PATIENT",
    },
  })

  await prisma.patientProfile.upsert({
    where: { userId: bob.id },
    update: {},
    create: {
      userId: bob.id,
      phone: "+639987654321",
    },
  })
  console.log(`  ✓ Patient: ${bob.email}`)

  console.log("")
  console.log("✅ Seed complete. Users (set passwords via sign-up UI):")
  console.log("   admin@example.com   — Administrator")
  console.log("   doctor@example.com  — Provider (pre-approved)")
  console.log("   alice@example.com   — Patient")
  console.log("   bob@example.com     — Patient")
}

seed()
  .catch((err) => {
    console.error("❌ Seed failed:", err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
