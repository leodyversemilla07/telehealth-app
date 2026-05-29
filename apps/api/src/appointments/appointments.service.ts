import type { AppointmentStatus } from "@generated/prisma/client.js"
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common"
import { formatPHTFull } from "@workspace/shared"
import { AuditLogsService } from "@/audit-logs/audit-logs.service"
import { NotificationsService } from "@/notifications/notifications.service"
import { PrismaService } from "@/prisma/prisma.service"
import type { CreateAppointmentDto, RescheduleAppointmentDto } from "./dto"

const VALID_TRANSITIONS: Record<string, string[]> = {
  BOOKED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
}

const DOCTOR_INCLUDE = {
  select: {
    id: true,
    specialty: true,
    pricePerVisit: true,
    user: { select: { id: true, name: true, email: true, image: true } },
  },
}

const PATIENT_INCLUDE = {
  select: { id: true, name: true, email: true, image: true },
}

type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday"

const DAY_BY_INDEX: Record<number, DayKey> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
}

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  private parseIsoTimeRange(startIso: string, endIso: string) {
    const start = new Date(startIso)
    const end = new Date(endIso)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException("Invalid appointment datetime")
    }

    if (end <= start) {
      throw new BadRequestException("endTime must be later than startTime")
    }

    return { start, end }
  }

  private parseScheduleWindows(
    raw: string,
  ): Array<{ start: number; end: number }> {
    try {
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []

      const windows: Array<{ start: number; end: number }> = []

      for (const entry of parsed) {
        if (typeof entry !== "string") continue
        const [startStr, endStr] = entry.split("-")
        if (!startStr || !endStr) continue

        const [startH, startM] = startStr.split(":").map(Number)
        const [endH, endM] = endStr.split(":").map(Number)

        if (
          [startH, startM, endH, endM].some(
            (value) => Number.isNaN(value) || value === undefined,
          )
        ) {
          continue
        }

        const start = (startH ?? 0) * 60 + (startM ?? 0)
        const end = (endH ?? 0) * 60 + (endM ?? 0)

        if (end > start) {
          windows.push({ start, end })
        }
      }

      return windows
    } catch {
      return []
    }
  }

  private isWithinSchedule(
    schedule: Record<string, unknown> & { slotDuration: number },
    start: Date,
    end: Date,
  ): boolean {
    if (
      start.getUTCFullYear() !== end.getUTCFullYear() ||
      start.getUTCMonth() !== end.getUTCMonth() ||
      start.getUTCDate() !== end.getUTCDate()
    ) {
      return false
    }

    // Convert UTC day to PHT day (UTC+8) — schedule is stored in PHT
    const phtDate = new Date(start.getTime() + 8 * 60 * 60 * 1000)
    const dayKey = DAY_BY_INDEX[phtDate.getUTCDay()]
    if (!dayKey) return false

    const rawDaySchedule = schedule[dayKey]
    if (typeof rawDaySchedule !== "string") return false

    const windows = this.parseScheduleWindows(rawDaySchedule)
    if (windows.length === 0) return false

    // Convert appointment times to PHT minutes for comparison with schedule windows
    const phtStartMinutes = phtDate.getUTCHours() * 60 + phtDate.getUTCMinutes()
    const phtEndDate = new Date(end.getTime() + 8 * 60 * 60 * 1000)
    const phtEndMinutes =
      phtEndDate.getUTCHours() * 60 + phtEndDate.getUTCMinutes()
    const duration = phtEndMinutes - phtStartMinutes

    if (duration <= 0) return false

    return windows.some((window) => {
      const insideWindow =
        phtStartMinutes >= window.start && phtEndMinutes <= window.end
      const slotAligned =
        (phtStartMinutes - window.start) % schedule.slotDuration === 0 &&
        duration % schedule.slotDuration === 0
      return insideWindow && slotAligned
    })
  }

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

    const { start, end } = this.parseIsoTimeRange(dto.startTime, dto.endTime)

    // Verify doctor exists and is approved
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: dto.doctorId },
    })
    if (!doctor) throw new NotFoundException("Doctor not found")
    if (!doctor.isApproved) {
      throw new ForbiddenException("Doctor is not yet approved")
    }

    // Verify schedule belongs to doctor
    const schedule = await this.prisma.availabilitySchedule.findUnique({
      where: { id: dto.scheduleId },
    })
    if (!schedule || schedule.doctorId !== dto.doctorId)
      throw new NotFoundException("Schedule not found for this doctor")

    if (!this.isWithinSchedule(schedule, start, end)) {
      throw new BadRequestException(
        "Selected appointment time is outside doctor availability",
      )
    }

    const overlappingTimeOff = await this.prisma.timeOff.findFirst({
      where: {
        scheduleId: schedule.id,
        startDate: { lt: end },
        endDate: { gt: start },
      },
    })

    if (overlappingTimeOff) {
      throw new ConflictException(
        "Doctor is unavailable during the selected time window",
      )
    }

    // Check for double-booking and create appointment atomically
    const appointment = await this.prisma.$transaction(async (tx) => {
      const overlapping = await tx.appointment.findFirst({
        where: {
          doctorId: dto.doctorId,
          status: { in: ["BOOKED", "CONFIRMED", "IN_PROGRESS"] },
          startTime: { lt: end },
          endTime: { gt: start },
        },
      })
      if (overlapping) {
        throw new ConflictException("This time slot is already booked")
      }

      return tx.appointment.create({
        data: {
          patientId: userId,
          doctorId: dto.doctorId,
          scheduleId: dto.scheduleId,
          startTime: start,
          endTime: end,
          reason: dto.reason ?? null,
          symptoms: dto.symptoms ?? null,
          type: dto.type ?? "VIDEO",
        },
        include: {
          patient: PATIENT_INCLUDE,
          doctor: DOCTOR_INCLUDE,
        },
      })
    })

    // Audit log
    await this.auditLogs.createLog(
      userId,
      "Booked appointment",
      appointment.id,
      `Type: ${appointment.type}`,
    )

    // Trigger push notifications
    try {
      const formattedTime = formatPHTFull(appointment.startTime)
      // Notify the Doctor
      await this.notifications.createNotification(
        appointment.doctor.user.id,
        "APPOINTMENT_CONFIRMATION",
        "New Appointment Booked",
        `Patient ${appointment.patient.name ?? "Someone"} has booked a ${appointment.type.toLowerCase()} consultation with you on ${formattedTime}.`,
      )
      // Notify the Patient
      await this.notifications.createNotification(
        appointment.patientId,
        "APPOINTMENT_CONFIRMATION",
        "Appointment Booked Successfully",
        `Your ${appointment.type.toLowerCase()} consultation with Dr. ${appointment.doctor.user.name ?? "Doctor"} is booked for ${formattedTime}.`,
      )
    } catch (err) {
      this.logger.error("Failed to send booking notifications:", err)
    }

    return appointment
  }

  /**
   * List appointments for the current user (patient or doctor).
   */
  async findMyAppointments(userId: string, role: string) {
    if (role === "DOCTOR") {
      const profile = await this.prisma.doctorProfile.findUnique({
        where: { userId },
      })
      if (!profile) return []
      return this.prisma.appointment.findMany({
        where: { doctorId: profile.id },
        include: {
          patient: PATIENT_INCLUDE,
          doctor: DOCTOR_INCLUDE,
        },
        orderBy: { startTime: "asc" },
      })
    }

    return this.prisma.appointment.findMany({
      where: { patientId: userId },
      include: {
        patient: PATIENT_INCLUDE,
        doctor: DOCTOR_INCLUDE,
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
        patient: PATIENT_INCLUDE,
        doctor: DOCTOR_INCLUDE,
      },
    })
    if (!appt) throw new NotFoundException("Appointment not found")

    // Authorization: patient or assigned doctor or admin
    if (appt.patientId !== userId && role !== "ADMIN") {
      if (role === "DOCTOR") {
        const profile = await this.prisma.doctorProfile.findUnique({
          where: { userId },
        })
        if (!profile || profile.id !== appt.doctorId)
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
    if (role === "DOCTOR") {
      const profile = await this.prisma.doctorProfile.findUnique({
        where: { userId },
      })
      if (!profile || profile.id !== appt.doctorId)
        throw new ForbiddenException("Not your appointment")
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        patient: PATIENT_INCLUDE,
        doctor: DOCTOR_INCLUDE,
      },
    })

    // Audit log
    await this.auditLogs.createLog(
      userId,
      `Appointment status -> ${status}`,
      id,
      `From: ${appt.status}`,
    )

    // Trigger status change notifications
    try {
      const formattedTime = formatPHTFull(updated.startTime)
      const doctorName = updated.doctor.user.name ?? "Doctor"
      if (status === "CONFIRMED") {
        await this.notifications.createNotification(
          updated.patientId,
          "APPOINTMENT_CONFIRMATION",
          "Appointment Confirmed",
          `Your consultation on ${formattedTime} has been confirmed by Dr. ${doctorName}.`,
        )
      } else if (status === "IN_PROGRESS") {
        await this.notifications.createNotification(
          updated.patientId,
          "APPOINTMENT_REMINDER",
          "Consultation Started",
          `Your consultation room with Dr. ${doctorName} is ready. Join the call now!`,
        )
      } else if (status === "COMPLETED") {
        await this.notifications.createNotification(
          updated.patientId,
          "SYSTEM",
          "Consultation Completed",
          `Your consultation with Dr. ${doctorName} has ended. You can view your medical records under the Medical Records tab.`,
        )
      }
    } catch (err) {
      this.logger.error("Failed to send status update notifications:", err)
    }

    return updated
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
      if (role === "DOCTOR") {
        const profile = await this.prisma.doctorProfile.findUnique({
          where: { userId },
        })
        if (!profile || profile.id !== appt.doctorId)
          throw new ForbiddenException("Not your appointment")
      } else {
        throw new ForbiddenException("Not your appointment")
      }
    }

    const cancelled = await this.prisma.appointment.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: {
        patient: PATIENT_INCLUDE,
        doctor: DOCTOR_INCLUDE,
      },
    })

    // Audit log
    await this.auditLogs.createLog(
      userId,
      "Cancelled appointment",
      id,
      `Original status: ${appt.status}`,
    )

    // Trigger cancellation notification
    try {
      const formattedTime = formatPHTFull(cancelled.startTime)
      if (userId === cancelled.patientId) {
        // Patient cancelled -> Notify doctor
        await this.notifications.createNotification(
          cancelled.doctor.user.id,
          "APPOINTMENT_CANCELLED",
          "Appointment Cancelled by Patient",
          `Patient ${cancelled.patient.name ?? "Someone"} has cancelled the appointment scheduled for ${formattedTime}.`,
        )
      } else {
        // Doctor or admin cancelled -> Notify patient
        await this.notifications.createNotification(
          cancelled.patientId,
          "APPOINTMENT_CANCELLED",
          "Appointment Cancelled",
          `Your appointment with Dr. ${cancelled.doctor.user.name ?? "Doctor"} scheduled for ${formattedTime} has been cancelled.`,
        )
      }
    } catch (err) {
      this.logger.error("Failed to send cancellation notifications:", err)
    }

    return cancelled
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

    const { start, end } = this.parseIsoTimeRange(dto.startTime, dto.endTime)

    const schedule = await this.prisma.availabilitySchedule.findUnique({
      where: { id: appt.scheduleId },
    })

    if (!schedule || schedule.doctorId !== appt.doctorId) {
      throw new NotFoundException("Schedule not found for this doctor")
    }

    if (!this.isWithinSchedule(schedule, start, end)) {
      throw new BadRequestException(
        "Selected appointment time is outside doctor availability",
      )
    }

    const overlappingTimeOff = await this.prisma.timeOff.findFirst({
      where: {
        scheduleId: schedule.id,
        startDate: { lt: end },
        endDate: { gt: start },
      },
    })

    if (overlappingTimeOff) {
      throw new ConflictException(
        "Doctor is unavailable during the selected time window",
      )
    }

    // Check new slot availability
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        doctorId: appt.doctorId,
        status: { in: ["BOOKED", "CONFIRMED", "IN_PROGRESS"] },
        id: { not: id },
        startTime: { lt: end },
        endTime: { gt: start },
      },
    })
    if (conflict) {
      throw new ConflictException("This time slot is already booked")
    }

    const rescheduled = await this.prisma.appointment.update({
      where: { id },
      data: {
        startTime: start,
        endTime: end,
        status: "BOOKED",
      },
      include: {
        patient: PATIENT_INCLUDE,
        doctor: DOCTOR_INCLUDE,
      },
    })

    // Audit log
    await this.auditLogs.createLog(
      patientId,
      "Rescheduled appointment",
      id,
      `New: ${dto.startTime}`,
    )

    // Trigger reschedule notification to the doctor
    try {
      const formattedTime = formatPHTFull(rescheduled.startTime)
      await this.notifications.createNotification(
        rescheduled.doctor.user.id,
        "SCHEDULE_UPDATED",
        "Appointment Rescheduled",
        `Patient ${rescheduled.patient.name ?? "Someone"} has rescheduled their appointment. New slot: ${formattedTime}.`,
      )
    } catch (err) {
      this.logger.error("Failed to send reschedule notification:", err)
    }

    return rescheduled
  }

  /**
   * Send reminders for appointments happening in the next 24 hours.
   * Can be called by a cron job or manually.
   */
  async sendUpcomingReminders() {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const upcoming = await this.prisma.appointment.findMany({
      where: {
        status: { in: ["BOOKED", "CONFIRMED"] },
        startTime: { gte: now, lte: tomorrow },
      },
      include: {
        patient: PATIENT_INCLUDE,
        doctor: DOCTOR_INCLUDE,
      },
    })

    let sent = 0
    for (const appt of upcoming) {
      try {
        const formattedTime = formatPHTFull(appt.startTime)
        const doctorName = appt.doctor.user.name ?? "Doctor"
        const patientName = appt.patient.name ?? "Patient"

        // Notify patient
        await this.notifications.createNotification(
          appt.patientId,
          "APPOINTMENT_REMINDER",
          "Upcoming Appointment Reminder",
          `Your consultation with Dr. ${doctorName} is scheduled for ${formattedTime}.`,
        )

        // Notify doctor
        await this.notifications.createNotification(
          appt.doctor.user.id,
          "APPOINTMENT_REMINDER",
          "Upcoming Appointment Reminder",
          `You have a consultation with ${patientName} scheduled for ${formattedTime}.`,
        )

        sent++
      } catch (err) {
        this.logger.error(
          `Failed to send reminder for appointment ${appt.id}:`,
          err,
        )
      }
    }

    return { sent, total: upcoming.length }
  }
}
