import type { AppointmentStatus } from "@generated/prisma/client.js"
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"
import type { CreateAppointmentDto, RescheduleAppointmentDto } from "./dto"

const VALID_TRANSITIONS: Record<string, string[]> = {
  BOOKED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
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
      where: { id: dto.providerId },
    })
    if (!provider) {
      throw new NotFoundException("Provider not found")
    }
    if (!provider.isApproved) {
      throw new ForbiddenException("Provider is not yet approved")
    }

    // Check for double-booking (overlapping appointment)
    const overlapping = await this.prisma.appointment.findFirst({
      where: {
        providerId: dto.providerId,
        status: { in: ["BOOKED", "CONFIRMED", "IN_PROGRESS"] },
        startTime: { lt: new Date(dto.endTime) },
        endTime: { gt: new Date(dto.startTime) },
      },
    })
    if (overlapping) {
      throw new ConflictException("This time slot is already booked")
    }

    return this.prisma.appointment.create({
      data: {
        patientId: userId,
        providerId: dto.providerId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        reason: dto.reason ?? null,
        symptoms: dto.symptoms ?? null,
        type: dto.type ?? "VIDEO",
      },
      include: {
        patient: { select: { id: true, name: true, email: true, image: true } },
        provider: {
          select: {
            id: true,
            specialty: true,
            pricePerVisit: true,
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      },
    })
  }

  /**
   * List appointments for the current user (patient or provider).
   */
  async findMyAppointments(userId: string, role: string) {
    if (role === "PROVIDER") {
      const profile = await this.prisma.providerProfile.findUnique({
        where: { userId },
      })
      if (!profile) return []
      return this.prisma.appointment.findMany({
        where: { providerId: profile.id },
        include: {
          patient: {
            select: { id: true, name: true, email: true, image: true },
          },
          provider: {
            select: {
              id: true,
              specialty: true,
              pricePerVisit: true,
              user: { select: { id: true, name: true, image: true } },
            },
          },
        },
        orderBy: { startTime: "asc" },
      })
    }

    return this.prisma.appointment.findMany({
      where: { patientId: userId },
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
      orderBy: { startTime: "asc" },
    })
  }

  /**
   * Get a single appointment by ID.
   */
  async findOne(id: string, userId: string, role: string) {
    const appt = await this.prisma.appointment.findUnique({
      where: { id },
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
    if (!appt) throw new NotFoundException("Appointment not found")

    // Authorization: patient or assigned provider or admin
    if (appt.patientId !== userId && role !== "ADMIN") {
      if (role === "PROVIDER") {
        const profile = await this.prisma.providerProfile.findUnique({
          where: { userId },
        })
        if (!profile || profile.id !== appt.providerId)
          throw new ForbiddenException("Not your appointment")
      } else {
        throw new ForbiddenException("Not your appointment")
      }
    }

    return appt
  }

  /**
   * Update appointment status with state machine validation.
   */
  async updateStatus(
    id: string,
    status: AppointmentStatus,
    userId: string,
    role: string,
  ) {
    const appt = await this.prisma.appointment.findUnique({ where: { id } })
    if (!appt) throw new NotFoundException("Appointment not found")

    // Validate state transition
    const allowed = VALID_TRANSITIONS[appt.status] ?? []
    if (!allowed.includes(status)) {
      throw new ForbiddenException(
        `Cannot transition from "${appt.status}" to "${status}". Allowed: ${allowed.join(", ") || "none"}`,
      )
    }

    // Check permissions
    if (role === "PROVIDER") {
      const profile = await this.prisma.providerProfile.findUnique({
        where: { userId },
      })
      if (!profile || profile.id !== appt.providerId)
        throw new ForbiddenException("Not your appointment")
    }

    return this.prisma.appointment.update({
      where: { id },
      data: { status },
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
  }

  /**
   * Cancel an appointment.
   */
  async cancel(id: string, userId: string, role: string) {
    const appt = await this.prisma.appointment.findUnique({ where: { id } })
    if (!appt) throw new NotFoundException("Appointment not found")

    if (appt.status === "COMPLETED" || appt.status === "CANCELLED") {
      throw new ConflictException("Cannot cancel this appointment")
    }

    // Verify ownership
    if (appt.patientId !== userId && role !== "ADMIN") {
      if (role === "PROVIDER") {
        const profile = await this.prisma.providerProfile.findUnique({
          where: { userId },
        })
        if (!profile || profile.id !== appt.providerId)
          throw new ForbiddenException("Not your appointment")
      } else {
        throw new ForbiddenException("Not your appointment")
      }
    }

    return this.prisma.appointment.update({
      where: { id },
      data: { status: "CANCELLED" },
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
  }

  /**
   * Reschedule an appointment (patient).
   */
  async reschedule(
    id: string,
    dto: RescheduleAppointmentDto,
    patientId: string,
  ) {
    const appt = await this.prisma.appointment.findUnique({ where: { id } })
    if (!appt) throw new NotFoundException("Appointment not found")
    if (appt.patientId !== patientId)
      throw new ForbiddenException("Not your appointment")
    if (appt.status === "COMPLETED" || appt.status === "CANCELLED") {
      throw new ConflictException("Cannot reschedule this appointment")
    }

    // Check new slot availability
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        providerId: appt.providerId,
        status: { in: ["BOOKED", "CONFIRMED", "IN_PROGRESS"] },
        id: { not: id },
        startTime: { lt: new Date(dto.endTime) },
        endTime: { gt: new Date(dto.startTime) },
      },
    })
    if (conflict) {
      throw new ConflictException("This time slot is already booked")
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        status: "BOOKED",
      },
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
  }
}
