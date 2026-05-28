import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import { PrismaService } from "@/prisma/prisma.service"
import { RecordsService } from "./records.service"

type MockPrisma = {
  doctorProfile: {
    findUnique: jest.Mock
  }
  appointment: {
    findUnique: jest.Mock
  }
  consultation: {
    findUnique: jest.Mock
    create: jest.Mock
  }
  prescription: {
    create: jest.Mock
  }
}

describe("RecordsService", () => {
  let service: RecordsService
  let prisma: MockPrisma

  function buildMock(): MockPrisma {
    return {
      doctorProfile: {
        findUnique: jest.fn(),
      },
      appointment: {
        findUnique: jest.fn(),
      },
      consultation: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      prescription: {
        create: jest.fn(),
      },
    }
  }

  beforeEach(async () => {
    const prismaMock = buildMock()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordsService,
        {
          provide: PrismaService,
          useValue: prismaMock as unknown as PrismaService,
        },
      ],
    }).compile()

    service = module.get<RecordsService>(RecordsService)
    prisma = module.get<PrismaService>(PrismaService) as unknown as MockPrisma
  })

  it("createConsultation should throw when appointment is not completed", async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: "doc-1" })
    prisma.appointment.findUnique.mockResolvedValue({
      id: "apt-1",
      doctorId: "doc-1",
      status: "CONFIRMED",
    })

    await expect(
      service.createConsultation("doctor-user", {
        appointmentId: "apt-1",
      }),
    ).rejects.toThrow(ConflictException)
  })

  it("createConsultation should throw if consultation already exists", async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: "doc-1" })
    prisma.appointment.findUnique.mockResolvedValue({
      id: "apt-1",
      doctorId: "doc-1",
      status: "COMPLETED",
      reason: "Headache",
      symptoms: "Dizziness",
    })
    prisma.consultation.findUnique.mockResolvedValue({ id: "cons-1" })

    await expect(
      service.createConsultation("doctor-user", {
        appointmentId: "apt-1",
      }),
    ).rejects.toThrow(ConflictException)
  })

  it("createConsultation should create consultation with intake notes and prescriptions", async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: "doc-1" })
    prisma.appointment.findUnique.mockResolvedValue({
      id: "apt-1",
      doctorId: "doc-1",
      status: "COMPLETED",
      reason: "Headache",
      symptoms: "Dizziness",
    })
    prisma.consultation.findUnique.mockResolvedValue(null)
    prisma.consultation.create.mockResolvedValue({ id: "cons-1" })

    await service.createConsultation("doctor-user", {
      appointmentId: "apt-1",
      diagnosis: "Migraine",
      prescriptions: [
        {
          medicationName: "Paracetamol",
          dosage: "500mg",
          frequency: "BID",
          duration: "5 days",
        },
      ],
    })

    expect(prisma.consultation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          appointmentId: "apt-1",
          patientNotes: "Headache | Dizziness",
          diagnosis: "Migraine",
          prescriptions: {
            create: [
              expect.objectContaining({ medicationName: "Paracetamol" }),
            ],
          },
        }),
      }),
    )
  })

  it("addPrescription should throw when doctor is not assigned", async () => {
    prisma.consultation.findUnique.mockResolvedValue({
      id: "cons-1",
      appointment: { doctorId: "doc-999" },
    })
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: "doc-1" })

    await expect(
      service.addPrescription("cons-1", "doctor-user", {
        medicationName: "Drug",
        dosage: "1",
        frequency: "daily",
        duration: "3 days",
      }),
    ).rejects.toThrow(ForbiddenException)
  })

  it("getConsultationByAppointment should enforce patient ownership", async () => {
    prisma.consultation.findUnique.mockResolvedValue({
      id: "cons-1",
      appointment: {
        patientId: "patient-2",
        doctorId: "doc-1",
      },
    })

    await expect(
      service.getConsultationByAppointment("apt-1", "patient-1", "PATIENT"),
    ).rejects.toThrow(ForbiddenException)
  })

  it("getConsultationByAppointment should return null when no consultation exists", async () => {
    prisma.consultation.findUnique.mockResolvedValue(null)

    await expect(
      service.getConsultationByAppointment("apt-1", "patient-1", "PATIENT"),
    ).resolves.toBeNull()
  })

  it("addPrescription should throw when consultation is missing", async () => {
    prisma.consultation.findUnique.mockResolvedValue(null)

    await expect(
      service.addPrescription("cons-404", "doctor-user", {
        medicationName: "Drug",
        dosage: "1",
        frequency: "daily",
        duration: "3 days",
      }),
    ).rejects.toThrow(NotFoundException)
  })
})
