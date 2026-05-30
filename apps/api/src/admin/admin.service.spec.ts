import { NotFoundException } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import { AuditLogsService } from "../audit-logs/audit-logs.service"
import { DoctorsService } from "../doctors/doctors.service"
import { PrismaService } from "../prisma/prisma.service"
import { UsersService } from "../users/users.service"
import { AdminService } from "./admin.service"

type MockService<T> = { [K in keyof T]: jest.Mock }

type MockUsersService = MockService<
  Pick<
    UsersService,
    | "findAll"
    | "findById"
    | "updateProfile"
    | "banUser"
    | "unbanUser"
    | "setRole"
  >
>
type MockDoctorsService = MockService<
  Pick<DoctorsService, "findAll" | "approve" | "reject">
>

describe("AdminService", () => {
  let service: AdminService
  let usersService: MockUsersService
  let doctorsService: MockDoctorsService
  let prisma: {
    user: { count: jest.Mock }
    doctorProfile: { count: jest.Mock }
    appointment: { count: jest.Mock; findMany: jest.Mock }
  }

  beforeEach(async () => {
    const usersMock: MockUsersService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      updateProfile: jest.fn(),
      banUser: jest.fn(),
      unbanUser: jest.fn(),
      setRole: jest.fn(),
    }

    const doctorsMock: MockDoctorsService = {
      findAll: jest.fn(),
      approve: jest.fn(),
      reject: jest.fn(),
    }

    const prismaMock = {
      user: { count: jest.fn() },
      doctorProfile: { count: jest.fn() },
      appointment: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
    }

    const auditLogsMock = { createLog: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: UsersService, useValue: usersMock },
        { provide: DoctorsService, useValue: doctorsMock },
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditLogsService, useValue: auditLogsMock },
      ],
    }).compile()

    service = module.get<AdminService>(AdminService)
    usersService = usersMock
    doctorsService = doctorsMock
    prisma = prismaMock
  })

  // ─── User management ─────────────────────────────────────────────────

  describe("listUsers", () => {
    it("should delegate to usersService.findAll", async () => {
      const users = [{ id: "1", name: "Admin" }]
      usersService.findAll.mockResolvedValue(users)

      const result = await service.listUsers()
      expect(result).toEqual(users)
      expect(usersService.findAll).toHaveBeenCalled()
    })
  })

  describe("getUser", () => {
    it("should delegate to usersService.findById", async () => {
      const user = { id: "1", name: "Admin" }
      usersService.findById.mockResolvedValue(user)

      const result = await service.getUser("1")
      expect(result).toEqual(user)
    })

    it("should throw NotFoundException when user not found", async () => {
      usersService.findById.mockRejectedValue(new NotFoundException())

      await expect(service.getUser("missing")).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe("banUser", () => {
    it("should delegate to usersService.banUser", async () => {
      const result = { id: "1", banned: true }
      usersService.banUser.mockResolvedValue(result)

      const banned = await service.banUser("actor-1", "target-1", {
        reason: "Spam",
      })
      expect(banned).toEqual(result)
      expect(usersService.banUser).toHaveBeenCalledWith("actor-1", "target-1", {
        reason: "Spam",
      })
    })
  })

  describe("setRole", () => {
    it("should delegate to usersService.setRole", async () => {
      const result = { id: "1", role: "DOCTOR" }
      usersService.setRole.mockResolvedValue(result)

      const updated = await service.setRole("actor-1", "target-1", "DOCTOR")
      expect(updated).toEqual(result)
      expect(usersService.setRole).toHaveBeenCalledWith(
        "actor-1",
        "target-1",
        "DOCTOR",
      )
    })
  })

  // ─── Doctor management ───────────────────────────────────────────────

  describe("listAllDoctors", () => {
    it("should delegate to doctorsService.findAll", async () => {
      const doctors = [{ id: "doc-1", isApproved: false }]
      doctorsService.findAll.mockResolvedValue(doctors)

      const result = await service.listAllDoctors()
      expect(result).toEqual(doctors)
    })
  })

  describe("approveDoctor", () => {
    it("should delegate to doctorsService.approve", async () => {
      const result = { id: "doc-1", isApproved: true }
      doctorsService.approve.mockResolvedValue(result)

      const approved = await service.approveDoctor("doc-1", "admin-1")
      expect(approved).toEqual(result)
    })
  })

  describe("rejectDoctor", () => {
    it("should delegate to doctorsService.reject", async () => {
      const result = { id: "doc-1", isApproved: false }
      doctorsService.reject.mockResolvedValue(result)

      const rejected = await service.rejectDoctor("doc-1", "admin-1")
      expect(rejected).toEqual(result)
    })
  })

  // ─── Dashboard stats ─────────────────────────────────────────────────

  describe("getDashboardStats", () => {
    it("should aggregate counts from Prisma", async () => {
      // Mock all 8 Promise.all queries
      prisma.user.count
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(70) // totalPatients
        .mockResolvedValueOnce(3) // bannedUsers
      prisma.doctorProfile.count
        .mockResolvedValueOnce(30) // totalDoctors
        .mockResolvedValueOnce(5) // pendingDoctors
        .mockResolvedValueOnce(25) // approvedDoctors
      prisma.appointment.count.mockResolvedValueOnce(500) // totalAppointments
      prisma.appointment.findMany.mockResolvedValueOnce([]) // recentAppointments

      const stats = await service.getDashboardStats()

      expect(stats).toEqual({
        totalUsers: 100,
        totalDoctors: 30,
        totalPatients: 70,
        totalAppointments: 500,
        pendingDoctors: 5,
        approvedDoctors: 25,
        bannedUsers: 3,
        recentAppointments: [],
      })

      // Verify all queries ran in parallel (Promise.all)
      expect(prisma.user.count).toHaveBeenCalledTimes(3)
      expect(prisma.doctorProfile.count).toHaveBeenCalledTimes(3)
      expect(prisma.appointment.count).toHaveBeenCalledTimes(1)
      expect(prisma.appointment.findMany).toHaveBeenCalledTimes(1)
    })
  })
})
