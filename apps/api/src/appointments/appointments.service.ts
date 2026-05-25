import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import type {
  CreateAppointmentDto,
  RescheduleAppointmentDto,
  UpdateAppointmentStatusDto,
} from "@/appointments/dto"
import { PrismaService } from "@/prisma/prisma.service"

const VALID_TRANSITIONS: Record<string, string[]> = {
  BOOKED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED", "NO_SHOW"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
}

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Book a new appointment.
   */
  async create(userId: string, dto: CreateAppointmentDto) {
    const profile = await this.prisma.patientProfile.findUnique({
      where: { userId },
    })
    if (!profile) {
      throw new NotFoundException(
        "Patient profile not found. Complete your profile first.",
      )
    }

    // Verify provider exists and is approved
    const provider = await this.prisma.providerProfile.findUnique({
      where: { id: dto.providerProfileId },
    })
    if (!provider?.isApproved) {
      throw new NotFoundException("Provider not found or not yet approved")
    }

    // Check for double-booking (overlapping appointment)
    const overlapping = await this.prisma.appointment.findFirst({
      where: {
        providerId: dto.providerProfileId,
        startTime: { lt: new Date(dto.endTime) },
        endTime: { gt: new Date(dto.startTime) },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
    })
    if (overlapping) {
      throw new ForbiddenException("This time slot is already booked")
    }

    return this.prisma.appointment.create({
      data: {
        patientId: userId,
        providerId: dto.providerProfileId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        reason: dto.reason ?? null,
        symptoms: dto.symptoms ?? null,
        type: dto.type ?? "VIDEO",
      },
      include: {
        patient: { select: { id: true, name: true, email: true } },
        provider: {
          select: {
            id: true,
            specialty: true,
            pricePerVisit: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })
  }

  /**
   * Get appointments for a patient (own).
   */
  async getPatientAppointments(userId: string) {
    return this.prisma.appointment.findMany({
      where: { patientId: userId },
      include: {
        provider: {
          select: {
            id: true,
            specialty: true,
            pricePerVisit: true,
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
      orderBy: { startTime: "desc" },
    })
  }

  /**
   * Get appointments for a provider (own schedule).
   */
  async getProviderAppointments(providerProfileId: string) {
    return this.prisma.appointment.findMany({
      where: { providerId: providerProfileId },
      include: {
        patient: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { startTime: "desc" },
    })
  }

  /**
   * Get a single appointment by ID.
   */
  async findById(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { id: true, name: true, email: true, image: true } },
        provider: {
          select: {
            id: true,
            specialty: true,
            pricePerVisit: true,
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    })
    if (!appointment) {
      throw new NotFoundException(`Appointment "${appointmentId}" not found`)
    }
    return appointment
  }

  /**
   * Update appointment status with state machine validation.
   */
  async updateStatus(
    appointmentId: string,
    userId: string,
    dto: UpdateAppointmentStatusDto,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    })
    if (!appointment) {
      throw new NotFoundException(`Appointment "${appointmentId}" not found`)
    }

    // Validate state transition
    const allowed = VALID_TRANSITIONS[appointment.status] ?? []
    if (!allowed.includes(dto.status)) {
      throw new ForbiddenException(
        `Cannot transition from "${appointment.status}" to "${dto.status}". Allowed: ${allowed.join(", ") || "none"}`,
      )
    }

    // Check permissions
    const isPatient = appointment.patientId === userId
    const _isAdmin = false // Will be checked via role later

    if (dto.status === "CANCELLED" && !isPatient) {
      // Only the patient can cancel
      throw new ForbiddenException("Only the patient can cancel an appointment")
    }

    if (
      ["CONFIRMED", "IN_PROGRESS", "COMPLETED", "NO_SHOW"].includes(dto.status)
    ) {
      // Only provider can progress forward
      const profile = await this.prisma.providerProfile.findUnique({
        where: { userId },
      })
      if (!profile || profile.id !== appointment.providerId) {
        throw new ForbiddenException(
          "Only the assigned provider can update appointment status",
        )
      }
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: dto.status },
      include: {
        patient: { select: { id: true, name: true, email: true } },
        provider: {
          select: {
            id: true,
            specialty: true,
            user: { select: { id: true, name: true } },
          },
        },
      },
    })
  }

  /**
   * Reschedule an appointment (patient or admin).
   */
  async reschedule(
    appointmentId: string,
    userId: string,
    dto: RescheduleAppointmentDto,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    })
    if (!appointment) {
      throw new NotFoundException(`Appointment "${appointmentId}" not found`)
    }
    if (appointment.patientId !== userId) {
      throw new ForbiddenException(
        "Only the patient can reschedule this appointment",
      )
    }
    if (appointment.status !== "BOOKED" && appointment.status !== "CONFIRMED") {
      throw new ForbiddenException(
        "Cannot reschedule an appointment that is already in progress or completed",
      )
    }

    // Check slot availability
    const overlapping = await this.prisma.appointment.findFirst({
      where: {
        providerId: appointment.providerId,
        id: { not: appointmentId },
        startTime: { lt: new Date(dto.endTime) },
        endTime: { gt: new Date(dto.startTime) },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
    })
    if (overlapping) {
      throw new ForbiddenException("The requested time slot is not available")
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
      },
    })
  }
}
