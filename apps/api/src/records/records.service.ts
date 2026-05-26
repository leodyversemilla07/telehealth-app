import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"
import type {
  CreateConsultationDto,
  CreatePrescriptionDto,
} from "./dto"

@Injectable()
export class RecordsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a consultation (with optional prescriptions) for a completed appointment.
   * Only the doctor assigned to the appointment may create the consultation.
   */
  async createConsultation(doctorUserId: string, dto: CreateConsultationDto) {
    // Resolve doctor profile from user ID
    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    })
    if (!doctorProfile) {
      throw new NotFoundException("Doctor profile not found")
    }

    // Fetch the appointment
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
    })
    if (!appointment) {
      throw new NotFoundException("Appointment not found")
    }

    // Verify the appointment belongs to this doctor
    if (appointment.doctorId !== doctorProfile.id) {
      throw new ForbiddenException("You are not the doctor for this appointment")
    }

    // Verify the appointment is completed
    if (appointment.status !== "COMPLETED") {
      throw new ConflictException(
        "Consultation notes can only be created for completed appointments",
      )
    }

    // Check if a consultation already exists for this appointment
    const existing = await this.prisma.consultation.findUnique({
      where: { appointmentId: dto.appointmentId },
    })
    if (existing) {
      throw new ConflictException(
        "Consultation notes already exist for this appointment",
      )
    }

    // Build prescriptions data if provided
    const prescriptionsData = dto.prescriptions?.map((p) => ({
      medicationName: p.medicationName,
      dosage: p.dosage,
      frequency: p.frequency,
      duration: p.duration,
      instructions: p.instructions ?? null,
    }))

    return this.prisma.consultation.create({
      data: {
        appointmentId: dto.appointmentId,
        patientNotes: appointment.notes ?? null,
        doctorNotes: dto.doctorNotes ?? null,
        diagnosis: dto.diagnosis ?? null,
        plan: dto.plan ?? null,
        prescriptions: prescriptionsData
          ? { create: prescriptionsData }
          : undefined,
      },
      include: {
        prescriptions: true,
        appointment: {
          select: {
            id: true,
            patientId: true,
            doctorId: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    })
  }

  /**
   * Get all consultations for a patient, including prescriptions.
   */
  async getPatientRecords(patientId: string) {
    return this.prisma.consultation.findMany({
      where: {
        appointment: { patientId },
      },
      include: {
        prescriptions: true,
        appointment: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            doctor: {
              select: {
                id: true,
                specialty: true,
                user: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }

  /**
   * Get a single consultation by ID with prescriptions.
   */
  async getConsultation(id: string) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
      include: {
        prescriptions: true,
        appointment: {
          select: {
            id: true,
            patientId: true,
            doctorId: true,
            startTime: true,
            endTime: true,
            patient: { select: { id: true, name: true, email: true } },
            doctor: {
              select: {
                id: true,
                specialty: true,
                user: { select: { name: true } },
              },
            },
          },
        },
      },
    })
    if (!consultation) {
      throw new NotFoundException("Consultation not found")
    }
    return consultation
  }

  /**
   * Add a prescription to an existing consultation.
   * Only the doctor who owns the appointment may add prescriptions.
   */
  async addPrescription(
    consultationId: string,
    doctorUserId: string,
    dto: CreatePrescriptionDto,
  ) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
      include: { appointment: true },
    })
    if (!consultation) {
      throw new NotFoundException("Consultation not found")
    }

    // Verify doctor ownership
    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    })
    if (!doctorProfile) {
      throw new NotFoundException("Doctor profile not found")
    }

    if (consultation.appointment.doctorId !== doctorProfile.id) {
      throw new ForbiddenException(
        "You are not the doctor for this consultation",
      )
    }

    return this.prisma.prescription.create({
      data: {
        consultationId,
        medicationName: dto.medicationName,
        dosage: dto.dosage,
        frequency: dto.frequency,
        duration: dto.duration,
        instructions: dto.instructions ?? null,
      },
    })
  }

  /**
   * Check whether a doctor (by user ID) is authorized for a given doctor profile ID.
   */
  async isDoctorAuthorized(doctorUserId: string, doctorProfileId: string): Promise<boolean> {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    })
    return !!profile && profile.id === doctorProfileId
  }

  /**
   * Get all prescriptions for a patient across all consultations.
   */
  async getPatientPrescriptions(patientId: string) {
    return this.prisma.prescription.findMany({
      where: {
        consultation: {
          appointment: { patientId },
        },
      },
      include: {
        consultation: {
          select: {
            id: true,
            diagnosis: true,
            appointment: {
              select: {
                startTime: true,
                doctor: {
                  select: {
                    id: true,
                    specialty: true,
                    user: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }
}
