import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import { AuditLogsService } from "../audit-logs/audit-logs.service"
import { PrismaService } from "../prisma/prisma.service"
import type { CreateConsultationDto, CreatePrescriptionDto } from "./dto"

@Injectable()
export class RecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
  ) {}

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
      throw new ForbiddenException(
        "You are not the doctor for this appointment",
      )
    }

    // Verify the appointment is completed
    if (appointment.status !== "COMPLETED") {
      throw new ConflictException(
        "Consultation notes can only be created for completed appointments",
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

    // Preserve intake context from the appointment itself.
    // Avoid using appointment.notes because video call metadata is stored there.
    const intakeNotes = [appointment.reason, appointment.symptoms]
      .filter((value): value is string => !!value)
      .join(" | ")

    // Check for existing consultation and create atomically
    const consultation = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.consultation.findUnique({
        where: { appointmentId: dto.appointmentId },
      })
      if (existing) {
        throw new ConflictException(
          "Consultation notes already exist for this appointment",
        )
      }

      return tx.consultation.create({
        data: {
          appointmentId: dto.appointmentId,
          patientNotes: intakeNotes || null,
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
    })

    // Audit log
    await this.auditLogs.createLog(
      doctorUserId,
      "Created consultation",
      consultation.id,
      `Appointment: ${dto.appointmentId}`,
    )

    return consultation
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

    const prescription = await this.prisma.prescription.create({
      data: {
        consultationId,
        medicationName: dto.medicationName,
        dosage: dto.dosage,
        frequency: dto.frequency,
        duration: dto.duration,
        instructions: dto.instructions ?? null,
      },
    })

    // Audit log
    await this.auditLogs.createLog(
      doctorUserId,
      "Added prescription",
      consultationId,
      `${dto.medicationName} ${dto.dosage}`,
    )

    return prescription
  }

  /**
   * Check whether a doctor (by user ID) is authorized for a given doctor profile ID.
   */
  async isDoctorAuthorized(
    doctorUserId: string,
    doctorProfileId: string,
  ): Promise<boolean> {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    })
    return !!profile && profile.id === doctorProfileId
  }

  /**
   * Get a consultation by its associated appointment ID.
   */
  async getConsultationByAppointment(
    appointmentId: string,
    userId: string,
    role: string,
  ) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { appointmentId },
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
      return null
    }

    // Authorization checks
    if (role === "ADMIN") return consultation

    if (role === "PATIENT") {
      if (consultation.appointment.patientId !== userId) {
        throw new ForbiddenException("Not your medical record")
      }
      return consultation
    }

    if (role === "DOCTOR") {
      const isAuthorized = await this.isDoctorAuthorized(
        userId,
        consultation.appointment.doctorId,
      )
      if (!isAuthorized) {
        throw new ForbiddenException("Not your medical record")
      }
      return consultation
    }

    throw new ForbiddenException("Not your medical record")
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

  // ─── Doctor: Access patient records ──────────────────────────────────

  /**
   * Get all patients a doctor has seen, with appointment counts.
   */
  async getDoctorPatients(doctorUserId: string) {
    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    })
    if (!doctorProfile) {
      throw new NotFoundException("Doctor profile not found")
    }

    const appointments = await this.prisma.appointment.findMany({
      where: { doctorId: doctorProfile.id },
      select: {
        patientId: true,
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Deduplicate patients
    const patientMap = new Map<
      string,
      {
        id: string
        name: string | null
        email: string
        appointmentCount: number
      }
    >()
    for (const appt of appointments) {
      const existing = patientMap.get(appt.patientId)
      if (existing) {
        existing.appointmentCount++
      } else {
        patientMap.set(appt.patientId, {
          ...appt.patient,
          appointmentCount: 1,
        })
      }
    }
    return Array.from(patientMap.values())
  }

  /**
   * Get a patient's full medical history for the doctor.
   * Only returns records from appointments belonging to this doctor.
   */
  async getPatientRecordsForDoctor(patientId: string, doctorUserId: string) {
    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    })
    if (!doctorProfile) {
      throw new NotFoundException("Doctor profile not found")
    }

    // Get patient info
    const patient = await this.prisma.user.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        name: true,
        email: true,
        patientProfile: {
          select: {
            dob: true,
            sex: true,
            phone: true,
            address: true,
            philhealthNumber: true,
            weight: true,
            height: true,
            medicalHistory: true,
          },
        },
      },
    })
    if (!patient) {
      throw new NotFoundException("Patient not found")
    }

    // Get appointments for this doctor + patient
    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId: doctorProfile.id,
        patientId,
      },
      include: {
        consultation: {
          include: {
            prescriptions: true,
          },
        },
      },
      orderBy: { startTime: "desc" },
    })

    return { patient, appointments }
  }
}
