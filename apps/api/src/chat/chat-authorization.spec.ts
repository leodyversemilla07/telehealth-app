import { ForbiddenException, NotFoundException } from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import { PrismaService } from "../prisma/prisma.service"
import { ChatService } from "./chat.service"

type MockPrisma = {
  user: { findUnique: jest.Mock }
  appointment: { findFirst: jest.Mock }
  chatMessage: {
    create: jest.Mock
    findMany: jest.Mock
    findFirst: jest.Mock
    count: jest.Mock
    updateMany: jest.Mock
  }
}

function buildPrismaMock(): MockPrisma {
  return {
    user: { findUnique: jest.fn() },
    appointment: { findFirst: jest.fn() },
    chatMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
  }
}

describe("Chat authorization security", () => {
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
      ],
    }).compile()

    service = module.get<ChatService>(ChatService)
    prisma = module.get<PrismaService>(PrismaService) as unknown as MockPrisma
  })

  describe("sendMessage without appointment relationship", () => {
    it("should throw ForbiddenException when no appointment links the two users", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "receiver-id" })
      prisma.appointment.findFirst.mockResolvedValue(null)

      await expect(
        service.sendMessage("sender-id", "receiver-id", "Hello"),
      ).rejects.toThrow(ForbiddenException)
    })

    it("should throw ForbiddenException when receiver does not exist", async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(
        service.sendMessage("sender-id", "missing", "Hello"),
      ).rejects.toThrow(NotFoundException)
    })

    it("should allow messages when an active appointment exists", async () => {
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
    })
  })

  describe("getConversation without appointment relationship", () => {
    it("should throw ForbiddenException when no appointment links the users", async () => {
      prisma.appointment.findFirst.mockResolvedValue(null)

      await expect(service.getConversation("user-a", "user-b")).rejects.toThrow(
        ForbiddenException,
      )
    })

    it("should return messages when an appointment exists", async () => {
      prisma.appointment.findFirst.mockResolvedValue({ id: "appt-1" })
      prisma.chatMessage.findMany.mockResolvedValue([
        { id: "m1", content: "Hi", senderId: "u1", receiverId: "u2" },
      ])

      const result = await service.getConversation("u1", "u2")

      expect(result).toHaveLength(1)
    })
  })

  describe("markAsRead without appointment relationship", () => {
    it("should throw ForbiddenException when no appointment links the users", async () => {
      prisma.appointment.findFirst.mockResolvedValue(null)

      await expect(service.markAsRead("user-a", "user-b")).rejects.toThrow(
        ForbiddenException,
      )
    })
  })
})
