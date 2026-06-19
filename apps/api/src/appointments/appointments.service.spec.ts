import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import { AuditLogsService } from "../audit-logs/audit-logs.service"
import { EmailService } from "../common/services/email.service"
import { NotificationsService } from "../notifications/notifications.service"
import { PrismaService } from "../prisma/prisma.service"
import { AppointmentsService } from "./appointments.service"

type MockModel = {
  patientProfile: {
    findUnique: jest.Mock
    findFirst: jest.Mock
    findMany: jest.Mock
    update: jest.Mock
  }
  doctorProfile: {
    findUnique: jest.Mock
    findFirst: jest.Mock
    findMany: jest.Mock
    update: jest.Mock
  }
  appointment: {
    create: jest.Mock
    findMany: jest.Mock
    findUnique: jest.Mock
    findFirst: jest.Mock
    update: jest.Mock
    delete: jest.Mock
    count: jest.Mock
  }
  availabilitySchedule: {
    findFirst: jest.Mock
    findUnique: jest.Mock
    findMany: jest.Mock
    create: jest.Mock
    update: jest.Mock
  }
  timeOff: {
    findFirst: jest.Mock
  }
  user: {
    findUnique: jest.Mock
    findMany: jest.Mock
    update: jest.Mock
  }
  $transaction: jest.Mock
}

