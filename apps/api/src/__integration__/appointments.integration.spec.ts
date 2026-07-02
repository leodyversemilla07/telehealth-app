import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import { AppointmentsService } from "../appointments/appointments.service"
import { AuditLogsService } from "../audit-logs/audit-logs.service"
import { EmailService } from "../common/services/email.service"
import { NotificationsService } from "../notifications/notifications.service"
import { PrismaService } from "../prisma/prisma.service"

describe("AppointmentsService (integration logic)", () => {
  let service: AppointmentsService
  let prisma: {
    patientProfile: { findUnique: jest.Mock }
    doctorProfile: { findUnique: jest.Mock }
    availabilitySchedule: { findUnique: jest.Mock }
    timeOff: { findFirst: jest.Mock }
    appointment: {
      findFirst: jest.Mock
      findUnique: jest.Mock
      findMany: jest.Mock
      count: jest.Mock
      create: jest.Mock
      update: jest.Mock
      updateMany: jest.Mock
    }
    $transaction: jest.Mock
  }

  beforeEach(async () => {
    prisma = {
      patientProfile: { findUnique: jest.fn() },
      doctorProfile: { findUnique: jest.fn() },
      availabilitySchedule: { findUnique: jest.fn() },
      timeOff: { findFirst: jest.fn() },
      appointment: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: NotificationsService,
          useValue: { createNotification: jest.fn() },
        },
        {
          provide: AuditLogsService,
          useValue: { createLog: jest.fn() },
        },
        {
          provide: EmailService,
          useValue: { sendAppointmentReminder: jest.fn() },
        },
      ],
    }).compile()

    service = module.get(AppointmentsService)
  })

  describe("create()", () => {
    it("should throw NotFoundException if patient profile is missing", async () => {
      prisma.patientProfile.findUnique.mockResolvedValue(null)

      await expect(
        service.create("patient-1", {
          doctorId: "doc-1",
          scheduleId: "sched-1",
          startTime: "2026-07-03T10:00:00.000Z",
          endTime: "2026-07-03T10:30:00.000Z",
        }),
      ).rejects.toThrow(NotFoundException)
    })

    it("should throw NotFoundException if doctor not found", async () => {
      prisma.patientProfile.findUnique.mockResolvedValue({ userId: "p1" })
      prisma.doctorProfile.findUnique.mockResolvedValue(null)

      await expect(
        service.create("patient-1", {
          doctorId: "doc-1",
          scheduleId: "sched-1",
          startTime: "2026-07-03T10:00:00.000Z",
          endTime: "2026-07-03T10:30:00.000Z",
        }),
      ).rejects.toThrow(NotFoundException)
    })

    it("should throw ForbiddenException if doctor is not approved", async () => {
      prisma.patientProfile.findUnique.mockResolvedValue({ userId: "p1" })
      prisma.doctorProfile.findUnique.mockResolvedValue({
        id: "doc-1",
        isApproved: false,
      })

      await expect(
        service.create("patient-1", {
          doctorId: "doc-1",
          scheduleId: "sched-1",
          startTime: "2026-07-03T10:00:00.000Z",
          endTime: "2026-07-03T10:30:00.000Z",
        }),
      ).rejects.toThrow(ForbiddenException)
    })

    it("should throw ConflictException for overlapping appointment", async () => {
      prisma.patientProfile.findUnique.mockResolvedValue({ userId: "p1" })
      prisma.doctorProfile.findUnique.mockResolvedValue({
        id: "doc-1",
        isApproved: true,
      })
      prisma.availabilitySchedule.findUnique.mockResolvedValue({
        id: "sched-1",
        doctorId: "doc-1",
        monday: '["09:00-17:00"]',
        tuesday: '["09:00-17:00"]',
        wednesday: '["09:00-17:00"]',
        thursday: '["09:00-17:00"]',
        friday: '["09:00-17:00"]',
        saturday: "[]",
        sunday: "[]",
        slotDuration: 30,
      })

      // Mock the transaction to throw on overlap check
      prisma.$transaction.mockImplementation(
        async (fn: (tx: Record<string, unknown>) => Promise<unknown>) => {
          const tx = {
            timeOff: { findFirst: jest.fn().mockResolvedValue(null) },
            appointment: {
              findFirst: jest.fn().mockResolvedValue({ id: "existing" }),
            },
          }
          return fn(tx)
        },
      )

      // Use 10:00 UTC = 18:00 PHT which IS within 09:00-17:00 window? No, 18:00 > 17:00.
      // Use 01:00 UTC = 09:00 PHT which IS within 09:00-17:00 window.
      await expect(
        service.create("patient-1", {
          doctorId: "doc-1",
          scheduleId: "sched-1",
          startTime: "2026-07-03T01:00:00.000Z",
          endTime: "2026-07-03T01:30:00.000Z",
        }),
      ).rejects.toThrow(ConflictException)
    })
  })

  describe("findOne()", () => {
    it("should throw NotFoundException if appointment not found", async () => {
      prisma.appointment.findUnique.mockResolvedValue(null)

      await expect(
        service.findOne("apt-1", "user-1", "PATIENT"),
      ).rejects.toThrow(NotFoundException)
    })

    it("should throw ForbiddenException if patient is not the owner", async () => {
      prisma.appointment.findUnique.mockResolvedValue({
        id: "apt-1",
        patientId: "other-patient",
        doctorId: "doc-1",
        status: "BOOKED",
      })

      await expect(
        service.findOne("apt-1", "user-1", "PATIENT"),
      ).rejects.toThrow(ForbiddenException)
    })

    it("should allow admin to view any appointment", async () => {
      const apt = {
        id: "apt-1",
        patientId: "patient-1",
        doctorId: "doc-1",
        status: "BOOKED",
      }
      prisma.appointment.findUnique.mockResolvedValue(apt)

      const result = await service.findOne("apt-1", "admin-1", "ADMIN")
      expect(result).toEqual(apt)
    })
  })

  describe("updateStatus()", () => {
    it("should reject invalid state transitions", async () => {
      prisma.$transaction.mockImplementation(
        async (fn: (tx: Record<string, unknown>) => Promise<unknown>) => {
          const tx = {
            appointment: {
              findUnique: jest.fn().mockResolvedValue({
                id: "apt-1",
                status: "COMPLETED",
              }),
              update: jest.fn(),
            },
            doctorProfile: { findUnique: jest.fn() },
          }
          return fn(tx)
        },
      )

      await expect(
        service.updateStatus("apt-1", "CONFIRMED", "doctor-1", "DOCTOR"),
      ).rejects.toThrow(ForbiddenException)
    })
  })

  describe("cancel()", () => {
    it("should reject cancellation of completed appointments", async () => {
      prisma.$transaction.mockImplementation(
        async (fn: (tx: Record<string, unknown>) => Promise<unknown>) => {
          const tx = {
            appointment: {
              findUnique: jest.fn().mockResolvedValue({
                id: "apt-1",
                status: "COMPLETED",
                patientId: "patient-1",
              }),
              update: jest.fn(),
            },
            doctorProfile: { findUnique: jest.fn() },
          }
          return fn(tx)
        },
      )

      await expect(
        service.cancel("apt-1", "patient-1", "PATIENT"),
      ).rejects.toThrow(ConflictException)
    })
  })
})
