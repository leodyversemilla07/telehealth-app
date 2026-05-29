import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import { PrismaClient } from "../generated/prisma/client.js"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const apptId = process.argv[2] || "cmpqfsdvy0000boiehhifasym"

  const consultation = await prisma.consultation.findUnique({
    where: { appointmentId: apptId },
  })
  console.log("Consultation exists:", !!consultation)

  if (consultation) {
    await prisma.prescription.deleteMany({
      where: { consultationId: consultation.id },
    })
    await prisma.consultation.delete({ where: { id: consultation.id } })
    console.log("Deleted consultation record")
  }

  await prisma.appointment.update({
    where: { id: apptId },
    data: { status: "CONFIRMED", roomUrl: null },
  })
  console.log("Reset appointment to CONFIRMED")
}

main().finally(() => prisma.$disconnect())
