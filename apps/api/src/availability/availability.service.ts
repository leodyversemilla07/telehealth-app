import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common"
import { NotificationsService } from "../notifications/notifications.service"
import { PrismaService } from "../prisma/prisma.service"
import type { CreateTimeOffDto, SetAvailabilityDto } from "./dto"

/**
 * Convert a PHT date string ("YYYY-MM-DD") to the UTC date range
 * that covers the full day in PHT (00:00 PHT to 23:59:59.999 PHT).
 */
function phtDateToUTCRange(date: string): { start: Date; end: Date } {
  // PHT midnight = UTC 16:00 previous day
  const phtMidnight = new Date(`${date}T00:00:00.000+08:00`)
  const phtEndOfDay = new Date(`${date}T23:59:59.999+08:00`)
  return { start: phtMidnight, end: phtEndOfDay }
}

/**
 * Get the day of week for a PHT date string.
 * Uses Intl to avoid server timezone issues.
 */
function getPHTDayOfWeek(date: string): string {
  const phtDate = new Date(`${date}T12:00:00.000+08:00`)
  const dayIndex = phtDate.getDay()
  return DAY_BY_INDEX[dayIndex] ?? "monday"
}

/**
 * Convert a PHT time ("HH:mm") on a given PHT date to a UTC Date.
 */
function phtTimeToUTC(date: string, time: string): Date {
  return new Date(`${date}T${time}:00.000+08:00`)
}

type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday"

