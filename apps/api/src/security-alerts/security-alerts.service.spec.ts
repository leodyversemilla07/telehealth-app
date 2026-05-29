import { Test, type TestingModule } from "@nestjs/testing"
import { EmailService } from "@/common/services/email.service"
import { PrismaService } from "@/prisma/prisma.service"
import { SecurityAlertsService } from "./security-alerts.service"

type MockPrisma = {
  user: { findUnique: jest.Mock }
  securityAlert: {
    create: jest.Mock
    findMany: jest.Mock
    updateMany: jest.Mock
  }
}

type MockEmailService = {
  sendSecurityAlert: jest.Mock
}

function buildPrismaMock(): MockPrisma {
  return {
    user: { findUnique: jest.fn() },
    securityAlert: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  }
}

describe("SecurityAlertsService", () => {
  let service: SecurityAlertsService
  let prisma: MockPrisma
  let emailService: MockEmailService

  beforeEach(async () => {
    const prismaMock = buildPrismaMock()
    const emailMock: MockEmailService = { sendSecurityAlert: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityAlertsService,
        {
          provide: PrismaService,
          useValue: prismaMock as unknown as PrismaService,
        },
        {
          provide: EmailService,
          useValue: emailMock as unknown as EmailService,
        },
      ],
    }).compile()

    service = module.get<SecurityAlertsService>(SecurityAlertsService)
    prisma = module.get<PrismaService>(PrismaService) as unknown as MockPrisma
    emailService = module.get<EmailService>(
      EmailService,
    ) as unknown as MockEmailService
  })

  describe("createAlert", () => {
    it("should silently return when user is not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      const result = await service.createAlert("missing", "Test", "Message")

      expect(result).toBeUndefined()
      expect(prisma.securityAlert.create).not.toHaveBeenCalled()
      expect(emailService.sendSecurityAlert).not.toHaveBeenCalled()
    })

    it("should create alert and send email when user exists", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "u1",
        email: "user@test.com",
      })
      prisma.securityAlert.create.mockResolvedValue({
        id: "alert-1",
        userId: "u1",
        title: "Test Alert",
        message: "Test message",
        createdAt: new Date(),
      })

      const result = await service.createAlert(
        "u1",
        "Test Alert",
        "Test message",
        "192.168.1.1",
        "Chrome",
      )

      expect(result).toEqual(expect.objectContaining({ id: "alert-1" }))
      expect(prisma.securityAlert.create).toHaveBeenCalledWith({
        data: {
          userId: "u1",
          title: "Test Alert",
          message: "Test message",
          ipAddress: "192.168.1.1",
          userAgent: "Chrome",
        },
      })
      expect(emailService.sendSecurityAlert).toHaveBeenCalledWith(
        "user@test.com",
        "Test Alert",
        "Test message",
      )
    })

    it("should handle null ipAddress and userAgent", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "u1",
        email: "user@test.com",
      })
      prisma.securityAlert.create.mockResolvedValue({ id: "alert-2" })

      await service.createAlert("u1", "Title", "Message", null, null)

      expect(prisma.securityAlert.create).toHaveBeenCalledWith({
        data: {
          userId: "u1",
          title: "Title",
          message: "Message",
          ipAddress: null,
          userAgent: null,
        },
      })
    })
  })

  describe("getAlerts", () => {
    it("should return alerts sorted by newest first", async () => {
      const alerts = [
        { id: "a1", createdAt: new Date("2026-06-02") },
        { id: "a2", createdAt: new Date("2026-06-01") },
      ]
      prisma.securityAlert.findMany.mockResolvedValue(alerts)

      const result = await service.getAlerts("u1")

      expect(result).toEqual(alerts)
      expect(prisma.securityAlert.findMany).toHaveBeenCalledWith({
        where: { userId: "u1" },
        orderBy: { createdAt: "desc" },
      })
    })
  })

  describe("markAsRead", () => {
    it("should mark all unread alerts as read", async () => {
      prisma.securityAlert.updateMany.mockResolvedValue({ count: 3 })

      const result = await service.markAsRead("u1")

      expect(result).toEqual({ success: true })
      expect(prisma.securityAlert.updateMany).toHaveBeenCalledWith({
        where: { userId: "u1", read: false },
        data: { read: true },
      })
    })
  })
})
