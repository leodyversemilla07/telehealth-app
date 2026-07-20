import { NotFoundException } from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import { NotificationsService } from "../notifications/notifications.service"
import { SocketService } from "../notifications/socket.service"
import { PrismaService } from "../prisma/prisma.service"
import { PushService } from "../push/push.service"

describe("NotificationsService (integration logic)", () => {
  let service: NotificationsService
  let prisma: {
    notification: {
      findMany: jest.Mock
      findUnique: jest.Mock
      count: jest.Mock
      update: jest.Mock
      updateMany: jest.Mock
      create: jest.Mock
    }
    notificationPreference: {
      findUnique: jest.Mock
      upsert: jest.Mock
    }
  }
  let socket: { emitToUser: jest.Mock }
  let push: { sendToUser: jest.Mock }

  beforeEach(async () => {
    prisma = {
      notification: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
      },
      notificationPreference: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
    }
    socket = { emitToUser: jest.fn() }
    push = { sendToUser: jest.fn().mockResolvedValue(undefined) }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: SocketService, useValue: socket },
        { provide: PushService, useValue: push },
      ],
    }).compile()

    service = module.get(NotificationsService)
  })

  describe("getNotifications()", () => {
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

  describe("getUnreadCount()", () => {
    it("should return unread count", async () => {
      prisma.notification.count.mockResolvedValue(3)

      const result = await service.getUnreadCount("u1")

      expect(result).toEqual({ count: 3 })
    })
  })

  describe("markAsRead()", () => {
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

  describe("markAllAsRead()", () => {
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

  describe("getPreferences()", () => {
    it("should return defaults when no preferences exist", async () => {
      prisma.notificationPreference.findUnique.mockResolvedValue(null)

      const result = await service.getPreferences("u1")

      expect(result).toEqual({
        appointmentReminder: true,
        appointmentConfirmation: true,
        appointmentCancelled: true,
        newMessage: true,
        scheduleUpdated: true,
        system: true,
        pushEnabled: true,
        emailEnabled: false,
      })
    })

    it("should return existing preferences", async () => {
      const prefs = {
        userId: "u1",
        appointmentReminder: false,
        appointmentConfirmation: true,
        appointmentCancelled: true,
        newMessage: true,
        scheduleUpdated: false,
        system: true,
        pushEnabled: true,
        emailEnabled: true,
      }
      prisma.notificationPreference.findUnique.mockResolvedValue(prefs)

      const result = await service.getPreferences("u1")

      expect(result).toEqual(prefs)
    })
  })

  describe("updatePreferences()", () => {
    it("should upsert preferences", async () => {
      const data = { appointmentReminder: false, pushEnabled: false }
      prisma.notificationPreference.upsert.mockResolvedValue({
        userId: "u1",
        ...data,
      })

      const result = await service.updatePreferences("u1", data)

      expect(result).toEqual(expect.objectContaining(data))
      expect(prisma.notificationPreference.upsert).toHaveBeenCalledWith({
        where: { userId: "u1" },
        create: { userId: "u1", ...data },
        update: data,
      })
    })
  })

  describe("createNotification()", () => {
    it("should create notification and emit via websocket when enabled", async () => {
      prisma.notificationPreference.findUnique.mockResolvedValue(null) // defaults → all enabled
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

    it("should skip notification when type preference is disabled", async () => {
      prisma.notificationPreference.findUnique.mockResolvedValue({
        appointmentReminder: false,
      })

      const result = await service.createNotification(
        "u1",
        "APPOINTMENT_REMINDER",
        "Reminder",
      )

      expect(result).toBeNull()
      expect(prisma.notification.create).not.toHaveBeenCalled()
      expect(socket.emitToUser).not.toHaveBeenCalled()
    })

    it("should skip websocket and push when pushEnabled is false", async () => {
      prisma.notificationPreference.findUnique.mockResolvedValue({
        pushEnabled: false,
      })
      prisma.notification.create.mockResolvedValue({
        id: "n2",
        type: "SYSTEM",
        title: "Alert",
      })

      const result = await service.createNotification("u1", "SYSTEM", "Alert")

      expect(result).not.toBeNull()
      expect(socket.emitToUser).not.toHaveBeenCalled()
      expect(push.sendToUser).not.toHaveBeenCalled()
    })

    it("should create notification without body", async () => {
      prisma.notificationPreference.findUnique.mockResolvedValue(null)
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
    })
  })
})
