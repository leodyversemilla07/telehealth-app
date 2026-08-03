import { Test, type TestingModule } from "@nestjs/testing"
import { PrismaService } from "../prisma/prisma.service"
import { AuditLogsService } from "./audit-logs.service"

type MockPrisma = {
  user: {
    findUnique: jest.Mock
  }
  auditLog: {
    create: jest.Mock
    findMany: jest.Mock
    count: jest.Mock
  }
  $transaction: jest.Mock
}

function buildPrismaMock(): MockPrisma {
  return {
    user: { findUnique: jest.fn() },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  }
}

describe("AuditLogsService", () => {
  let service: AuditLogsService
  let prisma: MockPrisma

  beforeEach(async () => {
    const prismaMock = buildPrismaMock()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile()

    service = module.get<AuditLogsService>(AuditLogsService)
    prisma = module.get<PrismaService>(PrismaService) as unknown as MockPrisma
  })

  describe("createLog", () => {
    it("should skip DB lookups when both emails are provided", async () => {
      prisma.auditLog.create.mockResolvedValue({ id: "log-1" })

      const result = await service.createLog(
        "u1",
        "User Login",
        "u2",
        "reason",
        "actor@test.com",
        "target@test.com",
      )

      expect(result).toEqual({ id: "log-1" })
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: "User Login",
          actorId: "u1",
          actorEmail: "actor@test.com",
          targetId: "u2",
          targetEmail: "target@test.com",
          reason: "reason",
        },
      })
    })

    it("should resolve the actor email from the database when omitted", async () => {
      prisma.user.findUnique.mockResolvedValue({ email: "resolved@test.com" })
      prisma.auditLog.create.mockResolvedValue({ id: "log-2" })

      await service.createLog("u1", "User Logout", undefined, undefined)

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "u1" },
        select: { email: true },
      })
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ actorEmail: "resolved@test.com" }),
        }),
      )
    })

    it("should resolve the target email when targetId is given", async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ email: "actor@test.com" })
        .mockResolvedValueOnce({ email: "target@test.com" })
      prisma.auditLog.create.mockResolvedValue({ id: "log-3" })

      await service.createLog("u1", "Ban User", "u2", "policy")

      expect(prisma.user.findUnique).toHaveBeenCalledTimes(2)
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: "Ban User",
          actorId: "u1",
          actorEmail: "actor@test.com",
          targetId: "u2",
          targetEmail: "target@test.com",
          reason: "policy",
        },
      })
    })

    it("should default unknown emails and null fields", async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      prisma.auditLog.create.mockResolvedValue({ id: "log-4" })

      await service.createLog("missing-user", "Some Action")

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: "Some Action",
          actorId: "missing-user",
          actorEmail: "unknown@system",
          targetId: null,
          targetEmail: null,
          reason: null,
        },
      })
    })
  })

  describe("getLogs", () => {
    it("should return items, total, limit and offset", async () => {
      const items = [{ id: "a1" }, { id: "a2" }]
      prisma.$transaction.mockResolvedValue([items, 7])

      const result = await service.getLogs(2, 10)

      expect(result).toEqual({ items, total: 7, limit: 2, offset: 10 })
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        take: 2,
        skip: 10,
        orderBy: { timestamp: "desc" },
      })
    })

    it("should apply default pagination when omitted", async () => {
      prisma.$transaction.mockResolvedValue([[], 0])

      const result = await service.getLogs()

      expect(result).toEqual({ items: [], total: 0, limit: 50, offset: 0 })
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        take: 50,
        skip: 0,
        orderBy: { timestamp: "desc" },
      })
    })
  })
})
