import { afterAll, beforeAll, describe, expect, it } from "@jest/globals"
import { type INestApplication, ValidationPipe } from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import type { PrismaClient } from "@telehealth/db"
import { AppRouterHost } from "nestjs-trpc"
import request from "supertest"
import type { App } from "supertest/types"
import { mockGetSession } from "./mocks/telehealth-auth"

/**
 * FULL-STACK e2e against a REAL Postgres (docker-compose, CI postgres
 * service): real PrismaClient → real queries → real schema. The only mocked
 * layer is better-auth (ESM-only under jest) — sessions are injected through
 * the guard so the app's own services/REST surface run against the database
 * for real.
 *
 * DATABASE_URL is forced here (never borrowed from the workspace .env, which
 * points at the dev database): CI sets TELEHEALTH_E2E_DB_URL to its postgres
 * service URL; locally the docker-compose postgres on :5433 is used.
 * These env lines MUST run before the first import of @telehealth/db, so the
 * prisma singleton is built with the typed URLs (dynamic imports below).
 */
process.env.TELEHEALTH_E2E_DB_URL ??=
  "postgresql://postgres:postgres@localhost:5433/telehealth?schema=public"
process.env.DATABASE_URL = process.env.TELEHEALTH_E2E_DB_URL
process.env.BETTER_AUTH_SECRET ??=
  "test-secret-0123456789abcdef0123456789abcdef"
process.env.BETTER_AUTH_URL ??= "http://localhost:3001"
process.env.API_URL ??= "http://localhost:3001"

