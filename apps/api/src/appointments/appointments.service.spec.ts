import { Test, TestingModule } from "@nestjs/testing"
import { NotFoundException, ConflictException, ForbiddenException } from "@nestjs/common"
import { AppointmentsService } from "./appointments.service"
import { PrismaService } from "@/prisma/prisma.service"

describe("AppointmentsService", () => {
  let service: AppointmentsService
  let prisma: PrismaService

  /** Build a mock PrismaService with jest.fn() on every model. */
  function buildMock(): PrismaService {
    const mock = {
      patientProfile: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      doctorProfile: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      appointment: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      availabilitySchedule: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    }
    mock.$transaction.mockImplementation((fn: any) => fn(mock))
    return mock as unknown as PrismaService
  }

  beforeEach(async () => {
    const prismaMock = buildMock()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile()

    service = module.get<AppointmentsService>(AppointmentsService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  // ─── Create (Book) Appointment ────────────────────────────────────────

  describe("create", () => {
    const userId = "patient-user-456"
    const dto = {
      doctorId: "doctor-123",
      scheduleId: "sched-1",
      startTime: "2026-05-30T09:00:00.000Z",
      endTime: "2026-05-30T09:30:00.000Z",
      type: "VIDEO" as const,
      reason: "Headache",
    }

    it("should throw NotFoundException if patient profile not found", async () => {
      ;(prisma as any).patientProfile.findUnique.mockResolvedValue(null)

      await expect(service.create(userId, dto)).rejects.toThrow(NotFoundException)
    })

    it("should throw NotFoundException if doctor does not exist", async () => {
      ;(prisma as any).patientProfile.findUnique.mockResolvedValue({ id: "pat-1", userId })
      ;(prisma as any).doctorProfile.findUnique.mockResolvedValue(null)

      await expect(service.create(userId, dto)).rejects.toThrow(NotFoundException)
    })

    it("should throw ForbiddenException if doctor is not approved", async () => {
      ;(prisma as any).patientProfile.findUnique.mockResolvedValue({ id: "pat-1", userId })
      ;(prisma as any).doctorProfile.findUnique.mockResolvedValue({
        id: dto.doctorId,
        isApproved: false,
      })

      await expect(service.create(userId, dto)).rejects.toThrow(ForbiddenException)
    })

    it("should throw NotFoundException if schedule not found for doctor", async () => {
      ;(prisma as any).patientProfile.findUnique.mockResolvedValue({ id: "pat-1", userId })
      ;(prisma as any).doctorProfile.findUnique.mockResolvedValue({
        id: dto.doctorId,
        isApproved: true,
      })
      ;(prisma as any).availabilitySchedule.findUnique.mockResolvedValue(null)

      await expect(service.create(userId, dto)).rejects.toThrow(NotFoundException)
    })

    it("should throw ConflictException if slot is already booked", async () => {
      ;(prisma as any).patientProfile.findUnique.mockResolvedValue({ id: "pat-1", userId })
      ;(prisma as any).doctorProfile.findUnique.mockResolvedValue({
        id: dto.doctorId,
        isApproved: true,
      })
      ;(prisma as any).availabilitySchedule.findUnique.mockResolvedValue({
        id: dto.scheduleId,
        doctorId: dto.doctorId,
      })
      ;(prisma as any).appointment.findFirst.mockResolvedValue({
        id: "existing-apt",
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
      })

      await expect(service.create(userId, dto)).rejects.toThrow(ConflictException)
    })

    it("should create appointment when all checks pass", async () => {
      const createdApt = {
        id: "apt-new",
        doctorId: dto.doctorId,
        patientId: userId,
        status: "BOOKED",
      }

      ;(prisma as any).patientProfile.findUnique.mockResolvedValue({ id: "pat-1", userId })
      ;(prisma as any).doctorProfile.findUnique.mockResolvedValue({
        id: dto.doctorId,
        isApproved: true,
      })
      ;(prisma as any).availabilitySchedule.findUnique.mockResolvedValue({
        id: dto.scheduleId,
        doctorId: dto.doctorId,
      })
      ;(prisma as any).appointment.findFirst.mockResolvedValue(null)
      ;(prisma as any).appointment.create.mockResolvedValue(createdApt)

      const result = await service.create(userId, dto)
      expect(result).toEqual(createdApt)
      expect((prisma as any).appointment.create).toHaveBeenCalled()
    })
  })

  // ─── FindOne ──────────────────────────────────────────────────────────

  describe("findOne", () => {
    it("should throw NotFoundException for missing appointment", async () => {
      ;(prisma as any).appointment.findUnique.mockResolvedValue(null)

      await expect(
        service.findOne("missing-id", "user-1", "PATIENT"),
      ).rejects.toThrow(NotFoundException)
    })

    it("should return appointment when patient is the owner", async () => {
      const apt = { id: "apt-1", doctorId: "doc-1", patientId: "user-1", status: "BOOKED" }
      ;(prisma as any).appointment.findUnique.mockResolvedValue(apt)

      const result = await service.findOne("apt-1", "user-1", "PATIENT")
      expect(result).toEqual(apt)
    })

    it("should return appointment for admin regardless of ownership", async () => {
      const apt = { id: "apt-1", doctorId: "doc-1", patientId: "other-user", status: "BOOKED" }
      ;(prisma as any).appointment.findUnique.mockResolvedValue(apt)

      const result = await service.findOne("apt-1", "admin-1", "ADMIN")
      expect(result).toEqual(apt)
    })

    it("should throw ForbiddenException if patient is not the owner", async () => {
      const apt = { id: "apt-1", doctorId: "doc-1", patientId: "other-user", status: "BOOKED" }
      ;(prisma as any).appointment.findUnique.mockResolvedValue(apt)

      await expect(
        service.findOne("apt-1", "user-1", "PATIENT"),
      ).rejects.toThrow(ForbiddenException)
    })
  })

  // ─── Cancel ───────────────────────────────────────────────────────────

  describe("cancel", () => {
    it("should throw NotFoundException if appointment does not exist", async () => {
      ;(prisma as any).appointment.findUnique.mockResolvedValue(null)

      await expect(
        service.cancel("nonexistent-apt", "user-1", "PATIENT"),
      ).rejects.toThrow(NotFoundException)
    })
  })
})
