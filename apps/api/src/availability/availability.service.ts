import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"
import type { CreateTimeOffDto, SetAvailabilityDto } from "./dto"

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
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.availabilitySchedule.upsert({
      where: { doctorId: doctor.id },
      update: data,
      create: {
        doctorId: doctor.id,
        ...data,
      },
    })
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
    const schedule = await this.prisma.availabilitySchedule.findUnique({
      where: { doctorId },
      include: {
        appointments: {
          where: {
            status: { in: ["BOOKED", "CONFIRMED", "IN_PROGRESS"] },
            startTime: {
              gte: new Date(`${date}T00:00:00.000Z`),
              lt: new Date(`${date}T23:59:59.999Z`),
            },
          },
        },
        timeOffs: true,
      },
    })

    if (!schedule) return []

    const targetDate = new Date(date)
    const dayOfWeek = targetDate.getDay()
    const dayKey = DAY_BY_INDEX[dayOfWeek]
    if (!dayKey) return []

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

    // Check time-offs covering this date
    const dateStart = new Date(`${date}T00:00:00.000Z`)
    const dateEnd = new Date(`${date}T23:59:59.999Z`)
    const hasTimeOff = schedule.timeOffs.some(
      (to) => to.startDate <= dateEnd && to.endDate >= dateStart,
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
      // Each entry is like "09:00-17:00"
      const [startStr, endStr] = (entry as string).split("-")
      if (!startStr || !endStr) continue

      const [startH, startM] = startStr.split(":").map(Number)
      const [endH, endM] = endStr.split(":").map(Number)
      const startMinutes = (startH ?? 0) * 60 + (startM ?? 0)
      const endMinutes = (endH ?? 0) * 60 + (endM ?? 0)

      for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
        const slotStart = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
        const slotEnd = `${String(Math.floor((m + duration) / 60)).padStart(2, "0")}:${String((m + duration) % 60).padStart(2, "0")}`

        // Check if already booked
        const slotStartUTC = new Date(`${date}T${slotStart}:00.000Z`)
        const slotEndUTC = new Date(`${date}T${slotEnd}:00.000Z`)

        const isBooked = bookedTimes.some((bt) => {
          return slotStartUTC < bt.end && slotEndUTC > bt.start
        })

        if (!isBooked) {
          slots.push({
            startTime: `${date}T${slotStart}:00`,
            endTime: `${date}T${slotEnd}:00`,
            scheduleId: schedule.id,
            available: true,
          })
        }
      }
    }

    return slots
  }
}