const DAYS: DayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]

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
export class AvailabilityService {
  private readonly logger = new Logger(AvailabilityService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Get the doctor profile from a user ID, or throw.
   */
  private async getDoctorProfile(userId: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId },
    })
    if (!profile) {
      throw new NotFoundException("Doctor profile not found")
    }
    return profile
  }

  /**
   * Set (upsert) weekly availability schedule for a doctor.
   */
  async setAvailability(userId: string, dto: SetAvailabilityDto) {
    const doctor = await this.getDoctorProfile(userId)

    const data: Record<string, unknown> = {}
    for (const day of DAYS) {
      const value = dto[day]
      if (value !== undefined) {
        data[day] = typeof value === "string" ? value : JSON.stringify(value)
      }
    }
    if (dto.slotDuration !== undefined) {
      data.slotDuration = dto.slotDuration
    }

    const result = await this.prisma.availabilitySchedule.upsert({
      where: { doctorId: doctor.id },
      update: data,
      create: {
        doctorId: doctor.id,
        ...data,
      },
    })

    // Notify about schedule update
    try {
      const activeDays = DAYS.filter((day) => {
        const val = dto[day]
        if (!val) return false
        try {
          const parsed = typeof val === "string" ? JSON.parse(val) : val
          return Array.isArray(parsed) && parsed.length > 0
        } catch {
          return false
        }
      })

      await this.notifications.createNotification(
        userId,
        "SCHEDULE_UPDATED",
        "Schedule Updated",
        `Your weekly availability has been updated. Active days: ${activeDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ") || "None"}.`,
      )
    } catch (err) {
      this.logger.error("Failed to send schedule update notification:", err)
    }

    return result
  }

  /**
   * Get my availability schedule.
   */
  async getMyAvailability(userId: string) {
    const doctor = await this.getDoctorProfile(userId)
    const schedule = await this.prisma.availabilitySchedule.findUnique({
      where: { doctorId: doctor.id },
      include: { timeOffs: true },
    })
    if (!schedule) {
      throw new NotFoundException("Schedule not found — set availability first")
    }
    return schedule
  }

  /**
   * Get a doctor's schedule (public).
   */
  async getSchedule(doctorId: string) {
    const schedule = await this.prisma.availabilitySchedule.findUnique({
      where: { doctorId },
      include: { timeOffs: true },
    })
    if (!schedule) throw new NotFoundException("Schedule not found")
    return schedule
  }

  /**
   * Create a time-off block.
   */
  async createTimeOff(userId: string, dto: CreateTimeOffDto) {
    const doctor = await this.getDoctorProfile(userId)

    const schedule = await this.prisma.availabilitySchedule.findUnique({
      where: { doctorId: doctor.id },
    })
    if (!schedule) {
      throw new NotFoundException("Schedule not found — set availability first")
    }

    const startDate = new Date(dto.startDate)
    const endDate = new Date(dto.endDate)
    if (endDate <= startDate) {
      throw new BadRequestException("endDate must be after startDate")
    }

    // Check for overlapping time-off blocks
    const overlapping = await this.prisma.timeOff.findFirst({
      where: {
        scheduleId: schedule.id,
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
    })
    if (overlapping) {
      throw new ConflictException(
        "Time-off period overlaps with an existing block",
      )
    }

    return this.prisma.timeOff.create({
      data: {
        scheduleId: schedule.id,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        reason: dto.reason,
      },
    })
  }

  /**
   * Get time-off blocks for the current doctor.
   */
  async getTimeOff(userId: string) {
    const doctor = await this.getDoctorProfile(userId)
    const schedule = await this.prisma.availabilitySchedule.findUnique({
      where: { doctorId: doctor.id },
    })
    if (!schedule) return []
    return this.prisma.timeOff.findMany({
      where: { scheduleId: schedule.id },
      orderBy: { startDate: "asc" },
    })
  }

  /**
   * Delete a time-off block.
   */
  async deleteTimeOff(userId: string, timeOffId: string) {
    const doctor = await this.getDoctorProfile(userId)
    const entry = await this.prisma.timeOff.findUnique({
      where: { id: timeOffId },
      include: { schedule: true },
    })
    if (!entry) {
      throw new NotFoundException(`Time-off entry "${timeOffId}" not found`)
    }
    if (entry.schedule.doctorId !== doctor.id) {
      throw new ForbiddenException("You can only delete your own time off")
    }
    await this.prisma.timeOff.delete({ where: { id: timeOffId } })
    return { success: true }
  }

  /**
   * Compute available slots for a given date.
   * Parses the doctor's JSON schedule for that weekday,
   * then excludes already-booked appointments and time-offs.
   */
  async getAvailableSlots(doctorId: string, date: string) {
    // Convert PHT date to UTC range for DB queries
    const { start: phtDayStart, end: phtDayEnd } = phtDateToUTCRange(date)

    const schedule = await this.prisma.availabilitySchedule.findUnique({
      where: { doctorId },
      include: {
        appointments: {
          where: {
            status: { in: ["BOOKED", "CONFIRMED", "IN_PROGRESS"] },
            startTime: { gte: phtDayStart, lt: phtDayEnd },
          },
        },
        timeOffs: true,
      },
    })

    if (!schedule) return []

    // Get day of week in PHT timezone (not server timezone)
    const dayKey = getPHTDayOfWeek(date)

    const daySlots: string[] = (() => {
      try {
        return JSON.parse(
          ((schedule as Record<string, unknown>)[dayKey] as string) || "[]",
        )
      } catch {
        return []
      }
    })()

    if (daySlots.length === 0) return []

    // Check time-offs covering this date (compare in PHT date range)
    const hasTimeOff = schedule.timeOffs.some(
      (to) => to.startDate <= phtDayEnd && to.endDate >= phtDayStart,
    )
    if (hasTimeOff) return []

    // Generate time slots from the JSON schedule entries
    const duration = schedule.slotDuration
    const bookedTimes = schedule.appointments.map((apt) => ({
      start: apt.startTime,
      end: apt.endTime,
    }))

    const slots: {
      startTime: string
      endTime: string
      scheduleId: string
      available: boolean
    }[] = []

    for (const entry of daySlots) {
      // Each entry is like "09:00-17:00" in PHT
      const [startStr, endStr] = (entry as string).split("-")
      if (!startStr || !endStr) continue

      // Parse PHT times directly (no conversion needed for slot iteration)
      const [startH, startM] = startStr.split(":").map(Number)
      const [endH, endM] = endStr.split(":").map(Number)
      const startMinutes = (startH ?? 0) * 60 + (startM ?? 0)
      const endMinutes = (endH ?? 0) * 60 + (endM ?? 0)

      for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
        const slotStartH = Math.floor(m / 60)
        const slotStartM = m % 60
        const slotEndH = Math.floor((m + duration) / 60)
        const slotEndM = (m + duration) % 60

        // Slot times in PHT (displayed to user)
        const slotStartPHT = `${String(slotStartH).padStart(2, "0")}:${String(slotStartM).padStart(2, "0")}`
        const slotEndPHT = `${String(slotEndH).padStart(2, "0")}:${String(slotEndM).padStart(2, "0")}`

        // Convert to UTC for overlap check with booked appointments (stored as UTC)
        const slotStartUTC = phtTimeToUTC(date, slotStartPHT)
        const slotEndUTC = phtTimeToUTC(date, slotEndPHT)

        const isBooked = bookedTimes.some((bt) => {
          return slotStartUTC < bt.end && slotEndUTC > bt.start
        })

        if (!isBooked) {
          slots.push({
            startTime: `${date}T${slotStartPHT}:00`,
            endTime: `${date}T${slotEndPHT}:00`,
            scheduleId: schedule.id,
            available: true,
          })
        }
      }
    }

    return slots
  }
}
