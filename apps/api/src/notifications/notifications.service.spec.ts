import { NotFoundException } from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import type { Mockify } from "../../test/mocks/prisma-client"
import { PrismaService } from "../prisma/prisma.service"
import { PushService } from "../push/push.service"
import { NotificationsService } from "./notifications.service"
import { SocketService } from "./socket.service"

describe("NotificationsService", () => {
  let service: NotificationsService
  let prisma: Mockify<Pick<PrismaService, "notification">>
  let socket: Mockify<Pick<SocketService, "emitToUser">>
  let push: { sendToUser: jest.Mock }

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
    const socketMock = { emitToUser: jest.fn() }
    const pushMock = { sendToUser: jest.fn().mockResolvedValue(undefined) }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: SocketService, useValue: socketMock },
        { provide: PushService, useValue: pushMock },
      ],
    }).compile()

    service = module.get<NotificationsService>(NotificationsService)
    prisma = module.get(PrismaService) as Mockify<
      Pick<PrismaService, "notification">
    >
    socket = module.get(SocketService) as Mockify<
      Pick<SocketService, "emitToUser">
    >
    push = module.get(PushService) as unknown as { sendToUser: jest.Mock }
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
    it("should throw NotFoundException when notification not found", async () => {
      prisma.notification.findUnique.mockResolvedValue(null)

      await expect(service.markAsRead("u1", "n1")).rejects.toThrow(
        NotFoundException,
      )
    })

    it("should throw NotFoundException when notification belongs to another user", async () => {
      prisma.notification.findUnique.mockResolvedValue({
        id: "n1",
        userId: "other-user",
      })

      await expect(service.markAsRead("u1", "n1")).rejects.toThrow(
        NotFoundException,
      )
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
      expect(socket.emitToUser).toHaveBeenCalledWith(
        "u1",
        "notification",
        expect.objectContaining({ id: "n1" }),
      )
      expect(push.sendToUser).toHaveBeenCalledWith("u1", {
        title: "Reminder",
        body: "Your appointment is tomorrow",
      })
    })

    it("should create notification without body", async () => {
      prisma.notification.create.mockResolvedValue({
        id: "n2",
        userId: "u1",
        type: "SYSTEM",
        title: "Alert",
      })

      await service.createNotification("u1", "SYSTEM", "Alert")

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: "u1",
          type: "SYSTEM",
          title: "Alert",
          body: undefined,
        },
      })
      expect(push.sendToUser).toHaveBeenCalledWith("u1", {
        title: "Alert",
        body: undefined,
      })
    })
  })
})
