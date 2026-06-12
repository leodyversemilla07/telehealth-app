/**
 * Development seed script.
 *
 * Creates:
 * - 1 admin user (admin@example.com / Admin123!)
 * - 1 doctor user (doctor@example.com / Doctor123!)
 * - 2 patient users (alice@example.com / Patient123!, bob@example.com / Patient123!)
 *
 * Usage: node --import tsx prisma/seed.ts
 */

import { config } from "dotenv"

config()

if (process.env.NODE_ENV === "production") {
  console.error(
    "Refusing to seed database in production. Set NODE_ENV=development to run seed.",
  )
  process.exit(1)
}

import { PrismaPg } from "@prisma/adapter-pg"
import { hashPassword } from "better-auth/crypto"
import pg from "pg"
import { PrismaClient } from "../src/generated/prisma/client.js"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error("DATABASE_URL is not set")

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

async function upsertUserWithAccount(
  email: string,
  name: string,
  role: "ADMIN" | "DOCTOR" | "PATIENT",
  password: string,
) {
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, emailVerified: true, role },
  })

  const existing = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
  })

  const hash = await hashPassword(password)

  if (existing) {
    await prisma.account.update({
      where: { id: existing.id },
      data: { password: hash },
    })
  } else {
    await prisma.account.create({
      data: {
        userId: user.id,
        providerId: "credential",
        accountId: user.id,
        password: hash,
      },
    })
  }

  return user
}

async function seed() {
  console.log("Seeding database ...")

  // Admin
  const admin = await upsertUserWithAccount(
    "admin@example.com",
    "Admin User",
    "ADMIN",
    "Admin123!",
  )
  console.log(` Admin: ${admin.email} / Admin123!`)

  // Doctor
  const doctor = await upsertUserWithAccount(
    "doctor@example.com",
    "Dr. Maria Santos",
    "DOCTOR",
    "Doctor123!",
  )

  // Doctor profile
  const profile = await prisma.doctorProfile.upsert({
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
  console.log(` Doctor: ${doctor.email} / Doctor123! (approved)`)

  // Patients
  const alice = await upsertUserWithAccount(
    "alice@example.com",
    "Alice Johnson",
    "PATIENT",
    "Patient123!",
  )
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
  console.log(` Patient: ${alice.email} / Patient123!`)

  const bob = await upsertUserWithAccount(
    "bob@example.com",
    "Bob Smith",
    "PATIENT",
    "Patient123!",
  )
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
  console.log(` Patient: ${bob.email} / Patient123!`)

  // Doctor availability (Mon-Fri, 9 AM - 5 PM, 30 min slots)
  await prisma.availabilitySchedule.upsert({
    where: { doctorId: profile.id },
    update: {},
    create: {
      doctorId: profile.id,
      monday: JSON.stringify(["09:00-17:00"]),
      tuesday: JSON.stringify(["09:00-17:00"]),
      wednesday: JSON.stringify(["09:00-17:00"]),
      thursday: JSON.stringify(["09:00-17:00"]),
      friday: JSON.stringify(["09:00-17:00"]),
      slotDuration: 30,
    },
  })
  console.log(" Availability: Mon-Fri 09:00-17:00 (30 min slots)")

  // Sample appointment
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
      doctorId: profile.id,
      scheduleId: (
        await prisma.availabilitySchedule.findUnique({
          where: { doctorId: profile.id },
        })
      )?.id,
      startTime: tomorrow,
      endTime: appointmentEnd,
      status: "CONFIRMED",
      reason: "Annual check-up",
      symptoms: "Mild fever and cough for 3 days",
      type: "VIDEO",
    },
  })
  console.log(" Appointment: Alice -> Dr. Santos")

  console.log("")
  console.log("Seed complete. Credentials:")
  console.log("   admin@example.com  / Admin123!")
  console.log("   doctor@example.com / Doctor123!")
  console.log("   alice@example.com  / Patient123!")
  console.log("   bob@example.com    / Patient123!")
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
