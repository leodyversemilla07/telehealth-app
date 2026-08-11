import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
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
  let notifications: { createNotification: jest.Mock }
  let auditLogs: { createLog: jest.Mock }
  let email: { sendAppointmentReminder: jest.Mock; sendMail: jest.Mock }

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
    notifications = module.get(NotificationsService) as {
      createNotification: jest.Mock
    }
    auditLogs = module.get(AuditLogsService) as { createLog: jest.Mock }
    email = module.get(EmailService) as {
      sendAppointmentReminder: jest.Mock
      sendMail: jest.Mock
    }
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

  // ─── List (findMyAppointments) ───────────────────────────────────────

  describe("findMyAppointments", () => {
    const apt = {
      id: "apt-1",
      status: "BOOKED",
      startTime: "2026-08-02T00:00:00.000Z",
    }

    it("should list all appointments with default scope", async () => {
      prisma.appointment.findMany.mockResolvedValue([apt])
      prisma.appointment.count.mockResolvedValue(1)

      const result = await service.findMyAppointments(
        "user-1",
        "PATIENT",
        50,
        0,
      )

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { patientId: "user-1" },
          take: 50,
          skip: 0,
        }),
      )
      expect(result).toEqual({ items: [apt], total: 1, limit: 50, offset: 0 })
    })

    it("should filter active statuses for the upcoming scope", async () => {
      prisma.appointment.findMany.mockResolvedValue([apt])
      prisma.appointment.count.mockResolvedValue(1)

      await service.findMyAppointments("user-1", "PATIENT", 50, 0, "upcoming")

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            patientId: "user-1",
            status: { in: ["BOOKED", "CONFIRMED", "IN_PROGRESS"] },
          },
        }),
      )
    })

    it("should filter terminal statuses for the history scope", async () => {
      prisma.appointment.findMany.mockResolvedValue([apt])
      prisma.appointment.count.mockResolvedValue(1)

      await service.findMyAppointments("user-1", "PATIENT", 50, 0, "history")

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            patientId: "user-1",
            status: { in: ["COMPLETED", "CANCELLED"] },
          },
        }),
      )
    })

    it("should scope by doctor when the caller is a doctor", async () => {
      prisma.appointment.findMany.mockResolvedValue([])
      prisma.appointment.count.mockResolvedValue(0)

      await service.findMyAppointments(
        "doc-user-1",
        "DOCTOR",
        50,
        0,
        "upcoming",
      )

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            doctor: expect.objectContaining({ userId: "doc-user-1" }),
          }),
        }),
      )
    })
  })

  // ─── Cancel ───────────────────────────────────────────────────────────

  describe("cancel", () => {
    const originalWindow = process.env.CANCELLATION_WINDOW_HOURS

    afterEach(() => {
      if (originalWindow === undefined) {
        delete process.env.CANCELLATION_WINDOW_HOURS
      } else {
        process.env.CANCELLATION_WINDOW_HOURS = originalWindow
      }
      jest.clearAllMocks()
    })

    const apt = (overrides: Partial<Record<string, unknown>> = {}) => ({
      id: "apt-1",
      doctorId: "doc-1",
      patientId: "user-1",
      status: "BOOKED",
      startTime: new Date(Date.now() + 72 * 3600_000),
      patient: { id: "user-1", name: "Patient" },
      doctor: { id: "doc-1", user: { id: "doc-user-1", name: "Doctor" } },
      ...overrides,
    })

    it("should throw NotFoundException if appointment does not exist", async () => {
      prisma.appointment.findUnique.mockResolvedValue(null)

      await expect(
        service.cancel("nonexistent-apt", "user-1", "PATIENT"),
      ).rejects.toThrow(NotFoundException)
    })

    it("should throw ConflictException when appointment is completed", async () => {
      prisma.appointment.findUnique.mockResolvedValue(
        apt({ status: "COMPLETED" }),
      )
      await expect(
        service.cancel("apt-1", "user-1", "PATIENT"),
      ).rejects.toThrow(ConflictException)
    })

    it("should throw ConflictException when appointment is already cancelled", async () => {
      prisma.appointment.findUnique.mockResolvedValue(
        apt({ status: "CANCELLED" }),
      )
      await expect(
        service.cancel("apt-1", "user-1", "PATIENT"),
      ).rejects.toThrow(ConflictException)
    })

    it("should throw UnprocessableEntity within the patient cancellation window", async () => {
      process.env.CANCELLATION_WINDOW_HOURS = "1"
      prisma.appointment.findUnique.mockResolvedValue(
        apt({ startTime: new Date(Date.now() + 30 * 60_000) }),
      )

      await expect(
        service.cancel("apt-1", "user-1", "PATIENT"),
      ).rejects.toThrow(UnprocessableEntityException)
    })

    it("should allow cancellation outside the patient window (long lead time)", async () => {
      process.env.CANCELLATION_WINDOW_HOURS = "1"
      prisma.appointment.findUnique.mockResolvedValue(apt())
      prisma.appointment.update.mockResolvedValue(apt({ status: "CANCELLED" }))

      const result = await service.cancel("apt-1", "user-1", "PATIENT")
      expect(result.status).toBe("CANCELLED")
      expect(prisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: "CANCELLED" } }),
      )
    })

    it("blocks patient cancellation after the appointment has started", async () => {
      prisma.appointment.findUnique.mockResolvedValue(
        apt({ startTime: new Date(Date.now() - 60_000) }),
      )

      await expect(
        service.cancel("apt-1", "user-1", "PATIENT"),
      ).rejects.toThrow(UnprocessableEntityException)
    })

    it("allows a doctor to cancel a started appointment (bypasses patient window)", async () => {
      prisma.appointment.findUnique.mockResolvedValue(
        apt({ doctorId: "doc-1", startTime: new Date(Date.now() - 60_000) }),
      )
      prisma.doctorProfile.findUnique.mockResolvedValue({
        id: "doc-1",
        userId: "doc-user-1",
      })
      prisma.appointment.update.mockResolvedValue(apt({ status: "CANCELLED" }))

      const result = await service.cancel("apt-1", "doc-user-1", "DOCTOR")
      expect(result.status).toBe("CANCELLED")
    })

    it("should throw ForbiddenException when doctor is not the assigned doctor", async () => {
      prisma.appointment.findUnique.mockResolvedValue(
        apt({ doctorId: "doc-other" }),
      )
      prisma.doctorProfile.findUnique.mockResolvedValue({
        id: "doc-1",
        userId: "user-1",
      })

      await expect(
        service.cancel("apt-1", "doc-user-1", "DOCTOR"),
      ).rejects.toThrow(ForbiddenException)
    })

    it("should allow doctor to cancel and notify the patient", async () => {
      prisma.appointment.findUnique.mockResolvedValue(
        apt({ doctorId: "doc-1" }),
      )
      prisma.doctorProfile.findUnique.mockResolvedValue({
        id: "doc-1",
        userId: "doc-user-1",
      })
      prisma.appointment.update.mockResolvedValue(apt({ status: "CANCELLED" }))

      const result = await service.cancel("apt-1", "doc-user-1", "DOCTOR")
      expect(result.status).toBe("CANCELLED")
      // doctor cancelled (userId !== patientId) → notify patient
      expect(prisma.appointment.update).toHaveBeenCalled()
    })

    it("should allow admin to cancel regardless of ownership", async () => {
      prisma.appointment.findUnique.mockResolvedValue(apt())
      prisma.appointment.update.mockResolvedValue(apt({ status: "CANCELLED" }))

      const result = await service.cancel("apt-1", "admin-1", "ADMIN")
      expect(result.status).toBe("CANCELLED")
    })

    it("should let the patient cancel and notify the doctor", async () => {
      prisma.appointment.findUnique.mockResolvedValue(apt())
      prisma.appointment.update.mockResolvedValue(apt({ status: "CANCELLED" }))

      await service.cancel("apt-1", "user-1", "PATIENT")
      // patient cancels → doctor gets the notification
      expect(notifications.createNotification).toHaveBeenCalled()
    })

    it("should not fail the mutation if the audit log errors", async () => {
      prisma.appointment.findUnique.mockResolvedValue(apt())
      prisma.appointment.update.mockResolvedValue(apt({ status: "CANCELLED" }))
      ;(auditLogs.createLog as jest.Mock).mockRejectedValue(new Error("boom"))

      const result = await service.cancel("apt-1", "user-1", "PATIENT")
      expect(result.status).toBe("CANCELLED")
    })
  })

  // ─── Update status (state machine) ────────────────────────────────────

  describe("updateStatus", () => {
    afterEach(() => jest.clearAllMocks())

    const base = {
      id: "apt-1",
      doctorId: "doc-1",
      patientId: "user-1",
      startTime: new Date("2026-08-02T00:30:00.000Z"),
      patient: { id: "user-1", name: "Patient" },
      doctor: { id: "doc-1", user: { id: "doc-user-1", name: "Doctor" } },
    }

    const updated = (status: string) => ({
      ...base,
      status,
      patient: { id: "user-1", name: "Patient" },
      doctor: { id: "doc-1", user: { id: "doc-user-1", name: "Doctor" } },
    })

    it("should throw NotFoundException if appointment does not exist", async () => {
      prisma.appointment.findUnique.mockResolvedValue(null)
      await expect(
        service.updateStatus("apt-1", "CONFIRMED", "user-1", "PATIENT"),
      ).rejects.toThrow(NotFoundException)
    })

    it("should throw ForbiddenException for an invalid state transition", async () => {
      prisma.appointment.findUnique.mockResolvedValue({
        ...base,
        status: "BOOKED",
      })
      await expect(
        service.updateStatus("apt-1", "COMPLETED", "user-1", "PATIENT"),
      ).rejects.toThrow(ForbiddenException)
    })

    it("should throw ForbiddenException when a doctor is not the assigned doctor", async () => {
      prisma.appointment.findUnique.mockResolvedValue({
        ...base,
        status: "BOOKED",
        doctorId: "other",
      })
      prisma.doctorProfile.findUnique.mockResolvedValue({
        id: "doc-1",
        userId: "doc-user-1",
      })
      await expect(
        service.updateStatus("apt-1", "CONFIRMED", "doc-user-1", "DOCTOR"),
      ).rejects.toThrow(ForbiddenException)
    })

    it("should throw ForbiddenException when the doctor profile is missing", async () => {
      prisma.appointment.findUnique.mockResolvedValue({
        ...base,
        status: "BOOKED",
      })
      prisma.doctorProfile.findUnique.mockResolvedValue(null)
      await expect(
        service.updateStatus("apt-1", "CONFIRMED", "doc-user-1", "DOCTOR"),
      ).rejects.toThrow(ForbiddenException)
    })

    it("should confirm a BOOKED appointment and notify the patient", async () => {
      prisma.appointment.findUnique.mockResolvedValue({
        ...base,
        status: "BOOKED",
      })
      prisma.appointment.update.mockResolvedValue(updated("CONFIRMED"))

      const result = await service.updateStatus(
        "apt-1",
        "CONFIRMED",
        "user-1",
        "PATIENT",
      )
      expect(result.status).toBe("CONFIRMED")
      expect(notifications.createNotification).toHaveBeenCalled()
    })

    it("should mark an IN_PROGRESS appointment and notify", async () => {
      prisma.appointment.findUnique.mockResolvedValue({
        ...base,
        status: "CONFIRMED",
      })
      prisma.appointment.update.mockResolvedValue(updated("IN_PROGRESS"))

      const result = await service.updateStatus(
        "apt-1",
        "IN_PROGRESS",
        "user-1",
        "PATIENT",
      )
      expect(result.status).toBe("IN_PROGRESS")
    })

    it("should complete an appointment and notify", async () => {
      prisma.appointment.findUnique.mockResolvedValue({
        ...base,
        status: "IN_PROGRESS",
      })
      prisma.appointment.update.mockResolvedValue(updated("COMPLETED"))

      const result = await service.updateStatus(
        "apt-1",
        "COMPLETED",
        "user-1",
        "PATIENT",
      )
      expect(result.status).toBe("COMPLETED")
      expect(notifications.createNotification).toHaveBeenCalled()
    })

    it("should ignore a failed audit log but still return the update", async () => {
      prisma.appointment.findUnique.mockResolvedValue({
        ...base,
        status: "BOOKED",
      })
      prisma.appointment.update.mockResolvedValue(updated("CONFIRMED"))
      ;(auditLogs.createLog as jest.Mock).mockRejectedValue(new Error("boom"))

      const result = await service.updateStatus(
        "apt-1",
        "CONFIRMED",
        "user-1",
        "PATIENT",
      )
      expect(result.status).toBe("CONFIRMED")
    })
  })

  // ─── Reschedule ───────────────────────────────────────────────────────

  describe("reschedule", () => {
    afterEach(() => jest.clearAllMocks())

    const apt = (overrides: Record<string, unknown> = {}) => ({
      id: "apt-1",
      doctorId: "doc-1",
      patientId: "user-1",
      scheduleId: "sched-1",
      status: "BOOKED",
      startTime: new Date("2026-08-08T02:00:00.000Z"),
      patient: { id: "user-1", name: "Patient" },
      doctor: { id: "doc-1", user: { id: "doc-user-1", name: "Doctor" } },
      ...overrides,
    })

    const dto = {
      startTime: "2026-08-08T03:00:00.000Z",
      endTime: "2026-08-08T03:30:00.000Z",
    }

    const satSchema = {
      id: "sched-1",
      doctorId: "doc-1",
      slotDuration: 30,
      saturday: '["09:00-17:00"]',
    }

    it("should throw NotFoundException if appointment does not exist", async () => {
      prisma.appointment.findUnique.mockResolvedValue(null)
      await expect(service.reschedule("apt-1", dto, "user-1")).rejects.toThrow(
        NotFoundException,
      )
    })

    it("should throw ForbiddenException if not the patient owner", async () => {
      prisma.appointment.findUnique.mockResolvedValue(
        apt({ patientId: "someone-else" }),
      )
      await expect(service.reschedule("apt-1", dto, "user-1")).rejects.toThrow(
        ForbiddenException,
      )
    })

    it("should throw NotFoundException if schedule is missing", async () => {
      prisma.appointment.findUnique.mockResolvedValue(apt())
      prisma.availabilitySchedule.findUnique.mockResolvedValue(null)
      await expect(service.reschedule("apt-1", dto, "user-1")).rejects.toThrow(
        NotFoundException,
      )
    })

    it("should throw NotFoundException if schedule belongs to a different doctor", async () => {
      prisma.appointment.findUnique.mockResolvedValue(apt())
      prisma.availabilitySchedule.findUnique.mockResolvedValue({
        ...satSchema,
        doctorId: "other",
      })
      await expect(service.reschedule("apt-1", dto, "user-1")).rejects.toThrow(
        NotFoundException,
      )
    })

    it("should throw BadRequest for a time outside the schedule", async () => {
      prisma.appointment.findUnique.mockResolvedValue(apt())
      prisma.availabilitySchedule.findUnique.mockResolvedValue({
        ...satSchema,
        sunday: '["09:00-17:00"]',
        saturday: undefined,
      })
      await expect(service.reschedule("apt-1", dto, "user-1")).rejects.toThrow(
        BadRequestException,
      )
    })

    it("should throw ConflictException on overlapping time-off", async () => {
      prisma.appointment.findUnique.mockResolvedValue(apt())
      prisma.availabilitySchedule.findUnique.mockResolvedValue(satSchema)
      prisma.timeOff.findFirst.mockResolvedValue({ id: "to-1" })
      await expect(service.reschedule("apt-1", dto, "user-1")).rejects.toThrow(
        ConflictException,
      )
    })

    it("should throw ConflictException if current status is terminal", async () => {
      prisma.appointment.findUnique.mockResolvedValue(
        apt({ status: "COMPLETED" }),
      )
      prisma.availabilitySchedule.findUnique.mockResolvedValue(satSchema)
      prisma.timeOff.findFirst.mockResolvedValue(null)
      await expect(service.reschedule("apt-1", dto, "user-1")).rejects.toThrow(
        ConflictException,
      )
    })

    it("should throw ConflictException when the new slot is already taken", async () => {
      prisma.appointment.findUnique.mockResolvedValue(apt())
      prisma.availabilitySchedule.findUnique.mockResolvedValue(satSchema)
      prisma.timeOff.findFirst.mockResolvedValue(null)
      prisma.appointment.findFirst.mockResolvedValue({ id: "conflict-apt" })
      await expect(service.reschedule("apt-1", dto, "user-1")).rejects.toThrow(
        ConflictException,
      )
    })

    it("should reschedule successfully and clear the reminder flag", async () => {
      prisma.appointment.findUnique.mockResolvedValue(apt())
      prisma.availabilitySchedule.findUnique.mockResolvedValue(satSchema)
      prisma.timeOff.findFirst.mockResolvedValue(null)
      prisma.appointment.findFirst.mockResolvedValue(null)
      const rescheduled = apt({ startTime: new Date(dto.startTime) })
      prisma.appointment.update.mockResolvedValue(rescheduled)

      const result = await service.reschedule("apt-1", dto, "user-1")
      expect(prisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "BOOKED",
            reminderSentAt: null,
          }),
        }),
      )
      expect(result).toEqual(rescheduled)
    })
  })

  // ─── Reminder cron ────────────────────────────────────────────────────

  describe("sendUpcomingReminders", () => {
    afterEach(() => jest.clearAllMocks())

    const appt = (overrides: Record<string, unknown> = {}) => ({
      id: "apt-1",
      patientId: "user-1",
      doctorId: "doc-1",
      startTime: new Date("2026-08-02T06:00:00.000Z"),
      patient: { id: "user-1", name: "Patient", email: "patient@x.com" },
      doctor: {
        id: "doc-1",
        user: { id: "doc-user-1", name: "Doctor", email: "doc@x.com" },
      },
      ...overrides,
    })

    it("should return zero when there are no upcoming appointments", async () => {
      prisma.appointment.findMany.mockResolvedValue([])
      const result = await service.sendUpcomingReminders()
      expect(result).toEqual({ sent: 0, total: 0 })
    })

    it("should remind patient + doctor and email both", async () => {
      prisma.appointment.findMany.mockResolvedValue([appt()])
      prisma.appointment.update.mockResolvedValue(appt())

      const result = await service.sendUpcomingReminders()
      expect(result).toEqual({ sent: 1, total: 1 })
      // in-app notifications for patient + doctor
      expect(notifications.createNotification).toHaveBeenCalledTimes(2)
      // emails to patient + doctor
      expect(email.sendAppointmentReminder).toHaveBeenCalledTimes(2)
      expect(prisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { reminderSentAt: expect.any(Date) } }),
      )
    })

    it("should skip a missing patient email but still email the doctor and count it", async () => {
      prisma.appointment.findMany.mockResolvedValue([
        appt({ patient: { id: "user-1", name: "P" } }),
      ])
      prisma.appointment.update.mockResolvedValue(appt())

      const result = await service.sendUpcomingReminders()
      expect(result.sent).toBe(1)
      expect(email.sendAppointmentReminder).toHaveBeenCalledTimes(1)
    })

    it("should not fail the cron when an email send rejects", async () => {
      prisma.appointment.findMany.mockResolvedValue([appt()])
      prisma.appointment.update.mockResolvedValue(appt())
      ;(email.sendAppointmentReminder as jest.Mock)
        .mockRejectedValueOnce(new Error("smtp down"))
        .mockRejectedValueOnce(new Error("smtp down"))

      const result = await service.sendUpcomingReminders()
      expect(result.sent).toBe(1)
      expect(prisma.appointment.update).toHaveBeenCalled()
    })

    it("marks reminders sent even when one recipient's notification fails (no re-notify next hour)", async () => {
      const bad = appt({ id: "bad" })
      const ok = appt({ id: "ok" })
      prisma.appointment.findMany.mockResolvedValue([bad, ok])
      // The patient notification for `bad` fails; everything else succeeds
      ;(notifications.createNotification as jest.Mock).mockRejectedValueOnce(
        new Error("push fail"),
      )
      prisma.appointment.update.mockResolvedValue(ok)

      const result = await service.sendUpcomingReminders()
      // Both appointments are considered processed — the failure is isolated
      expect(result).toEqual({ sent: 2, total: 2 })
      // bad: patient failed, doctor succeeded; ok: both succeeded
      expect(notifications.createNotification).toHaveBeenCalledTimes(4)
      // Both appointments are marked reminded → no duplicate notifications
      expect(prisma.appointment.update).toHaveBeenCalledTimes(2)
    })
  })
})