describe("AppointmentsService", () => {
  let service: AppointmentsService
  let prisma: MockModel

  /** Build a mock PrismaService with jest.fn() on every model. */
  function buildMock(): MockModel {
    const mock: MockModel = {
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
      timeOff: {
        findFirst: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    }
    mock.$transaction.mockImplementation((fn: (m: MockModel) => unknown) =>
      fn(mock),
    )
    return mock
  }

  beforeEach(async () => {
    const prismaMock = buildMock()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: PrismaService,
          useValue: prismaMock as unknown as PrismaService,
        },
        {
          provide: NotificationsService,
          useValue: {
            createNotification: jest.fn(),
          },
        },
        {
          provide: AuditLogsService,
          useValue: { createLog: jest.fn() },
        },
        {
          provide: EmailService,
          useValue: {
            sendAppointmentReminder: jest.fn().mockResolvedValue(undefined),
            sendMail: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile()

    service = module.get<AppointmentsService>(AppointmentsService)
    prisma = module.get<PrismaService>(PrismaService) as unknown as MockModel
  })

  // ─── Create (Book) Appointment ────────────────────────────────────────

  describe("create", () => {
    const userId = "patient-user-456"
    const dto = {
      doctorId: "doctor-123",
      scheduleId: "sched-1",
      startTime: "2026-05-30T01:00:00.000Z",
      endTime: "2026-05-30T01:30:00.000Z",
      type: "VIDEO" as const,
      reason: "Headache",
    }

    it("should throw NotFoundException if patient profile not found", async () => {
      prisma.patientProfile.findUnique.mockResolvedValue(null)

      await expect(service.create(userId, dto)).rejects.toThrow(
        NotFoundException,
      )
    })

    it("should throw NotFoundException if doctor does not exist", async () => {
      prisma.patientProfile.findUnique.mockResolvedValue({
        id: "pat-1",
        userId,
      })
      prisma.doctorProfile.findUnique.mockResolvedValue(null)

      await expect(service.create(userId, dto)).rejects.toThrow(
        NotFoundException,
      )
    })

    it("should throw ForbiddenException if doctor is not approved", async () => {
      prisma.patientProfile.findUnique.mockResolvedValue({
        id: "pat-1",
        userId,
      })
      prisma.doctorProfile.findUnique.mockResolvedValue({
        id: dto.doctorId,
        isApproved: false,
      })

      await expect(service.create(userId, dto)).rejects.toThrow(
        ForbiddenException,
      )
    })

    it("should throw NotFoundException if schedule not found for doctor", async () => {
      prisma.patientProfile.findUnique.mockResolvedValue({
        id: "pat-1",
        userId,
      })
      prisma.doctorProfile.findUnique.mockResolvedValue({
        id: dto.doctorId,
        isApproved: true,
      })
      prisma.availabilitySchedule.findUnique.mockResolvedValue(null)

      await expect(service.create(userId, dto)).rejects.toThrow(
        NotFoundException,
      )
    })

    it("should throw ConflictException if slot is already booked", async () => {
      prisma.patientProfile.findUnique.mockResolvedValue({
        id: "pat-1",
        userId,
      })
      prisma.doctorProfile.findUnique.mockResolvedValue({
        id: dto.doctorId,
        isApproved: true,
      })
      prisma.availabilitySchedule.findUnique.mockResolvedValue({
        id: dto.scheduleId,
        doctorId: dto.doctorId,
        slotDuration: 30,
        saturday: '["09:00-17:00"]',
      })
      prisma.timeOff.findFirst.mockResolvedValue(null)
      prisma.appointment.findFirst.mockResolvedValue({
        id: "existing-apt",
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
      })

      await expect(service.create(userId, dto)).rejects.toThrow(
        ConflictException,
      )
    })

    it("should create appointment when all checks pass", async () => {
      const createdApt = {
        id: "apt-new",
        doctorId: dto.doctorId,
        patientId: userId,
        status: "BOOKED",
        type: "VIDEO",
        startTime: new Date(dto.startTime),
        patient: { id: userId, name: "Patient" },
        doctor: {
          id: dto.doctorId,
          user: { id: "doctor-user-1", name: "Doctor" },
        },
      }

      prisma.patientProfile.findUnique.mockResolvedValue({
        id: "pat-1",
        userId,
      })
      prisma.doctorProfile.findUnique.mockResolvedValue({
        id: dto.doctorId,
        isApproved: true,
      })
      prisma.availabilitySchedule.findUnique.mockResolvedValue({
        id: dto.scheduleId,
        doctorId: dto.doctorId,
        slotDuration: 30,
        saturday: '["09:00-17:00"]',
      })
      prisma.timeOff.findFirst.mockResolvedValue(null)
      prisma.appointment.findFirst.mockResolvedValue(null)
      prisma.appointment.create.mockResolvedValue(createdApt)

      const result = await service.create(userId, dto)
      expect(result).toEqual(createdApt)
      expect(prisma.appointment.create).toHaveBeenCalled()
    })
  })

  // ─── FindOne ──────────────────────────────────────────────────────────

  describe("findOne", () => {
    it("should throw NotFoundException for missing appointment", async () => {
      prisma.appointment.findUnique.mockResolvedValue(null)

      await expect(
        service.findOne("missing-id", "user-1", "PATIENT"),
      ).rejects.toThrow(NotFoundException)
    })

    it("should return appointment when patient is the owner", async () => {
      const apt = {
        id: "apt-1",
        doctorId: "doc-1",
        patientId: "user-1",
        status: "BOOKED",
      }
      prisma.appointment.findUnique.mockResolvedValue(apt)

      const result = await service.findOne("apt-1", "user-1", "PATIENT")
      expect(result).toEqual(apt)
    })

    it("should return appointment for admin regardless of ownership", async () => {
      const apt = {
        id: "apt-1",
        doctorId: "doc-1",
        patientId: "other-user",
        status: "BOOKED",
      }
      prisma.appointment.findUnique.mockResolvedValue(apt)

      const result = await service.findOne("apt-1", "admin-1", "ADMIN")
      expect(result).toEqual(apt)
    })

    it("should throw ForbiddenException if patient is not the owner", async () => {
      const apt = {
        id: "apt-1",
        doctorId: "doc-1",
        patientId: "other-user",
        status: "BOOKED",
      }
      prisma.appointment.findUnique.mockResolvedValue(apt)

      await expect(
        service.findOne("apt-1", "user-1", "PATIENT"),
      ).rejects.toThrow(ForbiddenException)
    })
  })

  // ─── Cancel ───────────────────────────────────────────────────────────

  describe("cancel", () => {
    it("should throw NotFoundException if appointment does not exist", async () => {
      prisma.appointment.findUnique.mockResolvedValue(null)

      await expect(
        service.cancel("nonexistent-apt", "user-1", "PATIENT"),
      ).rejects.toThrow(NotFoundException)
    })
  })
})
