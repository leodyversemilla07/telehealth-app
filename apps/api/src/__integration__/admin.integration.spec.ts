import { ForbiddenException, NotFoundException } from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import { AdminService } from "../admin/admin.service"
import { AuditLogsService } from "../audit-logs/audit-logs.service"
import { DoctorsService } from "../doctors/doctors.service"
import { NotificationsService } from "../notifications/notifications.service"
import { PrismaService } from "../prisma/prisma.service"
import { SecurityAlertsService } from "../security-alerts/security-alerts.service"
import { UsersService } from "../users/users.service"

describe("AdminService (integration logic)", () => {
  let service: AdminService
  let prisma: Record<string, jest.Mock | Record<string, jest.Mock>>
  let usersServiceMock: {
    findAll: jest.Mock
    findById: jest.Mock
    setRole: jest.Mock
    updateProfile: jest.Mock
    banUser: jest.Mock
    unbanUser: jest.Mock
  }
  let doctorsServiceMock: {
    findAll: jest.Mock
    approve: jest.Mock
    reject: jest.Mock
  }

  function createMockPrisma() {
    return {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        update: jest.fn(),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      doctorProfile: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        update: jest.fn(),
      },
      appointment: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      auditLog: {
        findMany: jest.fn().mockResolvedValue([]),
        groupBy: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
      },
      notification: { create: jest.fn() },
      securityAlert: { create: jest.fn() },
      $transaction: jest.fn(),
    }
  }

  beforeEach(async () => {
    prisma = createMockPrisma()

    usersServiceMock = {
      findAll: jest.fn(),
      findById: jest.fn(),
      setRole: jest.fn(),
      updateProfile: jest.fn(),
      banUser: jest.fn(),
      unbanUser: jest.fn(),
    }

    doctorsServiceMock = {
      findAll: jest.fn(),
      approve: jest.fn(),
      reject: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogsService, useValue: { createLog: jest.fn() } },
        {
          provide: NotificationsService,
          useValue: { createNotification: jest.fn() },
        },
        {
          provide: SecurityAlertsService,
          useValue: { createAlert: jest.fn() },
        },
        { provide: UsersService, useValue: usersServiceMock },
        { provide: DoctorsService, useValue: doctorsServiceMock },
      ],
    }).compile()

    service = module.get(AdminService)
  })

  describe("getDashboardStats()", () => {
    it("should return aggregated dashboard statistics", async () => {
      ;(prisma.user.count as jest.Mock)
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(50) // totalPatients
        .mockResolvedValueOnce(5) // bannedUsers
      ;(prisma.doctorProfile.count as jest.Mock)
        .mockResolvedValueOnce(20) // totalDoctors
        .mockResolvedValueOnce(3) // pendingDoctors
        .mockResolvedValueOnce(17) // approvedDoctors
      ;(prisma.appointment.count as jest.Mock).mockResolvedValueOnce(500)

      const stats = await service.getDashboardStats()

      expect(stats.totalUsers).toBe(100)
      expect(stats.totalDoctors).toBe(20)
      expect(stats.totalPatients).toBe(50)
      expect(stats.totalAppointments).toBe(500)
      expect(stats.pendingDoctors).toBe(3)
      expect(stats.approvedDoctors).toBe(17)
      expect(stats.bannedUsers).toBe(5)
      expect(stats.recentAppointments).toEqual([])
    })
  })

  describe("setRole()", () => {
    it("should delegate to usersService.setRole", async () => {
      usersServiceMock.setRole.mockResolvedValue({
        id: "target-1",
        role: "DOCTOR",
      })

      const result = await service.setRole("admin-1", "target-1", "DOCTOR")

      expect(usersServiceMock.setRole).toHaveBeenCalledWith(
        "admin-1",
        "target-1",
        "DOCTOR",
      )
      expect(result.role).toBe("DOCTOR")
    })

    it("should propagate NotFoundException from usersService", async () => {
      usersServiceMock.setRole.mockRejectedValue(
        new NotFoundException("User not found"),
      )

      await expect(
        service.setRole("admin-1", "nonexistent", "DOCTOR"),
      ).rejects.toThrow(NotFoundException)
    })

    it("should propagate ForbiddenException from usersService", async () => {
      usersServiceMock.setRole.mockRejectedValue(
        new ForbiddenException("Cannot set admin role"),
      )

      await expect(
        service.setRole("admin-1", "target-1", "ADMIN"),
      ).rejects.toThrow(ForbiddenException)
    })
  })

  describe("approveDoctor()", () => {
    it("should delegate to doctorsService.approve", async () => {
      doctorsServiceMock.approve.mockResolvedValue({
        id: "doc-1",
        isApproved: true,
      })

      const result = await service.approveDoctor("doc-1", "admin-1")

      expect(doctorsServiceMock.approve).toHaveBeenCalledWith("doc-1")
      expect(result.isApproved).toBe(true)
    })

    it("should propagate NotFoundException from doctorsService", async () => {
      doctorsServiceMock.approve.mockRejectedValue(
        new NotFoundException("Doctor not found"),
      )

      await expect(
        service.approveDoctor("nonexistent", "admin-1"),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe("getReports()", () => {
    it("should return aggregated report data", async () => {
      ;(prisma.appointment.groupBy as jest.Mock)
        .mockResolvedValueOnce([
          { status: "COMPLETED", _count: { id: 300 } },
          { status: "CANCELLED", _count: { id: 50 } },
        ])
        .mockResolvedValueOnce([
          { type: "VIDEO", _count: { id: 350 } },
          { type: "PHONE", _count: { id: 100 } },
        ])
      ;(prisma.user.groupBy as jest.Mock).mockResolvedValueOnce([
        { role: "PATIENT", _count: { id: 80 } },
        { role: "DOCTOR", _count: { id: 15 } },
        { role: "ADMIN", _count: { id: 5 } },
      ])
      ;(prisma.appointment.count as jest.Mock)
        .mockResolvedValueOnce(500) // total
        .mockResolvedValueOnce(300) // completed
        .mockResolvedValueOnce(50) // cancelled

      const reports = await service.getReports()

      expect(reports).toHaveProperty("appointmentsByStatus")
      expect(reports).toHaveProperty("appointmentsByType")
      expect(reports).toHaveProperty("usersByRole")
      expect(reports.totalAppointments).toBe(500)
      expect(reports.completedAppointments).toBe(300)
      expect(reports.cancelledAppointments).toBe(50)
      expect(reports.completionRate).toBe(60)
      expect(reports.cancellationRate).toBe(10)
    })
  })
})
