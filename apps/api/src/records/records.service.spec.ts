import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import { AuditLogsService } from "../audit-logs/audit-logs.service"
import { PrismaService } from "../prisma/prisma.service"
import { RecordsService } from "./records.service"

type MockPrisma = {
  doctorProfile: {
    findUnique: jest.Mock
  }
  appointment: {
    findUnique: jest.Mock
    findMany: jest.Mock
    groupBy: jest.Mock
    update: jest.Mock
  }
  consultation: {
    findUnique: jest.Mock
    findMany: jest.Mock
    count: jest.Mock
    create: jest.Mock
  }
  prescription: {
    create: jest.Mock
    findMany: jest.Mock
    count: jest.Mock
  }
  user: {
    findUnique: jest.Mock
    findMany: jest.Mock
  }
  $transaction: jest.Mock
}

describe("RecordsService", () => {
  let service: RecordsService
  let prisma: MockPrisma

  function buildMock(): MockPrisma {
    const mock: MockPrisma = {
      doctorProfile: {
        findUnique: jest.fn(),
      },
      appointment: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        groupBy: jest.fn(),
        update: jest.fn(),
      },
      consultation: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
      },
      prescription: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    }
    mock.$transaction.mockImplementation((fn: (m: MockPrisma) => unknown) =>
      fn(mock),
    )
    return mock
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
        {
          provide: AuditLogsService,
          useValue: { createLog: jest.fn() },
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

  it("getConsultationByAppointment should throw when no consultation exists", async () => {
    prisma.consultation.findUnique.mockResolvedValue(null)

    await expect(
      service.getConsultationByAppointment("apt-1", "patient-1", "PATIENT"),
    ).rejects.toThrow(NotFoundException)
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

  it("createConsultation should throw when the doctor profile is missing", async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue(null)

    await expect(
      service.createConsultation("doctor-user", {
        appointmentId: "apt-1",
        doctorNotes: "notes",
        diagnosis: null,
        plan: null,
        prescriptions: [],
      }),
    ).rejects.toThrow(NotFoundException)
  })

  it("createConsultation should throw when the appointment is missing", async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: "doc-1" })
    prisma.appointment.findUnique.mockResolvedValue(null)

    await expect(
      service.createConsultation("doctor-user", {
        appointmentId: "apt-1",
      }),
    ).rejects.toThrow(NotFoundException)
  })

  it("createConsultation should throw when the doctor is not assigned", async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: "doc-1" })
    prisma.appointment.findUnique.mockResolvedValue({
      id: "apt-1",
      doctorId: "doc-999",
      status: "COMPLETED",
    })

    await expect(
      service.createConsultation("doctor-user", {
        appointmentId: "apt-1",
      }),
    ).rejects.toThrow(ForbiddenException)
  })

  it("createConsultation should throw when the appointment is not completed", async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: "doc-1" })
    prisma.appointment.findUnique.mockResolvedValue({
      id: "apt-1",
      doctorId: "doc-1",
      status: "BOOKED",
    })

    await expect(
      service.createConsultation("doctor-user", {
        appointmentId: "apt-1",
      }),
    ).rejects.toThrow(ConflictException)
  })

  it("createConsultation should build prescriptions from the DTO", async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: "doc-1" })
    prisma.appointment.findUnique.mockResolvedValue({
      id: "apt-1",
      doctorId: "doc-1",
      status: "COMPLETED",
      reason: "headache",
      symptoms: "mild",
    })
    prisma.consultation.findUnique.mockResolvedValue(null)
    const created = { id: "cons-1", prescriptions: [] }
    prisma.consultation.create.mockResolvedValue(created)

    const result = await service.createConsultation("doctor-user", {
      appointmentId: "apt-1",
      doctorNotes: "notes",
      diagnosis: "dx",
      plan: "plan",
      prescriptions: [
        {
          medicationName: "Drug",
          dosage: "1",
          frequency: "daily",
          duration: "3 days",
          instructions: "after food",
        },
      ],
    })

    expect(result).toEqual(created)
    expect(prisma.consultation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          doctorNotes: "notes",
          diagnosis: "dx",
          plan: "plan",
          patientNotes: "headache | mild",
          prescriptions: expect.objectContaining({
            create: expect.arrayContaining([
              expect.objectContaining({ medicationName: "Drug" }),
            ]),
          }),
        }),
      }),
    )
  })

  it("getPatientRecords should return paginated consultations", async () => {
    const items = [{ id: "cons-1" }]
    prisma.consultation.findMany.mockResolvedValue(items)
    prisma.consultation.count.mockResolvedValue(1)
    prisma.$transaction.mockImplementation((arr: unknown[]) =>
      Promise.all(arr as unknown as unknown[]),
    )

    const result = await service.getPatientRecords("patient-1", 50, 0)
    expect(result).toEqual({ items, total: 1, limit: 50, offset: 0 })
    expect(prisma.consultation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50, skip: 0 }),
    )
  })

  it("getConsultation should throw when not found", async () => {
    prisma.consultation.findUnique.mockResolvedValue(null)
    await expect(service.getConsultation("cons-1")).rejects.toThrow(
      NotFoundException,
    )
  })

  it("getConsultation should return a consultation", async () => {
    const cons = { id: "cons-1", prescriptions: [] }
    prisma.consultation.findUnique.mockResolvedValue(cons)
    await expect(service.getConsultation("cons-1")).resolves.toEqual(cons)
  })

  it("addPrescription should succeed for the assigned doctor", async () => {
    prisma.consultation.findUnique.mockResolvedValue({
      id: "cons-1",
      appointment: { doctorId: "doc-1" },
    })
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: "doc-1" })
    const rx = { id: "rx-1" }
    prisma.prescription.create.mockResolvedValue(rx)

    const result = await service.addPrescription("cons-1", "doctor-user", {
      medicationName: "Drug",
      dosage: "1",
      frequency: "daily",
      duration: "3 days",
      instructions: "with food",
    })
    expect(result).toEqual(rx)
    expect(prisma.prescription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ instructions: "with food" }),
      }),
    )
  })

  it("addPrescription should throw when the doctor profile is missing", async () => {
    prisma.consultation.findUnique.mockResolvedValue({
      id: "cons-1",
      appointment: { doctorId: "doc-1" },
    })
    prisma.doctorProfile.findUnique.mockResolvedValue(null)

    await expect(
      service.addPrescription("cons-1", "doctor-user", {
        medicationName: "Drug",
        dosage: "1",
        frequency: "daily",
        duration: "3 days",
      }),
    ).rejects.toThrow(NotFoundException)
  })

  it("isDoctorAuthorized confirms identity when profile ids match", async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue({
      id: "doc-1",
      userId: "doctor-user",
    })
    await expect(
      service.isDoctorAuthorized("doctor-user", "doc-1"),
    ).resolves.toBe(true)
  })

  it("isDoctorAuthorized returns false on mismatch or missing profile", async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: "doc-other" })
    await expect(
      service.isDoctorAuthorized("doctor-user", "doc-1"),
    ).resolves.toBe(false)
  })

  it("getConsultationByAppointment lets the admin through", async () => {
    prisma.consultation.findUnique.mockResolvedValue({
      id: "cons-1",
      appointment: { id: "apt-1", patientId: "p", doctorId: "doc-1" },
    })
    const result = await service.getConsultationByAppointment(
      "apt-1",
      "admin-1",
      "ADMIN",
    )
    expect(result.id).toBe("cons-1")
  })

  it("getConsultationByAppointment lets the assigned doctor through", async () => {
    prisma.consultation.findUnique.mockResolvedValue({
      id: "cons-1",
      appointment: { id: "apt-1", patientId: "p", doctorId: "doc-1" },
    })
    prisma.doctorProfile.findUnique.mockResolvedValue({
      id: "doc-1",
      userId: "doctor-user",
    })
    const result = await service.getConsultationByAppointment(
      "apt-1",
      "doctor-user",
      "DOCTOR",
    )
    expect(result.id).toBe("cons-1")
  })

  it("getConsultationByAppointment rejects an unrelated doctor", async () => {
    prisma.consultation.findUnique.mockResolvedValue({
      id: "cons-1",
      appointment: { id: "apt-1", patientId: "p", doctorId: "doc-1" },
    })
    prisma.doctorProfile.findUnique.mockResolvedValue({
      id: "doc-other",
      userId: "doctor-user",
    })
    await expect(
      service.getConsultationByAppointment("apt-1", "doctor-user", "DOCTOR"),
    ).rejects.toThrow(ForbiddenException)
  })

  it("getConsultationByAppointment rejects unknown roles", async () => {
    prisma.consultation.findUnique.mockResolvedValue({
      id: "cons-1",
      appointment: { id: "apt-1", patientId: "p", doctorId: "doc-1" },
    })
    await expect(
      service.getConsultationByAppointment("apt-1", "user-1", "SOMETHING"),
    ).rejects.toThrow(ForbiddenException)
  })

  it("getPatientPrescriptions returns paginated prescriptions", async () => {
    const items = [{ id: "rx-1" }]
    prisma.prescription.findMany.mockResolvedValue(items)
    prisma.prescription.count.mockResolvedValue(1)
    prisma.$transaction.mockImplementation((a: unknown[]) =>
      Promise.all(a as unknown as unknown[]),
    )

    const result = await service.getPatientPrescriptions("patient-1", 10, 0)
    expect(result).toEqual({ items, total: 1, limit: 10, offset: 0 })
  })

  it("getDoctorPatients aggregates appointments per patient", async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: "doc-1" })
    prisma.appointment.groupBy
      .mockResolvedValueOnce([
        { patientId: "p1", _count: { id: 2 } },
        { patientId: "p2", _count: { id: 1 } },
      ])
      .mockResolvedValueOnce([{ patientId: "p1" }, { patientId: "p2" }])
    prisma.user.findMany.mockResolvedValue([
      { id: "p1", name: "Patient One", email: "p1@x.com" },
      { id: "p2", name: "Patient Two", email: "p2@x.com" },
    ])

    const result = await service.getDoctorPatients("doctor-user", 10, 0)
    expect(result.total).toBe(2)
    expect(result.items[0]).toEqual(
      expect.objectContaining({ id: "p1", appointmentCount: 2 }),
    )
  })

  it("getDoctorPatients throws when the doctor profile is missing", async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue(null)
    await expect(service.getDoctorPatients("doctor-user")).rejects.toThrow(
      NotFoundException,
    )
  })

  it("getPatientRecordsForDoctor forbids records without a shared appointment", async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: "doc-1" })
    prisma.appointment.findMany.mockResolvedValue([])
    await expect(
      service.getPatientRecordsForDoctor("patient-1", "doctor-user"),
    ).rejects.toThrow(ForbiddenException)
  })

  it("getPatientRecordsForDoctor returns patient history", async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: "doc-1" })
    prisma.appointment.findMany.mockResolvedValue([{ id: "apt-1" }])
    prisma.user.findUnique.mockResolvedValue({
      id: "patient-1",
      name: "Patient",
      email: "p@x.com",
      patientProfile: { dob: null },
    })

    const result = await service.getPatientRecordsForDoctor(
      "patient-1",
      "doctor-user",
    )
    expect(result.patient.id).toBe("patient-1")
    expect(result.appointments).toHaveLength(1)
  })

  it("getPatientRecordsForDoctor throws when the patient is missing", async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: "doc-1" })
    prisma.appointment.findMany.mockResolvedValue([{ id: "apt-1" }])
    prisma.user.findUnique.mockResolvedValue(null)
    await expect(
      service.getPatientRecordsForDoctor("patient-1", "doctor-user"),
    ).rejects.toThrow(NotFoundException)
  })
})
