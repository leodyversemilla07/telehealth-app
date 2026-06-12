import { ForbiddenException, NotFoundException } from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import { AuditLogsService } from "../audit-logs/audit-logs.service"
import { PrismaService } from "../prisma/prisma.service"
import { SecurityAlertsService } from "../security-alerts/security-alerts.service"
import { UsersService } from "./users.service"

type MockPrisma = {
  user: {
    findUnique: jest.Mock
    findMany: jest.Mock
    count: jest.Mock
    update: jest.Mock
  }
  session: {
    findMany: jest.Mock
    findFirst: jest.Mock
    delete: jest.Mock
    deleteMany: jest.Mock
  }
}

function buildPrismaMock(): MockPrisma {
  return {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    session: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  }
}

describe("Banned user security", () => {
  let service: UsersService
  let prisma: MockPrisma

  beforeEach(async () => {
    const prismaMock = buildPrismaMock()
    const auditMock = { createLog: jest.fn() }
    const alertsMock = { createAlert: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaMock as unknown as PrismaService,
        },
        {
          provide: AuditLogsService,
          useValue: auditMock as unknown as AuditLogsService,
        },
        {
          provide: SecurityAlertsService,
          useValue: alertsMock as unknown as SecurityAlertsService,
        },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
    prisma = module.get<PrismaService>(PrismaService) as unknown as MockPrisma
  })

  describe("banUser", () => {
    it("should revoke all active sessions when banning a user", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "u1",
        email: "u@test.com",
      })
      prisma.session.deleteMany.mockResolvedValue({ count: 3 })
      prisma.user.update.mockResolvedValue({
        id: "u1",
        banned: true,
        banReason: "Spam",
        banExpires: null,
      })

      await service.banUser("admin-id", "u1", { reason: "Spam" })

      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: "u1" },
      })
    })

    it("should set ban reason and expiry", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "u1",
        email: "u@test.com",
      })
      prisma.session.deleteMany.mockResolvedValue({ count: 0 })
      prisma.user.update.mockResolvedValue({
        id: "u1",
        banned: true,
        banReason: "TOS violation",
        banExpires: new Date("2026-12-31"),
      })

      const result = await service.banUser("admin-id", "u1", {
        reason: "TOS violation",
        expiresAt: new Date("2026-12-31"),
      })

      expect(result.banned).toBe(true)
      expect(result.banReason).toBe("TOS violation")
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            banned: true,
            banReason: "TOS violation",
          }),
        }),
      )
    })

    it("should throw when user does not exist", async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(service.banUser("admin-id", "missing", {})).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe("unbanUser", () => {
    it("should clear ban fields when unbanning", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "u1",
        email: "u@test.com",
      })
      prisma.user.update.mockResolvedValue({
        id: "u1",
        banned: false,
        banReason: null,
        banExpires: null,
      })

      const result = await service.unbanUser("admin-id", "u1")

      expect(result.banned).toBe(false)
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            banned: false,
            banReason: null,
            banExpires: null,
          }),
        }),
      )
    })
  })

  describe("setRole", () => {
    it("should update user role and log the change", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "u1",
        email: "u@test.com",
      })
      prisma.user.update.mockResolvedValue({ id: "u1", role: "DOCTOR" })

      const result = await service.setRole("admin-id", "u1", "DOCTOR")

      expect(result.role).toBe("DOCTOR")
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: "DOCTOR" }),
        }),
      )
    })
  })

  describe("updateProfile", () => {
    it("should block role patching through profile update", async () => {
      await expect(
        service.updateProfile("u1", "u1", "PATIENT", { role: "ADMIN" }),
      ).rejects.toThrow(ForbiddenException)
    })
  })
})
