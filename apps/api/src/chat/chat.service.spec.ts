import { ForbiddenException, NotFoundException } from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import { SocketService } from "../notifications/socket.service"
import { PrismaService } from "../prisma/prisma.service"
import { ChatService } from "./chat.service"

type MockPrisma = {
  user: { findUnique: jest.Mock; findMany: jest.Mock }
  appointment: { findFirst: jest.Mock }
  chatMessage: {
    create: jest.Mock
    findMany: jest.Mock
    findFirst: jest.Mock
    count: jest.Mock
    updateMany: jest.Mock
    groupBy: jest.Mock
  }
  $queryRaw: jest.Mock
}

function buildPrismaMock(): MockPrisma {
  return {
    user: { findUnique: jest.fn(), findMany: jest.fn() },
    appointment: { findFirst: jest.fn() },
    chatMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
      groupBy: jest.fn(),
    },
    $queryRaw: jest.fn(),
  }
}

describe("ChatService", () => {
  let service: ChatService
  let prisma: MockPrisma

  beforeEach(async () => {
    const prismaMock = buildPrismaMock()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: PrismaService,
          useValue: prismaMock as unknown as PrismaService,
        },
        {
          provide: SocketService,
          useValue: { emitToUser: jest.fn() },
        },
      ],
    }).compile()

    service = module.get<ChatService>(ChatService)
    prisma = module.get<PrismaService>(PrismaService) as unknown as MockPrisma
  })

  describe("sendMessage", () => {
    it("should throw when receiver is not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(
        service.sendMessage("sender-id", "missing-receiver", "Hello"),
      ).rejects.toThrow(NotFoundException)
    })

    it("should create a message when receiver exists", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "receiver-id" })
      prisma.appointment.findFirst.mockResolvedValue({ id: "appt-1" })
      prisma.chatMessage.create.mockResolvedValue({
        id: "msg-1",
        senderId: "sender-id",
        receiverId: "receiver-id",
        content: "Hello",
        createdAt: new Date(),
      })

      const result = await service.sendMessage(
        "sender-id",
        "receiver-id",
        "Hello",
      )

      expect(result).toEqual(expect.objectContaining({ id: "msg-1" }))
      expect(prisma.chatMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            senderId: "sender-id",
            receiverId: "receiver-id",
            content: "Hello",
          }),
        }),
      )
    })

    it("should include appointmentId when provided", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "receiver-id" })
      prisma.appointment.findFirst.mockResolvedValue({ id: "appt-1" })
      prisma.chatMessage.create.mockResolvedValue({ id: "msg-2" })

      await service.sendMessage("sender-id", "receiver-id", "Hello", "appt-1")

      expect(prisma.chatMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ appointmentId: "appt-1" }),
        }),
      )
    })

    it("should reject messages outside appointment relationships", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "receiver-id" })
      prisma.appointment.findFirst.mockResolvedValue(null)

      await expect(
        service.sendMessage("sender-id", "receiver-id", "Hello"),
      ).rejects.toThrow(ForbiddenException)
    })
  })

  describe("getConversation", () => {
    it("should return messages between two users", async () => {
      const messages = [
        { id: "m1", content: "Hi", senderId: "u1", receiverId: "u2" },
        { id: "m2", content: "Hello", senderId: "u2", receiverId: "u1" },
      ]
      prisma.appointment.findFirst.mockResolvedValue({ id: "appt-1" })
      prisma.chatMessage.findMany.mockResolvedValue(messages)

      const result = await service.getConversation("u1", "u2")

      expect(result).toHaveLength(2)
      expect(prisma.chatMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 }),
      )
    })

    it("should respect custom limit", async () => {
      prisma.chatMessage.findMany.mockResolvedValue([])
      prisma.appointment.findFirst.mockResolvedValue({ id: "appt-1" })

      await service.getConversation("u1", "u2", 10)

      expect(prisma.chatMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      )
    })
  })

  describe("getConversations", () => {
    it("should return empty array when no conversations", async () => {
      prisma.chatMessage.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])

      const result = await service.getConversations("u1")

      expect(result).toEqual([])
    })

    it("should return sorted conversations with unread counts", async () => {
      // First two findMany calls: sent + received messages
      prisma.chatMessage.findMany
        .mockResolvedValueOnce([{ receiverId: "u2" }])
        .mockResolvedValueOnce([])
      // Raw query: last messages per conversation
      prisma.$queryRaw.mockResolvedValue([
        {
          id: "m1",
          content: "Last",
          senderId: "u2",
          receiverId: "u1",
          createdAt: new Date("2026-06-01"),
          senderName: "Dr. Smith",
          senderEmail: "smith@test.com",
          senderImage: null,
        },
      ])
      prisma.chatMessage.groupBy.mockResolvedValue([
        { senderId: "u2", _count: { id: 2 } },
      ])
      prisma.user.findMany.mockResolvedValue([
        { id: "u2", name: "Dr. Smith", email: "smith@test.com", image: null },
      ])

      const result = await service.getConversations("u1")

      expect(result).toHaveLength(1)
      expect(result[0]?.unreadCount).toBe(2)
      expect(result[0]?.otherUser?.name).toBe("Dr. Smith")
    })
  })

  describe("markAsRead", () => {
    it("should update unread messages as read", async () => {
      prisma.chatMessage.updateMany.mockResolvedValue({ count: 3 })
      prisma.appointment.findFirst.mockResolvedValue({ id: "appt-1" })

      const _result = await service.markAsRead("current-user", "sender-user")

      expect(prisma.chatMessage.updateMany).toHaveBeenCalledWith({
        where: {
          senderId: "sender-user",
          receiverId: "current-user",
          isRead: false,
        },
        data: { isRead: true },
      })
    })
  })

  describe("getUnreadCount", () => {
    it("should return the count of unread messages", async () => {
      prisma.chatMessage.count.mockResolvedValue(5)

      const result = await service.getUnreadCount("u1")

      expect(result).toEqual({ count: 5 })
    })
  })
})
