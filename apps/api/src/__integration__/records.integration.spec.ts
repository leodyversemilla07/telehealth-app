import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import { AuditLogsService } from "../audit-logs/audit-logs.service"
import { PrismaService } from "../prisma/prisma.service"
import { RecordsService } from "../records/records.service"

describe("RecordsService (integration logic)", () => {
  let service: RecordsService
  let prisma: {
    doctorProfile: { findUnique: jest.Mock }
    appointment: { findUnique: jest.Mock }
    consultation: {
      findUnique: jest.Mock
      create: jest.Mock
      findMany: jest.Mock
    }
    prescription: { findMany: jest.Mock }
    $transaction: jest.Mock
  }

  beforeEach(async () => {
    prisma = {
      doctorProfile: { findUnique: jest.fn() },
      appointment: { findUnique: jest.fn() },
      consultation: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
      prescription: { findMany: jest.fn() },
      $transaction: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordsService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: AuditLogsService,
          useValue: { createLog: jest.fn() },
        },
      ],
    }).compile()

    service = module.get(RecordsService)
  })

  describe("createConsultation()", () => {
    it("should throw NotFoundException if doctor profile not found", async () => {
      prisma.doctorProfile.findUnique.mockResolvedValue(null)

      await expect(
        service.createConsultation("doctor-user-1", {
          appointmentId: "apt-1",
        }),
      ).rejects.toThrow(NotFoundException)
    })

    it("should throw NotFoundException if appointment not found", async () => {
      prisma.doctorProfile.findUnique.mockResolvedValue({ id: "doc-1" })
      prisma.appointment.findUnique.mockResolvedValue(null)

      await expect(
        service.createConsultation("doctor-user-1", {
          appointmentId: "apt-1",
        }),
      ).rejects.toThrow(NotFoundException)
    })

    it("should throw ForbiddenException if doctor is not assigned to appointment", async () => {
      prisma.doctorProfile.findUnique.mockResolvedValue({ id: "doc-1" })
      prisma.appointment.findUnique.mockResolvedValue({
        id: "apt-1",
        doctorId: "doc-other",
        status: "COMPLETED",
      })

      await expect(
        service.createConsultation("doctor-user-1", {
          appointmentId: "apt-1",
        }),
      ).rejects.toThrow(ForbiddenException)
    })

    it("should throw ConflictException if appointment is not completed", async () => {
      prisma.doctorProfile.findUnique.mockResolvedValue({ id: "doc-1" })
      prisma.appointment.findUnique.mockResolvedValue({
        id: "apt-1",
        doctorId: "doc-1",
        status: "CONFIRMED",
      })

      await expect(
        service.createConsultation("doctor-user-1", {
          appointmentId: "apt-1",
        }),
      ).rejects.toThrow(ConflictException)
    })

    it("should throw ConflictException if consultation already exists", async () => {
      prisma.doctorProfile.findUnique.mockResolvedValue({ id: "doc-1" })
      prisma.appointment.findUnique.mockResolvedValue({
        id: "apt-1",
        doctorId: "doc-1",
        status: "COMPLETED",
        reason: "Headache",
        symptoms: "Persistent headache for 3 days",
        notes: null,
      })

      prisma.$transaction.mockImplementation(
        async (fn: (tx: Record<string, unknown>) => Promise<unknown>) => {
          const tx = {
            consultation: {
              findUnique: jest.fn().mockResolvedValue({ id: "existing" }),
            },
          }
          return fn(tx)
        },
      )

      await expect(
        service.createConsultation("doctor-user-1", {
          appointmentId: "apt-1",
          doctorNotes: "Follow up needed",
        }),
      ).rejects.toThrow(ConflictException)
    })

    it("should create consultation successfully", async () => {
      prisma.doctorProfile.findUnique.mockResolvedValue({ id: "doc-1" })
      prisma.appointment.findUnique.mockResolvedValue({
        id: "apt-1",
        doctorId: "doc-1",
        status: "COMPLETED",
        reason: "Headache",
        symptoms: "Persistent headache",
        notes: null,
      })

      const mockConsultation = {
        id: "consult-1",
        appointmentId: "apt-1",
        doctorNotes: "Follow up needed",
        prescriptions: [],
      }

      prisma.$transaction.mockImplementation(
        async (fn: (tx: Record<string, unknown>) => Promise<unknown>) => {
          const tx = {
            consultation: {
              findUnique: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockResolvedValue(mockConsultation),
            },
          }
          return fn(tx)
        },
      )

      const result = await service.createConsultation("doctor-user-1", {
        appointmentId: "apt-1",
        doctorNotes: "Follow up needed",
      })

      expect(result.id).toBe("consult-1")
    })
  })
})
