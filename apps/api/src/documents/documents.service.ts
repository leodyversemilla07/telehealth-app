import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import { AuditLogsService } from "../audit-logs/audit-logs.service"
import { PrismaService } from "../prisma/prisma.service"
import { StorageService } from "../storage/storage.service"
import type { DocumentType, UploadDocumentDto } from "./dto/upload-document.dto"

export type UserRole = "PATIENT" | "DOCTOR" | "ADMIN"

/** Private docs are uploaded with the `medical` key family and streamed
 * through the authenticated API — never a public S3 URL. */
const MEDICAL_KEY_PREFIX = "medical"

/** Extract the object key from the /uploads/<key> URL returned by storage. */
function keyFromUrl(url: string): string {
  const marker = "/uploads/"
  const idx = url.indexOf(marker)
  if (idx === -1) {
    throw new Error("Unexpected upload URL returned by storage")
  }
  return url.slice(idx + marker.length)
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  /**
   * Authorize a user for an appointment's documents and return the patient id.
   * Only the appointment's patient, its assigned doctor, or an admin may access.
   */
  private async assertAppointmentAccess(
    userId: string,
    role: UserRole,
    appointmentId: string,
  ): Promise<string> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { patientId: true, doctor: { select: { userId: true } } },
    })
    if (!appointment) {
      throw new NotFoundException("Appointment not found")
    }
    const isPatient = appointment.patientId === userId
    const isDoctor = appointment.doctor.userId === userId
    if (role !== "ADMIN" && !isPatient && !isDoctor) {
      throw new ForbiddenException("You do not have access to this appointment")
    }
    return appointment.patientId
  }

  async upload(
    userId: string,
    role: UserRole,
    dto: UploadDocumentDto,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException("No file provided")
    }
    const patientId = await this.assertAppointmentAccess(
      userId,
      role,
      dto.appointmentId,
    )
    if (!this.storage.validateMimeType(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Only ${this.storage.allowedMimeTypes.join(", ")} are allowed.`,
      )
    }
    if (!this.storage.validateSize(file.size)) {
      throw new BadRequestException(
        `File is too large. Max allowed size is ${this.storage.maxFileSize / 1024 / 1024}MB.`,
      )
    }

    const url = await this.storage.uploadFile(
      userId,
      file.buffer,
      file.originalname,
      file.mimetype,
      MEDICAL_KEY_PREFIX,
    )
    const storageKey = keyFromUrl(url)
    const type: DocumentType = dto.type ?? "OTHER"

    const doc = await this.prisma.medicalDocument.create({
      data: {
        appointmentId: dto.appointmentId,
        patientId,
        uploadedById: userId,
        fileName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storageKey,
        type,
      },
    })

    await this.auditLogs.createLog(
      userId,
      `Uploaded medical document (${type})`,
      dto.appointmentId,
      file.originalname,
    )

    return this.toDto(doc)
  }

  async listForAppointment(
    userId: string,
    role: UserRole,
    appointmentId: string,
  ) {
    await this.assertAppointmentAccess(userId, role, appointmentId)
    const docs = await this.prisma.medicalDocument.findMany({
      where: { appointmentId },
      orderBy: { createdAt: "desc" },
    })
    return docs.map((d) => this.toDto(d))
  }

  async listForUser(userId: string, role: UserRole) {
    if (role !== "PATIENT" && role !== "ADMIN") {
      throw new ForbiddenException("Only patients can list personal documents")
    }
    const docs = await this.prisma.medicalDocument.findMany({
      where: { patientId: userId },
      orderBy: { createdAt: "desc" },
    })
    return docs.map((d) => this.toDto(d))
  }

  async getFile(userId: string, role: UserRole, id: string) {
    const doc = await this.prisma.medicalDocument.findUnique({
      where: { id },
    })
    if (!doc) {
      throw new NotFoundException("Document not found")
    }
    await this.assertAppointmentAccess(userId, role, doc.appointmentId)
    const read = await this.storage.read(doc.storageKey)
    if (!read) {
      throw new NotFoundException("File not found in storage")
    }
    return {
      data: read.data,
      contentType: read.contentType,
      fileName: doc.fileName,
      sizeBytes: doc.sizeBytes,
    }
  }

  private toDto(doc: {
    id: string
    appointmentId: string
    type: DocumentType
    fileName: string
    mimeType: string
    sizeBytes: number
    createdAt: Date
  }) {
    return {
      id: doc.id,
      appointmentId: doc.appointmentId,
      type: doc.type,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      createdAt: doc.createdAt,
      fileUrl: `/api/documents/${doc.id}/file`,
    }
  }
}
