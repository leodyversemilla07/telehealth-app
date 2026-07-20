import {
  type ExecutionContext,
  type INestApplication,
  Injectable,
} from "@nestjs/common"
import { APP_GUARD } from "@nestjs/core"
import { Test, type TestingModule } from "@nestjs/testing"
import request from "supertest"
import type { App } from "supertest/types"
import { NotificationsController } from "@/notifications/notifications.controller"
import { NotificationsService } from "@/notifications/notifications.service"

/**
 * Mock guard that permits all requests and attaches a user session.
 */
@Injectable()
class MockAuthGuard {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest()
    req.userSession = { user: { id: "test-user-1", role: "PATIENT" } }
    return true
  }
}

describe("Notifications (e2e)", () => {
  let app: INestApplication<App>
  let notificationsService: NotificationsService

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: {
            getNotifications: jest.fn().mockResolvedValue({
              items: [{ id: "n1", title: "Test" }],
              total: 1,
              limit: 50,
              offset: 0,
            }),
            getUnreadCount: jest.fn().mockResolvedValue({ count: 3 }),
            getPreferences: jest.fn().mockResolvedValue({
              appointmentReminder: true,
              appointmentConfirmation: true,
              pushEnabled: true,
              emailEnabled: false,
            }),
            updatePreferences: jest
              .fn()
              .mockImplementation((_userId, data) =>
                Promise.resolve({ userId: "test-user-1", ...data }),
              ),
            markAllAsRead: jest.fn().mockResolvedValue({ success: true }),
            markAsRead: jest.fn().mockResolvedValue({ id: "n1", isRead: true }),
          },
        },
        { provide: APP_GUARD, useClass: MockAuthGuard },
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    notificationsService = moduleFixture.get(NotificationsService)
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  describe("GET /notifications", () => {
    it("should return paginated notifications", async () => {
      const res = await request(app.getHttpServer())
        .get("/notifications")
        .expect(200)

      expect(res.body.items).toHaveLength(1)
      expect(res.body.total).toBe(1)
      expect(notificationsService.getNotifications).toHaveBeenCalledWith(
        "test-user-1",
        expect.objectContaining({}),
      )
    })

    it("should pass query params", async () => {
      await request(app.getHttpServer())
        .get("/notifications?limit=5&offset=10")
        .expect(200)

      expect(notificationsService.getNotifications).toHaveBeenCalledWith(
        "test-user-1",
        expect.objectContaining({ limit: "5", offset: "10" }),
      )
    })

    it("should reject when not authenticated", async () => {
      // Override guard to deny
      const module2 = await Test.createTestingModule({
        controllers: [NotificationsController],
        providers: [
          {
            provide: NotificationsService,
            useValue: { getNotifications: jest.fn() },
          },
          {
            provide: APP_GUARD,
            useValue: { canActivate: () => false },
          },
        ],
      }).compile()
      const app2 = module2.createNestApplication()
      await app2.init()

      await request(app2.getHttpServer()).get("/notifications").expect(403)

      await app2.close()
    })
  })

  describe("GET /notifications/unread-count", () => {
    it("should return unread count", async () => {
      const res = await request(app.getHttpServer())
        .get("/notifications/unread-count")
        .expect(200)

      expect(res.body).toEqual({ count: 3 })
    })
  })

  describe("GET /notifications/preferences", () => {
    it("should return notification preferences", async () => {
      const res = await request(app.getHttpServer())
        .get("/notifications/preferences")
        .expect(200)

      expect(res.body).toHaveProperty("appointmentReminder", true)
      expect(res.body).toHaveProperty("pushEnabled", true)
    })
  })

  describe("PUT /notifications/preferences", () => {
    it("should update notification preferences", async () => {
      const res = await request(app.getHttpServer())
        .put("/notifications/preferences")
        .send({ appointmentReminder: false, pushEnabled: false })
        .expect(200)

      expect(res.body).toEqual(
        expect.objectContaining({
          appointmentReminder: false,
          pushEnabled: false,
        }),
      )
      expect(notificationsService.updatePreferences).toHaveBeenCalledWith(
        "test-user-1",
        { appointmentReminder: false, pushEnabled: false },
      )
    })
  })

  describe("PATCH /notifications/mark-all-read", () => {
    it("should mark all as read", async () => {
      const res = await request(app.getHttpServer())
        .patch("/notifications/mark-all-read")
        .expect(200)

      expect(res.body).toEqual({ success: true })
    })
  })

  describe("PATCH /notifications/:id/read", () => {
    it("should mark notification as read", async () => {
      const res = await request(app.getHttpServer())
        .patch("/notifications/n1/read")
        .expect(200)

      expect(res.body).toEqual(expect.objectContaining({ isRead: true }))
      expect(notificationsService.markAsRead).toHaveBeenCalledWith(
        "test-user-1",
        "n1",
      )
    })
  })
})
