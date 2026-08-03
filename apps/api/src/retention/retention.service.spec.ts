import { ConfigService } from "@nestjs/config"
import { Test, type TestingModule } from "@nestjs/testing"
import { PrismaService } from "../prisma/prisma.service"
import { RetentionService } from "./retention.service"

type MockPrisma = {
  verification: { deleteMany: jest.Mock }
  notification: {
    deleteMany: jest.Mock
    create: jest.Mock
  }
  securityAlert: { deleteMany: jest.Mock }
  auditLog: {
    deleteMany: jest.Mock
    create: jest.Mock
  }
  doctorProfile: {
    findMany: jest.Mock
    update: jest.Mock
  }
}

function buildPrismaMock(): MockPrisma {
  return {
    verification: { deleteMany: jest.fn() },
    notification: { deleteMany: jest.fn(), create: jest.fn() },
    securityAlert: { deleteMany: jest.fn() },
    auditLog: { deleteMany: jest.fn(), create: jest.fn() },
    doctorProfile: { findMany: jest.fn(), update: jest.fn() },
  }
}

function buildConfigMock(overrides: Record<string, number> = {}): {
  get: jest.Mock
} {
  return {
    get: jest.fn((key: string) => overrides[key] ?? undefined),
  }
}

describe("RetentionService", () => {
  let service: RetentionService
  let prisma: MockPrisma
  let config: { get: jest.Mock }

  beforeEach(async () => {
    prisma = buildPrismaMock()
    config = buildConfigMock()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetentionService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile()

    service = module.get<RetentionService>(RetentionService)
  })

  describe("purgeOldRecords", () => {
    it("should run every purge step and return early on no-op results", async () => {
      prisma.verification.deleteMany.mockResolvedValue({ count: 3 })
      prisma.notification.deleteMany.mockResolvedValue({ count: 2 })
      prisma.securityAlert.deleteMany.mockResolvedValue({ count: 1 })
      prisma.auditLog.deleteMany.mockResolvedValue({ count: 0 })
      prisma.doctorProfile.findMany.mockResolvedValue([])

      await service.purgeOldRecords()

      expect(prisma.verification.deleteMany).toHaveBeenCalledWith({
        where: { createdAt: { lt: expect.any(Date) } },
      })
      expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
        where: { createdAt: { lt: expect.any(Date) }, isRead: true },
      })
      expect(prisma.securityAlert.deleteMany).toHaveBeenCalledWith({
        where: { createdAt: { lt: expect.any(Date) }, read: true },
      })
      expect(prisma.auditLog.deleteMany).toHaveBeenCalledWith({
        where: { timestamp: { lt: expect.any(Date) } },
      })
      // No doctors expired or expiring → no license audit entry
      expect(prisma.auditLog.create).not.toHaveBeenCalled()
    })

    it("should use configured retention windows for notifications", async () => {
      config.get.mockImplementation((key: string) =>
        key === "RETENTION_NOTIFICATIONS_DAYS" ? 30 : undefined,
      )
      prisma.verification.deleteMany.mockResolvedValue({ count: 0 })
      prisma.notification.deleteMany.mockResolvedValue({ count: 5 })
      prisma.securityAlert.deleteMany.mockResolvedValue({ count: 0 })
      prisma.auditLog.deleteMany.mockResolvedValue({ count: 0 })
      prisma.doctorProfile.findMany.mockResolvedValue([])

      await service.purgeOldRecords()

      expect(config.get).toHaveBeenCalledWith("RETENTION_NOTIFICATIONS_DAYS")
      expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
        where: { createdAt: { lt: expect.any(Date) }, isRead: true },
      })
    })
  })

  describe("license verification", () => {
    it("should deactivate expired doctors and notify them", async () => {
      const expired = [
        {
          id: "doc-1",
          userId: "u1",
          prcLicenseExpiry: new Date("2025-01-01T00:00:00.000Z"),
        },
      ]
      prisma.doctorProfile.findMany.mockResolvedValueOnce(expired)
      prisma.doctorProfile.findMany.mockResolvedValueOnce([])
      prisma.verification.deleteMany.mockResolvedValue({ count: 0 })
      prisma.notification.deleteMany.mockResolvedValue({ count: 0 })
      prisma.securityAlert.deleteMany.mockResolvedValue({ count: 0 })
      prisma.auditLog.deleteMany.mockResolvedValue({ count: 0 })

      await service.purgeOldRecords()

      expect(prisma.doctorProfile.update).toHaveBeenCalledWith({
        where: { id: "doc-1" },
        data: { isApproved: false },
      })
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "u1",
            type: "APPOINTMENT_CANCELLED",
            title: "License Expired — Profile Deactivated",
          }),
        }),
      )
      // Expired > 0 → audit entry recorded
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: "LICENSE_VERIFICATION",
          reason: expect.stringContaining("Deactivated 1 expired"),
        }),
      })
    })

    it("should warn doctors whose licenses expire within six months", async () => {
      prisma.doctorProfile.findMany.mockResolvedValueOnce([])
      prisma.doctorProfile.findMany.mockResolvedValueOnce([
        {
          id: "doc-2",
          userId: "u2",
          prcLicenseExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      ])
      prisma.verification.deleteMany.mockResolvedValue({ count: 0 })
      prisma.notification.deleteMany.mockResolvedValue({ count: 0 })
      prisma.securityAlert.deleteMany.mockResolvedValue({ count: 0 })
      prisma.auditLog.deleteMany.mockResolvedValue({ count: 0 })

      await service.purgeOldRecords()

      expect(prisma.doctorProfile.update).not.toHaveBeenCalled()
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "u2",
            type: "APPOINTMENT_REMINDER",
            title: "PRC License Expiring Soon",
          }),
        }),
      )
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reason: expect.stringContaining("warned 1 expiring doctors"),
        }),
      })
    })

    it("should not create a license audit entry when nothing needs attention", async () => {
      prisma.doctorProfile.findMany.mockResolvedValue([])
      prisma.verification.deleteMany.mockResolvedValue({ count: 0 })
      prisma.notification.deleteMany.mockResolvedValue({ count: 0 })
      prisma.securityAlert.deleteMany.mockResolvedValue({ count: 0 })
      prisma.auditLog.deleteMany.mockResolvedValue({ count: 0 })

      await service.purgeOldRecords()

      expect(prisma.auditLog.create).not.toHaveBeenCalled()
    })
  })
})
