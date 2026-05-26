import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import type { AppointmentStatus } from "@generated/prisma/client.js"
import { PrismaService } from "@/prisma/prisma.service"
import type { CreateAppointmentDto, RescheduleAppointmentDto } from "./dto"

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(patientId: string, dto: CreateAppointmentDto) {
    // Verify provider exists and is approved
    const provider = await this.prisma.providerProfile.findUnique({
      where: { id: dto.providerId },
    })
    if (!provider) throw new NotFoundException("Provider not found")
    if (!provider.isApproved)
      throw new ForbiddenException("Provider is not approved")

    // Verify schedule belongs to provider
    const schedule = await this.prisma.availabilitySchedule.findUnique({
      where: { id: dto.scheduleId },
    })
    if (!schedule || schedule.providerId !== dto.providerId)
      throw new NotFoundException("Schedule not found for this provider")

    // Double-booking prevention
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        scheduleId: dto.scheduleId,
        status: { in: ["BOOKED", "CONFIRMED", "IN_PROGRESS"] },
        OR: [
          {
            startTime: { lt: new Date(dto.endTime) },
            endTime: { gt: new Date(dto.startTime) },
          },
        ],
      },
    })
    if (conflict)
      throw new ConflictException("This time slot is already booked")

    return this.prisma.appointment.create({
      data: {
        patientId,
        providerId: dto.providerId,
        scheduleId: dto.scheduleId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        reason: dto.reason,
        symptoms: dto.symptoms,
        type: dto.type ?? "VIDEO",
      },
      include: {
        patient: { select: { id: true, name: true, email: true } },
        provider: {
          select: {
            id: true,
            specialty: true,
            user: { select: { name: true } },
          },
        },
      },
    })
  }

  async findMyAppointments(userId: string, role: string) {
    if (role === "PROVIDER") {
      const profile = await this.prisma.providerProfile.findUnique({
        where: { userId },
      })
      if (!profile) return []
      return this.prisma.appointment.findMany({
        where: { providerId: profile.id },
        include: {
          patient: { select: { id: true, name: true, email: true } },
          provider: {
            select: {
              id: true,
              specialty: true,
              user: { select: { name: true } },
            },
          },
        },
        orderBy: { startTime: "asc" },
      })
    }

    return this.prisma.appointment.findMany({
      where: { patientId: userId },
      include: {
        patient: { select: { id: true, name: true, email: true } },
        provider: {
          select: {
            id: true,
            specialty: true,
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { startTime: "asc" },
    })
  }

  async findOne(id: string, userId: string, role: string) {
    const appt = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, name: true, email: true } },
        provider: {
          select: {
            id: true,
            specialty: true,
            user: { select: { name: true } },
          },
        },
        consultation: { include: { prescriptions: true } },
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

  async updateStatus(
    id: string,
    status: AppointmentStatus,
    userId: string,
    role: string,
  ) {
    const appt = await this.prisma.appointment.findUnique({ where: { id } })
    if (!appt) throw new NotFoundException("Appointment not found")

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
        patient: { select: { id: true, name: true, email: true } },
        provider: {
          select: {
            id: true,
            specialty: true,
            user: { select: { name: true } },
          },
        },
      },
    })
  }

  async cancel(id: string, userId: string, role: string) {
    const appt = await this.prisma.appointment.findUnique({ where: { id } })
    if (!appt) throw new NotFoundException("Appointment not found")

    if (appt.status === "COMPLETED" || appt.status === "CANCELLED")
      throw new ConflictException("Cannot cancel this appointment")

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
        patient: { select: { id: true, name: true, email: true } },
        provider: {
          select: {
            id: true,
            specialty: true,
            user: { select: { name: true } },
          },
        },
      },
    })
  }

  async reschedule(
    id: string,
    dto: RescheduleAppointmentDto,
    patientId: string,
  ) {
    const appt = await this.prisma.appointment.findUnique({ where: { id } })
    if (!appt) throw new NotFoundException("Appointment not found")
    if (appt.patientId !== patientId)
      throw new ForbiddenException("Not your appointment")
    if (appt.status === "COMPLETED" || appt.status === "CANCELLED")
      throw new ConflictException("Cannot reschedule this appointment")

    // Check new slot availability
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        scheduleId: dto.scheduleId,
        status: { in: ["BOOKED", "CONFIRMED", "IN_PROGRESS"] },
        id: { not: id },
        OR: [
          {
            startTime: { lt: new Date(dto.endTime) },
            endTime: { gt: new Date(dto.startTime) },
          },
        ],
      },
    })
    if (conflict)
      throw new ConflictException("This time slot is already booked")

    return this.prisma.appointment.update({
      where: { id },
      data: {
        scheduleId: dto.scheduleId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        status: "BOOKED",
      },
      include: {
        patient: { select: { id: true, name: true, email: true } },
        provider: {
          select: {
            id: true,
            specialty: true,
            user: { select: { name: true } },
          },
        },
      },
    })
  }
}
