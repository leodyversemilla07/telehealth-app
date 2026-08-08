import { afterAll, beforeAll, describe, expect, it } from "@jest/globals"
import type { INestApplication } from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import request from "supertest"
import type { App } from "supertest/types"
import { PrismaService } from "@/prisma/prisma.service"
import { mockGetSession } from "./mocks/telehealth-auth"

/**
 * Full-AppModule e2e (mirrors crm/apps/api/test/auth.e2e.spec.ts):
 * boot the REAL module graph via Test.createTestingModule({ imports:
 * [AppModule] }) and drive it with supertest over actual HTTP. Env fallbacks
 * must be set BEFORE AppModule is imported (validation runs at import time).
 */
const fallback = (key: string, value: string) => {
  if (!process.env[key]) {
    process.env[key] = value
  }
}

fallback(
  "DATABASE_URL",
  "postgresql://postgres:postgres@localhost:5432/telehealth_test?schema=public",
)
fallback("BETTER_AUTH_SECRET", "test-secret-0123456789abcdef0123456789abcdef")
fallback("BETTER_AUTH_URL", "http://localhost:3001")
fallback("API_URL", "http://localhost:3001")

describe("API (e2e) — full AppModule", () => {
  let app: INestApplication<App>
  let prisma: PrismaService

  beforeAll(async () => {
    const { AppModule } = await import("../src/app.module")

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication({ bodyParser: false })
    prisma = moduleFixture.get(PrismaService)
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe("health", () => {
    it("serves the health endpoint with database probe", async () => {
      const client = (prisma as unknown as { client: { $queryRaw: jest.Mock } })
        .client
      client.$queryRaw.mockResolvedValue([{ "?column?": 1 }])
      const res = await request(app.getHttpServer()).get("/").expect(200)

      expect(res.body).toMatchObject({ status: "ok" })
      expect(res.body.database).toMatchObject({ status: "healthy" })
      expect(typeof res.body.timestamp).toBe("string")
    })
  })

  describe("auth surface", () => {
    it("mounts the auth handler (probe used by the load balancer)", async () => {
      await request(app.getHttpServer()).get("/auth/ok").expect(200)
    })

    it("rejects an unauthenticated request to a guarded route (401)", async () => {
      mockGetSession.mockResolvedValueOnce(null)
      await request(app.getHttpServer()).get("/admin/users").expect(401)
    })

    it("forbids a non-admin role on the admin area (403)", async () => {
      mockGetSession.mockResolvedValueOnce({
        user: { id: "patient-1", role: "PATIENT" },
      })
      await request(app.getHttpServer()).get("/admin/users").expect(403)
    })

    it("lets an admin through and returns the paginated list", async () => {
      mockGetSession.mockResolvedValueOnce({
        user: { id: "admin-1", role: "ADMIN" },
      })
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: "u1", name: "Ada", email: "ada@example.com" },
      ])
      ;(prisma.user.count as jest.Mock).mockResolvedValue(1)

      const res = await request(app.getHttpServer())
        .get("/admin/users")
        .expect(200)

      expect(res.body.items).toHaveLength(1)
      expect(res.body.total).toBe(1)
    })
  })

  describe("validation", () => {
    it("404s unknown routes", async () => {
      await request(app.getHttpServer())
        .get("/definitely-not-a-route")
        .expect(404)
    })
  })
})
