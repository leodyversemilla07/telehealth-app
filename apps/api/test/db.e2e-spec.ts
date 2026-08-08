import { afterAll, beforeAll, describe, expect, it } from "@jest/globals"
import { type INestApplication, ValidationPipe } from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import type { PrismaClient } from "@telehealth/db"
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
    await prisma.notification.create({
      data: {
        userId: (
          await prisma.user.findUniqueOrThrow({
            where: { email: "patient@e2e.ph" },
          })
        ).id,
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

    expect(res.body.total).toBe(2)
    const emails = res.body.items.map((u: { email: string }) => u.email)
    expect(emails).toContain("admin@e2e.ph")
    expect(emails).toContain("patient@e2e.ph")
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
})
