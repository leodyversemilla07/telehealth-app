import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import { ChatService } from "../chat/chat.service"
import { SocketService } from "../notifications/socket.service"
import { PrismaService } from "../prisma/prisma.service"

describe("ChatService (integration logic)", () => {
  let service: ChatService
  let prisma: {
    user: { findUnique: jest.Mock; findMany: jest.Mock }
    appointment: { findFirst: jest.Mock; findMany: jest.Mock }
    chatMessage: {
      create: jest.Mock
      findMany: jest.Mock
      updateMany: jest.Mock
      count: jest.Mock
      groupBy: jest.Mock
    }
    $queryRaw: jest.Mock
  }
  let socket: { emitToUser: jest.Mock }

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), findMany: jest.fn() },
      appointment: { findFirst: jest.fn(), findMany: jest.fn() },
      chatMessage: {
        create: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      $queryRaw: jest.fn(),
    }
    socket = { emitToUser: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: prisma },
        { provide: SocketService, useValue: socket },
      ],
    }).compile()

    service = module.get(ChatService)
  })

  describe("sendMessage()", () => {
    it("should throw NotFoundException if receiver not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(
        service.sendMessage("sender-1", "missing", "Hello"),
      ).rejects.toThrow(NotFoundException)
    })

    it("should throw BadRequestException when sending to self", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "sender-1" })

      await expect(
        service.sendMessage("sender-1", "sender-1", "Hello"),
      ).rejects.toThrow(BadRequestException)
    })

    it("should throw ForbiddenException if no shared appointment exists", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "receiver-1" })
      prisma.appointment.findFirst.mockResolvedValue(null)

      await expect(
        service.sendMessage("sender-1", "receiver-1", "Hello"),
      ).rejects.toThrow(ForbiddenException)
    })

    it("should create message and emit via socket when authorized", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "receiver-1" })
      prisma.appointment.findFirst.mockResolvedValue({ id: "appt-1" })
      prisma.chatMessage.create.mockResolvedValue({
        id: "msg-1",
        senderId: "sender-1",
        receiverId: "receiver-1",
        content: "Hello",
      })

      const result = await service.sendMessage(
        "sender-1",
        "receiver-1",
        "Hello",
      )

      expect(result.id).toBe("msg-1")
      expect(prisma.chatMessage.create).toHaveBeenCalled()
      expect(socket.emitToUser).toHaveBeenCalledTimes(2) // receiver + sender
    })
  })

  describe("getUnreadCount()", () => {
    it("should return unread count", async () => {
      prisma.chatMessage.count.mockResolvedValue(5)

      const result = await service.getUnreadCount("user-1")
      expect(result.count).toBe(5)
    })
  })
})
