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
    update: jest.Mock
    delete: jest.Mock
  }
  session: {
    findMany: jest.Mock
    findFirst: jest.Mock
    delete: jest.Mock
    deleteMany: jest.Mock
  }
}

type MockAuditLogs = {
  createLog: jest.Mock
}

type MockAlerts = {
  createAlert: jest.Mock
}

describe("UsersService", () => {
  let service: UsersService
  let prisma: MockPrisma
  let auditLogs: MockAuditLogs
  let alerts: MockAlerts

  function buildPrismaMock(): MockPrisma {
    return {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      session: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
    }
  }

  beforeEach(async () => {
    const prismaMock = buildPrismaMock()
    const auditMock: MockAuditLogs = { createLog: jest.fn() }
    const alertsMock: MockAlerts = { createAlert: jest.fn() }

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
    auditLogs = module.get<AuditLogsService>(
      AuditLogsService,
    ) as unknown as MockAuditLogs
    alerts = module.get<SecurityAlertsService>(
      SecurityAlertsService,
    ) as unknown as MockAlerts
  })

  it("findById should throw when user is missing", async () => {
    prisma.user.findUnique.mockResolvedValue(null)

    await expect(service.findById("missing")).rejects.toThrow(NotFoundException)
  })

  it("updateProfile should reject non-owner non-admin", async () => {
    await expect(
      service.updateProfile("target", "requester", "PATIENT", { name: "X" }),
    ).rejects.toThrow(ForbiddenException)
  })

  it("updateProfile should update and emit audit/security alerts", async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ id: "u1", email: "u@x.com" })
    prisma.user.update.mockResolvedValue({
      id: "u1",
      name: "New",
      role: "PATIENT",
    })

    const result = await service.updateProfile("u1", "u1", "PATIENT", {
      name: "New",
      image: "https://img",
    })

    expect(result).toEqual(expect.objectContaining({ id: "u1" }))
    expect(auditLogs.createLog).toHaveBeenCalledWith(
      "u1",
      "Updated profile",
      "u1",
    )
    expect(alerts.createAlert).toHaveBeenCalledTimes(2)
  })

  it("getActiveSessions should map sessions and mark current", async () => {
    prisma.session.findMany.mockResolvedValue([
      {
        id: "s1",
        ipAddress: "127.0.0.1",
        userAgent: "Chrome",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        expiresAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    ])

    const result = await service.getActiveSessions("u1", "s1")

    expect(result).toEqual([
      expect.objectContaining({
        id: "s1",
        isCurrent: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        expiresAt: "2026-01-02T00:00:00.000Z",
      }),
    ])
  })

  it("revokeSession should throw when session is not found", async () => {
    prisma.session.findFirst.mockResolvedValue(null)

    await expect(service.revokeSession("u1", "missing")).rejects.toThrow(
      NotFoundException,
    )
  })

  it("revokeSession should delete session and log alert", async () => {
    prisma.session.findFirst.mockResolvedValue({ id: "s1", userId: "u1" })
    prisma.session.delete.mockResolvedValue({ id: "s1" })

    await expect(service.revokeSession("u1", "s1")).resolves.toEqual({
      success: true,
    })

    expect(prisma.session.delete).toHaveBeenCalledWith({ where: { id: "s1" } })
    expect(auditLogs.createLog).toHaveBeenCalledWith(
      "u1",
      "Revoked active session",
      "u1",
      "Session ID: s1",
    )
    expect(alerts.createAlert).toHaveBeenCalledWith(
      "u1",
      "Device Session Revoked",
      "An active device session (ID: s1) was successfully revoked.",
    )
  })

  it("revokeOtherSessions should delete others and log", async () => {
    prisma.session.deleteMany.mockResolvedValue({ count: 2 })

    await expect(service.revokeOtherSessions("u1", "current")).resolves.toEqual(
      {
        success: true,
      },
    )

    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: "u1", id: { not: "current" } },
    })
    expect(auditLogs.createLog).toHaveBeenCalledWith(
      "u1",
      "Revoked other active sessions",
      "u1",
    )
  })

  it("deleteAccount should audit-log and permanently delete the user", async () => {
    prisma.user.delete.mockResolvedValue({ id: "u1" })

    const result = await service.deleteAccount("u1", "u1@x.com")

    expect(auditLogs.createLog).toHaveBeenCalledWith(
      "u1",
      "Deleted own account",
      "u1",
      undefined,
      "u1@x.com",
      "u1@x.com",
    )
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "u1" } })
    expect(result).toEqual({ success: true })
  })
})
