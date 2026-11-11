import { ForbiddenException, NotFoundException } from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import { AuditLogsService } from "../audit-logs/audit-logs.service"
import { SocketService } from "../notifications/socket.service"
import { PrismaService } from "../prisma/prisma.service"
import { SecurityAlertsService } from "../security-alerts/security-alerts.service"
import { StorageService } from "../storage/storage.service"
import { UsersService } from "./users.service"

type MockPrisma = {
  user: {
    findUnique: jest.Mock
    findMany: jest.Mock
    update: jest.Mock
  }
  patientProfile: { updateMany: jest.Mock }
  doctorProfile: { updateMany: jest.Mock }
  account: { deleteMany: jest.Mock }
  session: {
    findMany: jest.Mock
    findFirst: jest.Mock
    delete: jest.Mock
    deleteMany: jest.Mock
  }
  twoFactor: { deleteMany: jest.Mock }
  notificationPreference: { deleteMany: jest.Mock }
  pushSubscription: { deleteMany: jest.Mock }
  notification: { deleteMany: jest.Mock }
  securityAlert: { deleteMany: jest.Mock }
  verification: { deleteMany: jest.Mock }
  consentLog: { updateMany: jest.Mock }
  chatMessage: { updateMany: jest.Mock }
  medicalDocument: {
    findMany: jest.Mock
    updateMany: jest.Mock
  }
  review: { deleteMany: jest.Mock }
  auditLog: { create: jest.Mock; updateMany: jest.Mock }
  $transaction: jest.Mock
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
  let storage: { deleteFile: jest.Mock; listFiles: jest.Mock }
  let socket: { disconnectUser: jest.Mock }

  function buildPrismaMock(): MockPrisma {
    return {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      account: { deleteMany: jest.fn() },
      session: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      patientProfile: { updateMany: jest.fn() },
      doctorProfile: { updateMany: jest.fn() },
      twoFactor: { deleteMany: jest.fn() },
      notificationPreference: { deleteMany: jest.fn() },
      pushSubscription: { deleteMany: jest.fn() },
      notification: { deleteMany: jest.fn() },
      securityAlert: { deleteMany: jest.fn() },
      verification: { deleteMany: jest.fn() },
      consentLog: { updateMany: jest.fn() },
      chatMessage: { updateMany: jest.fn() },
      medicalDocument: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      review: { deleteMany: jest.fn() },
      auditLog: { create: jest.fn(), updateMany: jest.fn() },
      $transaction: jest.fn(),
    }
  }

  beforeEach(async () => {
    const prismaMock = buildPrismaMock()
    const auditMock: MockAuditLogs = { createLog: jest.fn() }
    const alertsMock: MockAlerts = { createAlert: jest.fn() }
    socket = { disconnectUser: jest.fn() }
    const storageMock = { deleteFile: jest.fn(), listFiles: jest.fn() }

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
        {
          provide: SocketService,
          useValue: socket as unknown as SocketService,
        },
        {
          provide: StorageService,
          useValue: storageMock as unknown as StorageService,
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
    storage = module.get<StorageService>(StorageService) as unknown as {
      deleteFile: jest.Mock
      listFiles: jest.Mock
    }
    prisma.$transaction.mockImplementation(
      async (callback: (tx: MockPrisma) => Promise<unknown>) =>
        callback(prisma),
    )
  })

  it("findById should throw when user is missing", async () => {
    prisma.user.findUnique.mockResolvedValue(null)

    await expect(service.findById("missing")).rejects.toThrow(NotFoundException)
  })

  it("updateProfile should reject non-owner non-admin", async () => {
    await expect(
      service.updateProfile("target", "requester", "PATIENT", {
        firstName: "X",
      }),
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
      firstName: "New",
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

  it("deleteAccount should anonymize direct identifiers and revoke account access", async () => {
    prisma.user.findUnique.mockResolvedValue({
      email: "u1@x.com",
      doctorProfile: null,
    })
    storage.listFiles.mockResolvedValue([
      "avatar-u1-100.jpg",
      "avatar-u1-123.png",
    ])

    const result = await service.deleteAccount("u1")

    expect(storage.listFiles).toHaveBeenCalledWith("avatar-u1-")
    expect(storage.deleteFile).toHaveBeenCalledTimes(2)
    expect(storage.deleteFile).toHaveBeenCalledWith("avatar-u1-100.jpg")
    expect(storage.deleteFile).toHaveBeenCalledWith("avatar-u1-123.png")
    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: expect.objectContaining({
        email: "deleted-u1@invalid.telehealth",
        emailVerified: false,
        mobile: null,
        image: null,
        banned: true,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      }),
    })
    expect(prisma.patientProfile.updateMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
      data: {
        phone: null,
        address: null,
        philhealthNumber: null,
      },
    })
    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
    })
    expect(prisma.account.deleteMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
    })
    expect(prisma.twoFactor.deleteMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
    })
    expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
    })
    expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
    })
    expect(prisma.verification.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [{ identifier: "u1@x.com" }, { identifier: "u1" }],
      },
    })
    expect(prisma.consentLog.updateMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
      data: { ipAddress: null },
    })
    expect(prisma.chatMessage.updateMany).toHaveBeenCalledWith({
      where: { OR: [{ senderId: "u1" }, { receiverId: "u1" }] },
      data: { content: "[Message removed with deleted account]" },
    })
    expect(prisma.medicalDocument.updateMany).toHaveBeenCalledWith({
      where: { OR: [{ patientId: "u1" }, { uploadedById: "u1" }] },
      data: { fileName: "redacted-document" },
    })
    expect(prisma.review.deleteMany).toHaveBeenCalledWith({
      where: { patientId: "u1" },
    })
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: "Anonymized own account",
        actorId: "u1",
        actorEmail: "deleted-u1@invalid.telehealth",
        targetId: "u1",
        targetEmail: "deleted-u1@invalid.telehealth",
      },
    })
    expect(auditLogs.createLog).not.toHaveBeenCalled()
    expect(socket.disconnectUser).toHaveBeenCalledWith("u1")
    expect(result).toEqual({ success: true })
  })

  it("deleteAccount should hide a doctor profile and scrub its credentials", async () => {
    prisma.user.findUnique.mockResolvedValue({
      email: "doctor@x.com",
      doctorProfile: { id: "doctor-1" },
    })
    storage.listFiles.mockResolvedValue([])

    await service.deleteAccount("doctor-user")

    expect(prisma.doctorProfile.updateMany).toHaveBeenCalledWith({
      where: { userId: "doctor-user" },
      data: expect.objectContaining({
        prcLicenseNumber: "deleted-doctor-user",
        philhealthAccreditation: null,
        pdeaS2License: null,
        bio: null,
        clinicAddress: null,
        isApproved: false,
        isVerified: false,
      }),
    })
    expect(prisma.auditLog.updateMany).toHaveBeenCalledWith({
      where: { targetId: { in: ["doctor-user", "doctor-1"] } },
      data: { targetEmail: "deleted-doctor-user@invalid.telehealth" },
    })
  })

  it("deleteAccount should keep the account when storage cleanup fails", async () => {
    prisma.user.findUnique.mockResolvedValue({
      email: "u1@x.com",
      doctorProfile: null,
    })
    storage.listFiles.mockResolvedValue(["avatar-u1-100.jpg"])
    storage.deleteFile.mockRejectedValue(new Error("S3 unavailable"))

    await expect(service.deleteAccount("u1")).rejects.toThrow("S3 unavailable")
    expect(prisma.$transaction).not.toHaveBeenCalled()
    expect(prisma.user.update).not.toHaveBeenCalled()
    expect(prisma.auditLog.create).not.toHaveBeenCalled()
  })
})
