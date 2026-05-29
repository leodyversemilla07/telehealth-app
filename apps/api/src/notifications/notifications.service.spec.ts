import { Test, type TestingModule } from "@nestjs/testing"
import { PrismaService } from "@/prisma/prisma.service"

jest.mock("./notifications.gateway", () => ({
  NotificationsGateway: jest.fn().mockImplementation(() => ({
    emitToUser: jest.fn(),
  })),
}))

import { NotificationsGateway } from "./notifications.gateway"
import { NotificationsService } from "./notifications.service"

describe("NotificationsService", () => {
  let service: NotificationsService
  let prisma: jest.Mocked<Pick<PrismaService, "notification">>
  let gateway: jest.Mocked<Pick<NotificationsGateway, "emitToUser">>

  beforeEach(async () => {
    const prismaMock = {
      notification: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
      },
    }
    const gatewayMock = { emitToUser: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: NotificationsGateway, useValue: gatewayMock },
      ],
    }).compile()

    service = module.get<NotificationsService>(NotificationsService)
    prisma = module.get(PrismaService) as jest.Mocked<
      Pick<PrismaService, "notification">
    >
    gateway = module.get(NotificationsGateway) as jest.Mocked<
      Pick<NotificationsGateway, "emitToUser">
    >
  })

  describe("getNotifications", () => {
    it("should return paginated notifications", async () => {
      prisma.notification.findMany.mockResolvedValue([{ id: "n1" }])
      prisma.notification.count.mockResolvedValue(1)

      const result = await service.getNotifications("u1", {
        limit: 10,
        offset: 0,
      })

      expect(result.items).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.limit).toBe(10)
      expect(result.offset).toBe(0)
    })

    it("should apply default pagination when not provided", async () => {
      prisma.notification.findMany.mockResolvedValue([])
      prisma.notification.count.mockResolvedValue(0)

      await service.getNotifications("u1", {})

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50, skip: 0 }),
      )
    })
  })

  describe("getUnreadCount", () => {
    it("should return unread count", async () => {
      prisma.notification.count.mockResolvedValue(3)

      const result = await service.getUnreadCount("u1")

      expect(result).toEqual({ count: 3 })
    })
  })

  describe("markAsRead", () => {
    it("should return null when notification not found", async () => {
      prisma.notification.findUnique.mockResolvedValue(null)

      const result = await service.markAsRead("u1", "n1")

      expect(result).toBeNull()
    })

    it("should return null when notification belongs to another user", async () => {
      prisma.notification.findUnique.mockResolvedValue({
        id: "n1",
        userId: "other-user",
      })

      const result = await service.markAsRead("u1", "n1")

      expect(result).toBeNull()
    })

    it("should return notification unchanged if already read", async () => {
      const notif = { id: "n1", userId: "u1", isRead: true }
      prisma.notification.findUnique.mockResolvedValue(notif)

      const result = await service.markAsRead("u1", "n1")

      expect(result).toEqual(notif)
      expect(prisma.notification.update).not.toHaveBeenCalled()
    })

    it("should mark as read and set readAt", async () => {
      prisma.notification.findUnique.mockResolvedValue({
        id: "n1",
        userId: "u1",
        isRead: false,
      })
      prisma.notification.update.mockResolvedValue({
        id: "n1",
        isRead: true,
        readAt: new Date(),
      })

      const result = await service.markAsRead("u1", "n1")

      expect(result).toEqual(expect.objectContaining({ isRead: true }))
      expect(prisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "n1" },
          data: expect.objectContaining({ isRead: true }),
        }),
      )
    })
  })

  describe("markAllAsRead", () => {
    it("should mark all user notifications as read", async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 5 })

      const result = await service.markAllAsRead("u1")

      expect(result).toEqual({ success: true })
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: "u1", isRead: false },
        data: { isRead: true, readAt: expect.any(Date) },
      })
    })
  })

  describe("createNotification", () => {
    it("should create notification and emit via websocket", async () => {
      prisma.notification.create.mockResolvedValue({
        id: "n1",
        userId: "u1",
        type: "APPOINTMENT_REMINDER",
        title: "Reminder",
        body: "Your appointment is tomorrow",
      })

      const result = await service.createNotification(
        "u1",
        "APPOINTMENT_REMINDER",
        "Reminder",
        "Your appointment is tomorrow",
      )

      expect(result).toEqual(expect.objectContaining({ id: "n1" }))
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: "u1",
          type: "APPOINTMENT_REMINDER",
          title: "Reminder",
          body: "Your appointment is tomorrow",
        },
      })
      expect(gateway.emitToUser).toHaveBeenCalledWith(
        "u1",
        "notification",
        expect.objectContaining({ id: "n1" }),
      )
    })

    it("should create notification without body", async () => {
      prisma.notification.create.mockResolvedValue({
        id: "n2",
        userId: "u1",
        type: "SYSTEM_ALERT",
        title: "Alert",
      })

      await service.createNotification("u1", "SYSTEM_ALERT", "Alert")

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: "u1",
          type: "SYSTEM_ALERT",
          title: "Alert",
          body: undefined,
        },
      })
    })
  })
})
