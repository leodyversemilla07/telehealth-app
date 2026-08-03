import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import { AuditLogsService } from "../audit-logs/audit-logs.service"
import { PrismaService } from "../prisma/prisma.service"
import { StorageService } from "../storage/storage.service"
import { DocumentsService } from "./documents.service"

type MockPrisma = {
  appointment: {
    findUnique: jest.Mock
  }
  medicalDocument: {
    create: jest.Mock
    findMany: jest.Mock
    findUnique: jest.Mock
  }
}

type MockStorage = {
  validateMimeType: jest.Mock
  validateSize: jest.Mock
  uploadFile: jest.Mock
  read: jest.Mock
  allowedMimeTypes: readonly string[]
  maxFileSize: number
}

function buildMocks() {
  const prisma: MockPrisma = {
    appointment: { findUnique: jest.fn() },
    medicalDocument: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  }
  const storage: MockStorage = {
    validateMimeType: jest.fn(() => true),
    validateSize: jest.fn(() => true),
    uploadFile: jest.fn(),
    read: jest.fn(),
    allowedMimeTypes: ["image/jpeg", "application/pdf"] as const,
    maxFileSize: 10 * 1024 * 1024,
  }
  return { prisma, storage }
}

describe("DocumentsService", () => {
  let service: DocumentsService
  let prisma: MockPrisma
  let storage: MockStorage

  beforeEach(async () => {
    const mocks = buildMocks()
    prisma = mocks.prisma
    storage = mocks.storage

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: PrismaService,
          useValue: prisma as unknown as PrismaService,
        },
        {
          provide: StorageService,
          useValue: storage as unknown as StorageService,
        },
        {
          provide: AuditLogsService,
          useValue: { createLog: jest.fn() },
        },
      ],
    }).compile()

    service = module.get<DocumentsService>(DocumentsService)
  })

  const file = (): Express.Multer.File =>
    ({
      originalname: "lab-result.pdf",
      mimetype: "application/pdf",
      size: 1024,
      buffer: Buffer.from("%PDF-1.4 test"),
    }) as Express.Multer.File

  it("upload should reject non-participants", async () => {
    prisma.appointment.findUnique.mockResolvedValue({
      id: "apt-1",
      patientId: "patient-1",
      doctor: { userId: "doctor-1" },
    })

    await expect(
      service.upload(
        "stranger-1",
        "PATIENT",
        { appointmentId: "apt-1" },
        file(),
      ),
    ).rejects.toThrow(ForbiddenException)
  })

  it("upload should reject an unknown appointment", async () => {
    prisma.appointment.findUnique.mockResolvedValue(null)

    await expect(
      service.upload("patient-1", "PATIENT", { appointmentId: "nope" }, file()),
    ).rejects.toThrow(NotFoundException)
  })

  it("upload should reject invalid mime types", async () => {
    prisma.appointment.findUnique.mockResolvedValue({
      id: "apt-1",
      patientId: "patient-1",
      doctor: { userId: "doctor-1" },
    })
    storage.validateMimeType.mockReturnValue(false)

    await expect(
      service.upload(
        "patient-1",
        "PATIENT",
        { appointmentId: "apt-1" },
        file(),
      ),
    ).rejects.toThrow(BadRequestException)
  })

  it("upload should reject oversize files", async () => {
    prisma.appointment.findUnique.mockResolvedValue({
      id: "apt-1",
      patientId: "patient-1",
      doctor: { userId: "doctor-1" },
    })
    storage.validateSize.mockReturnValue(false)

    await expect(
      service.upload(
        "patient-1",
        "PATIENT",
        { appointmentId: "apt-1" },
        file(),
      ),
    ).rejects.toThrow(BadRequestException)
  })

  it("upload should store under the medical key family and expose metadata", async () => {
    prisma.appointment.findUnique.mockResolvedValue({
      id: "apt-1",
      patientId: "patient-1",
      doctor: { userId: "doctor-1" },
    })
    storage.uploadFile.mockResolvedValue(
      "https://api.tele-health.app/uploads/medical-patient-1-1234.pdf",
    )
    prisma.medicalDocument.create.mockResolvedValue({
      id: "doc-1",
      appointmentId: "apt-1",
      type: "LAB_RESULT",
      fileName: "lab-result.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1024,
      storageKey: "medical-patient-1-1234.pdf",
      createdAt: new Date("2026-08-03T00:00:00Z"),
    })

    const result = await service.upload(
      "patient-1",
      "PATIENT",
      { appointmentId: "apt-1", type: "LAB_RESULT" },
      file(),
    )

    expect(storage.uploadFile).toHaveBeenCalledWith(
      "patient-1",
      expect.any(Buffer),
      "lab-result.pdf",
      "application/pdf",
      "medical",
    )
    expect(result.storageKey).toBeUndefined()
    expect(result.fileUrl).toBe("/api/documents/doc-1/file")
    expect(result.type).toBe("LAB_RESULT")
  })

  it("listForAppointment should enforce access for a doctor", async () => {
    prisma.appointment.findUnique.mockResolvedValue({
      id: "apt-1",
      patientId: "patient-1",
      doctor: { userId: "doctor-1" },
    })
    prisma.medicalDocument.findMany.mockResolvedValue([
      {
        id: "doc-1",
        appointmentId: "apt-1",
        type: "PRESCRIPTION",
        fileName: "rx.pdf",
        mimeType: "application/pdf",
        sizeBytes: 512,
        storageKey: "medical-...",
        createdAt: new Date("2026-08-03T00:00:00Z"),
      },
    ])

    const result = await service.listForAppointment(
      "doctor-1",
      "DOCTOR",
      "apt-1",
    )
    expect(result).toHaveLength(1)
    expect(prisma.medicalDocument.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { appointmentId: "apt-1" } }),
    )
  })

  it("listForUser should reject doctors", async () => {
    await expect(service.listForUser("doctor-1", "DOCTOR")).rejects.toThrow(
      ForbiddenException,
    )
  })

  it("getFile should reject unauthorized users and stream stored bytes", async () => {
    prisma.medicalDocument.findUnique.mockResolvedValue({
      id: "doc-1",
      appointmentId: "apt-1",
      storageKey: "medical-patient-1-1234.pdf",
      fileName: "lab-result.pdf",
      sizeBytes: 1024,
    })
    prisma.appointment.findUnique.mockResolvedValue({
      id: "apt-1",
      patientId: "patient-1",
      doctor: { userId: "doctor-1" },
    })
    storage.read.mockResolvedValue({
      data: Buffer.from("%PDF-1.4"),
      contentType: "application/pdf",
    })

    await expect(
      service.getFile("stranger", "PATIENT", "doc-1"),
    ).rejects.toThrow(ForbiddenException)

    storage.read.mockResolvedValue(null)
    await expect(
      service.getFile("doctor-1", "DOCTOR", "doc-1"),
    ).rejects.toThrow(NotFoundException)
  })
})
