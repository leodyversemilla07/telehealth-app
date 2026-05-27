/**
 * Development seed script.
 *
 * Creates:
 * - 1 admin user (admin@example.com)
 * - 1 doctor user (doctor@example.com)
 * - 2 standard patient users
 *
 * Usage: node --import tsx prisma/seed.ts
 *
 * Prerequisites:
 * - PostgreSQL running (docker compose up -d)
 * - Migrations applied
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
  console.log(` ✓ Admin: ${admin.email}`)

  // Doctor
  const doctor = await prisma.user.upsert({
    where: { email: "doctor@example.com" },
    update: {},
    create: {
      email: "doctor@example.com",
      name: "Dr. Maria Santos",
      emailVerified: true,
      role: "DOCTOR",
    },
  })

  // Create a doctor profile for the doctor
  await prisma.doctorProfile.upsert({
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
  console.log(` ✓ Doctor: ${doctor.email} (approved)`)

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
      phone: "+639****6789",
      weight: 55,
      height: 160,
      medicalHistory: {
        allergies: ["Penicillin"],
        conditions: ["Asthma"],
        medications: ["Albuterol inhaler"],
      },
    },
  })
  console.log(` ✓ Patient: ${alice.email}`)

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
      phone: "+639****4321",
      weight: 72,
      height: 175,
      medicalHistory: {
        allergies: [],
        conditions: ["Hypertension"],
        medications: ["Amlodipine 5mg"],
      },
    },
  })
  console.log(` ✓ Patient: ${bob.email}`)

  // Doctor availability (Mon-Fri, 9 AM - 5 PM, 30 min slots)
  const doctorProfile = await prisma.doctorProfile.findUniqueOrThrow({
    where: { userId: doctor.id },
  })

  const schedule = await prisma.availabilitySchedule.upsert({
    where: { doctorId: doctorProfile.id },
    update: {},
    create: {
      doctorId: doctorProfile.id,
      monday: JSON.stringify(["09:00-17:00"]),
      tuesday: JSON.stringify(["09:00-17:00"]),
      wednesday: JSON.stringify(["09:00-17:00"]),
      thursday: JSON.stringify(["09:00-17:00"]),
      friday: JSON.stringify(["09:00-17:00"]),
      slotDuration: 30,
    },
  })
  console.log(" ✓ Availability: Mon-Fri 09:00-17:00 (30 min slots)")

  // Sample appointment for tomorrow at 10:00 AM
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)
  const appointmentEnd = new Date(tomorrow)
  appointmentEnd.setHours(10, 30, 0, 0)

  await prisma.appointment.upsert({
    where: { id: "seed-appointment-1" },
    update: {},
    create: {
      id: "seed-appointment-1",
      patientId: alice.id,
      doctorId: doctorProfile.id,
      scheduleId: schedule.id,
      startTime: tomorrow,
      endTime: appointmentEnd,
      status: "CONFIRMED",
      reason: "Annual check-up",
      symptoms: "Mild fever and cough for 3 days",
      type: "VIDEO",
    },
  })
  console.log(
    ` ✓ Appointment: Alice -> Dr. Santos (${tomorrow.toLocaleDateString()} 10:00-10:30)`,
  )

  console.log("")
  console.log("✅ Seed complete. Users (set passwords via sign-up UI):")
  console.log(" admin@example.com — Administrator")
  console.log(" doctor@example.com — Doctor (pre-approved)")
  console.log(" alice@example.com — Patient")
  console.log(" bob@example.com — Patient")
}

seed()
  .catch((err) => {
    console.error("❌ Seed failed:", err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