describe("API (e2e) — full AppModule, real Postgres", () => {
  let app: INestApplication<App>
  let prisma: PrismaClient
  let patientUserId: string
  let doctorUserId: string
  let doctorProfileId: string
  let scheduleId: string

  beforeAll(async () => {
    const { prisma: db } = await import("@telehealth/db")
    prisma = db

    // Fresh rows for this run; truncate what the previous run left behind.
    await prisma.notification.deleteMany()
    await prisma.user.deleteMany()

    await prisma.user.create({
      data: {
        email: "admin@e2e.ph",
        name: "E2E Admin",
        role: "ADMIN",
        emailVerified: true,
      },
    })
    await prisma.user.create({
      data: {
        email: "patient@e2e.ph",
        name: "E2E Patient",
        role: "PATIENT",
        emailVerified: true,
      },
    })
    const patient = await prisma.user.findUniqueOrThrow({
      where: { email: "patient@e2e.ph" },
    })
    patientUserId = patient.id
    await prisma.patientProfile.create({ data: { userId: patientUserId } })

    await prisma.user.create({
      data: {
        email: "doctor@e2e.ph",
        name: "Dr. E2E Onesimo",
        role: "DOCTOR",
        emailVerified: true,
      },
    })
    const doctor = await prisma.user.findUniqueOrThrow({
      where: { email: "doctor@e2e.ph" },
    })
    doctorUserId = doctor.id
    const doctorProfile = await prisma.doctorProfile.create({
      data: {
        userId: doctorUserId,
        specialty: "General Practice",
        prcLicenseNumber: "E2E-0001",
        prcLicenseExpiry: new Date("2030-12-31"),
        pricePerVisit: 5000,
        isApproved: true,
        isVerified: true,
      },
    })
    doctorProfileId = doctorProfile.id
    const schedule = await prisma.availabilitySchedule.create({
      data: {
        doctorId: doctorProfileId,
        monday: JSON.stringify(["00:00-24:00"]),
        tuesday: JSON.stringify(["00:00-24:00"]),
        wednesday: JSON.stringify(["00:00-24:00"]),
        thursday: JSON.stringify(["00:00-24:00"]),
        friday: JSON.stringify(["00:00-24:00"]),
        saturday: JSON.stringify(["00:00-24:00"]),
        sunday: JSON.stringify(["00:00-24:00"]),
        slotDuration: 60,
      },
    })
    scheduleId = schedule.id

    await prisma.notification.create({
      data: {
        userId: patientUserId,
        type: "APPOINTMENT_REMINDER",
        title: "Consultation tomorrow",
        body: "Dr. Santos at 09:00",
      },
    })

    const { AppModule } = await import("../src/app.module")
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication({ bodyParser: false })
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    await app.init()
  })

  afterAll(async () => {
    await app?.close()
    await prisma.notification.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  it("runs the health probe against the real database (SELECT 1)", async () => {
    const res = await request(app.getHttpServer()).get("/").expect(200)

    expect(res.body).toMatchObject({ status: "ok" })
    expect(res.body.database).toMatchObject({ status: "healthy" })
  })

  it("mounts the auth handler probe", async () => {
    await request(app.getHttpServer()).get("/auth/ok").expect(200)
  })

  it("rejects unauthenticated admin requests (401)", async () => {
    mockGetSession.mockResolvedValueOnce(null)
    await request(app.getHttpServer()).get("/admin/users").expect(401)
  })

  it("forbids non-admin roles on the admin area (403)", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: "patient-1", role: "PATIENT" },
    })
    await request(app.getHttpServer()).get("/admin/users").expect(403)
  })

  it("serves the real user rows to an admin (200)", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: "admin-1", role: "ADMIN" },
    })
    const res = await request(app.getHttpServer())
      .get("/admin/users?limit=50")
      .expect(200)

    expect(res.body.total).toBe(3)
    const emails = res.body.items.map((u: { email: string }) => u.email)
    expect(emails).toContain("admin@e2e.ph")
    expect(emails).toContain("patient@e2e.ph")
    expect(emails).toContain("doctor@e2e.ph")
  })

  it("drives real notifications through the app's service", async () => {
    const { NotificationsService } = await import(
      "../src/notifications/notifications.service"
    )
    const svc = app.get(NotificationsService)
    const patient = await prisma.user.findUniqueOrThrow({
      where: { email: "patient@e2e.ph" },
    })

    const created = await prisma.notification.create({
      data: { userId: patient.id, type: "SYSTEM", title: "Second" },
    })

    const list = await svc.getNotifications(patient.id, {})
    expect(list.total).toBe(2)

    await svc.markAsRead(patient.id, created.id)
    const after = await prisma.notification.findUniqueOrThrow({
      where: { id: created.id },
    })
    expect(after.isRead).toBe(true)

    await expect(svc.markAsRead(patient.id, "missing-id")).rejects.toThrow(
      "Notification not found",
    )
  })
  describe("appointment booking (real DB)", () => {
    const HOUR = 3_600_000

    let routerHost: {
      appRouter: {
        createCaller: (ctx: unknown) => {
          appointments: {
            create: (input: object) => Promise<{ id: string; status: string }>
            cancel: (input: { id: string }) => Promise<{ status: string }>
            updateStatus: (input: {
              id: string
              status: string
            }) => Promise<unknown>
          }
          availability: {
            setAvailability: (input: object) => Promise<unknown>
          }
        }
      }
    }

    beforeAll(() => {
      routerHost = app.get(AppRouterHost) as typeof routerHost
    })

    const patientCtx = () => ({
      session: {
        user: {
          id: patientUserId,
          name: "E2E Patient",
          email: "patient@e2e.ph",
          role: "PATIENT",
        },
        session: { id: "sess-patient", expiresAt: new Date(Date.now() + HOUR) },
      },
    })

    const doctorCtx = () => ({
      session: {
        user: {
          id: doctorUserId,
          name: "Dr. E2E Onesimo",
          email: "doctor@e2e.ph",
          role: "DOCTOR",
          twoFactorEnabled: true,
        },
        session: { id: "sess-doctor", expiresAt: new Date(Date.now() + HOUR) },
      },
    })

    /**
     * Deterministic slot: UTC 04:00 -> PHT 12:00-13:00, daysAhead days out.
     * PHT midday avoids the service's PHT-midnight edge (a window ending at
     * 24:00 PHT computes phtEndMinutes = 0 -> negative duration -> false).
     * jitterMin shifts the start to break 60-min alignment for rejects.
     */
    function slot(daysAhead: number, jitterMin = 0) {
      const now = new Date()
      const startMs =
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + daysAhead,
          4,
          0,
          0,
        ) +
        jitterMin * 60_000
      return {
        startTime: new Date(startMs).toISOString(),
        endTime: new Date(startMs + 60 * 60_000).toISOString(),
      }
    }

    /** Slot that ends exactly at PHT midnight: UTC 15:00 -> PHT 23:00-24:00. */
    function slotMidnight(daysAhead: number) {
      const now = new Date()
      const startMs = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + daysAhead,
        15,
        0,
        0,
      )
      return {
        startTime: new Date(startMs).toISOString(),
        endTime: new Date(startMs + 60 * 60_000).toISOString(),
      }
    }

    it("books an appointment through the tRPC router against the real DB", async () => {
      const caller = routerHost.appRouter.createCaller(patientCtx())
      const appt = await caller.appointments.create({
        doctorId: doctorProfileId,
        scheduleId,
        ...slot(2),
        reason: "Annual checkup",
        type: "VIDEO",
      })

      expect(appt.status).toBe("BOOKED")
      const row = await prisma.appointment.findUniqueOrThrow({
        where: { id: appt.id },
      })
      expect(row.patientId).toBe(patientUserId)
      expect(row.doctorId).toBe(doctorProfileId)
    })

    it("rejects double-booking of the same slot (CONFLICT)", async () => {
      const caller = routerHost.appRouter.createCaller(patientCtx())
      const times = slot(3)
      await caller.appointments.create({
        doctorId: doctorProfileId,
        scheduleId,
        ...times,
      })

      await expect(
        caller.appointments.create({
          doctorId: doctorProfileId,
          scheduleId,
          ...times,
        }),
      ).rejects.toMatchObject({ code: "CONFLICT" })
    })

    it("rejects a time outside the doctor's availability", async () => {
      const caller = routerHost.appRouter.createCaller(patientCtx())
      await expect(
        caller.appointments.create({
          doctorId: doctorProfileId,
          scheduleId,
          ...slot(4, 13), // 13 minutes past the hour -> not 60-min aligned
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" })
    })

    it("blocks booking by a non-patient role (FORBIDDEN)", async () => {
      const caller = routerHost.appRouter.createCaller(doctorCtx())
      await expect(
        caller.appointments.create({
          doctorId: doctorProfileId,
          scheduleId,
          ...slot(5),
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" })
    })

    it("rejects anonymous booking (UNAUTHORIZED)", async () => {
      const caller = routerHost.appRouter.createCaller({ session: null })
      await expect(
        caller.appointments.create({
          doctorId: doctorProfileId,
          scheduleId,
          ...slot(6),
        }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" })
    })

    it("lets a patient cancel at least 24h ahead", async () => {
      const caller = routerHost.appRouter.createCaller(patientCtx())
      const appt = await caller.appointments.create({
        doctorId: doctorProfileId,
        scheduleId,
        ...slot(7), // 7 days out -> well outside the cancellation window
      })

      const cancelled = await caller.appointments.cancel({ id: appt.id })
      expect(cancelled.status).toBe("CANCELLED")
      const row = await prisma.appointment.findUniqueOrThrow({
        where: { id: appt.id },
      })
      expect(row.status).toBe("CANCELLED")
    })

    it("blocks patient cancellation inside the 24h window", async () => {
      const caller = routerHost.appRouter.createCaller(patientCtx())
      const now = new Date()
      const start = Math.ceil(now.getTime() / HOUR) * HOUR + 2 * HOUR // ~2h out
      const appt = await caller.appointments.create({
        doctorId: doctorProfileId,
        scheduleId,
        startTime: new Date(start).toISOString(),
        endTime: new Date(start + 60 * 60_000).toISOString(),
      })

      await expect(
        caller.appointments.cancel({ id: appt.id }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("at least 24 hours"),
      })
    })

    it("books a slot ending exactly at PHT midnight (24:00 wrap fix)", async () => {
      const caller = routerHost.appRouter.createCaller(patientCtx())
      const appt = await caller.appointments.create({
        doctorId: doctorProfileId,
        scheduleId,
        ...slotMidnight(3), // PHT 23:00-24:00
      })

      expect(appt.status).toBe("BOOKED")
      const row = await prisma.appointment.findUniqueOrThrow({
        where: { id: appt.id },
      })
      expect(row.status).toBe("BOOKED")
    })

    it("rejects a malformed schedule window at write time (valid JSON, not an array)", async () => {
      const caller = routerHost.appRouter.createCaller(doctorCtx())
      await expect(
        caller.availability.setAvailability({ monday: '"09:00-17:00"' }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("HH:MM"),
      })
    })

    it("rejects an out-of-range window inside an otherwise valid array", async () => {
      const caller = routerHost.appRouter.createCaller(doctorCtx())
      await expect(
        caller.availability.setAvailability({
          monday: '["09:00-17:00","99:00-100:00"]',
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" })
    })

    it("accepts a well-formed schedule update", async () => {
      const caller = routerHost.appRouter.createCaller(doctorCtx())
      await expect(
        caller.availability.setAvailability({
          monday: '["09:00-17:00"]',
          slotDuration: 30,
        }),
      ).resolves.toMatchObject({
        doctorId: doctorProfileId,
        slotDuration: 30,
      })
    })

    it("persists real notifications when a doctor confirms", async () => {
      const patientCaller = routerHost.appRouter.createCaller(patientCtx())
      const appt = await patientCaller.appointments.create({
        doctorId: doctorProfileId,
        scheduleId,
        ...slot(8),
      })

      const doctorCaller = routerHost.appRouter.createCaller(doctorCtx())
      await doctorCaller.appointments.updateStatus({
        id: appt.id,
        status: "CONFIRMED",
      })

      const row = await prisma.appointment.findUniqueOrThrow({
        where: { id: appt.id },
      })
      expect(row.status).toBe("CONFIRMED")

      const notifications = await prisma.notification.findMany({
        where: { userId: patientUserId, type: "APPOINTMENT_CONFIRMATION" },
      })
      expect(notifications.length).toBeGreaterThanOrEqual(2) // booking + confirm
    })
  })
})
