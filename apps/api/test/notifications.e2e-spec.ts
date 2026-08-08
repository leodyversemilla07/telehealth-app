import { afterAll, beforeAll, describe, expect, it } from "@jest/globals"
import { type INestApplication, NotFoundException } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { Test, type TestingModule } from "@nestjs/testing"
import { NotificationsModule } from "../src/notifications/notifications.module"
import { NotificationsService } from "../src/notifications/notifications.service"
import { PrismaService } from "../src/prisma/prisma.service"

/**
 * Module-level spec for the notifications surface (CRM-style in-process
 * tests): boot the REAL NotificationsModule graph (service + socket + push
 * peers) with the mocked PrismaClient underneath, and exercise the service
 * the way the tRPC router would.
 */
describe("Notifications (module e2e)", () => {
  let app: INestApplication
  let service: NotificationsService
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), NotificationsModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    service = moduleFixture.get(NotificationsService)
    prisma = moduleFixture.get(PrismaService)
    await app.init()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await app.close()
  })

  it("lists notifications with defaults", async () => {
    ;(prisma.notification.findMany as jest.Mock).mockResolvedValue([
      { id: "n1" },
    ])
    ;(prisma.notification.count as jest.Mock).mockResolvedValue(1)

    await expect(service.getNotifications("u-1", {})).resolves.toEqual({
      items: [{ id: "n1" }],
      total: 1,
      limit: 50,
      offset: 0,
    })
  })

  it("honors explicit pagination", async () => {
    ;(prisma.notification.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.notification.count as jest.Mock).mockResolvedValue(0)

    await expect(
      service.getNotifications("u-1", { limit: 10, offset: 20 }),
    ).resolves.toEqual({ items: [], total: 0, limit: 10, offset: 20 })
  })

  it("returns the unread count", async () => {
    ;(prisma.notification.count as jest.Mock).mockResolvedValue(3)
    await expect(service.getUnreadCount("u-1")).resolves.toEqual({ count: 3 })
  })

  it("raises NotFoundException for a missing notification", async () => {
    ;(prisma.notification.findUnique as jest.Mock).mockResolvedValue(null)
    await expect(service.markAsRead("u-1", "missing")).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it("refuses to mark another user's notification", async () => {
    ;(prisma.notification.findUnique as jest.Mock).mockResolvedValue({
      id: "n1",
      userId: "someone-else",
    })
    await expect(service.markAsRead("u-1", "n1")).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it("marks an unread notification as read", async () => {
    ;(prisma.notification.findUnique as jest.Mock).mockResolvedValue({
      id: "n1",
      userId: "u-1",
      isRead: false,
    })
    ;(prisma.notification.update as jest.Mock).mockResolvedValue({
      id: "n1",
      isRead: true,
    })

    await expect(service.markAsRead("u-1", "n1")).resolves.toEqual({
      id: "n1",
      isRead: true,
    })
  })

  it("returns the existing record when already read", async () => {
    const notification = { id: "n1", userId: "u-1", isRead: true }
    ;(prisma.notification.findUnique as jest.Mock).mockResolvedValue(
      notification,
    )

    await expect(service.markAsRead("u-1", "n1")).resolves.toBe(notification)
    expect(prisma.notification.update).not.toHaveBeenCalled()
  })

  it("marks all notifications read", async () => {
    ;(prisma.notification.updateMany as jest.Mock).mockResolvedValue({
      count: 4,
    })
    await expect(service.markAllAsRead("u-1")).resolves.toEqual({
      success: true,
    })
  })

  it("returns the user's preferences", async () => {
    ;(prisma.notificationPreference.upsert as jest.Mock).mockResolvedValue({
      userId: "u-1",
      appointmentReminder: true,
      appointmentConfirmation: true,
      pushEnabled: true,
      emailEnabled: false,
    })
    await expect(service.getPreferences("u-1")).resolves.toMatchObject({
      appointmentReminder: true,
    })
  })
})
