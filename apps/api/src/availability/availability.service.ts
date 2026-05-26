import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
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

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertSchedule(userId: string, dto: SetAvailabilityDto) {
    const provider = await this.prisma.providerProfile.findUnique({
      where: { userId },
    })
    if (!provider) throw new NotFoundException("Provider profile not found")

    const data: Record<string, unknown> = {}
    const days: DayKey[] = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ]
    for (const day of days) {
      if (dto[day] !== undefined) data[day] = dto[day]
    }
    if (dto.slotDuration !== undefined) data.slotDuration = dto.slotDuration

    return this.prisma.availabilitySchedule.upsert({
      where: { providerId: provider.id },
      update: data,
      create: {
        providerId: provider.id,
        ...data,
      },
    })
  }

  async getSchedule(providerId: string) {
    const schedule = await this.prisma.availabilitySchedule.findUnique({
      where: { providerId },
      include: { timeOffs: true },
    })
    if (!schedule) throw new NotFoundException("Schedule not found")
    return schedule
  }

  async addTimeOff(userId: string, dto: CreateTimeOffDto) {
    const provider = await this.prisma.providerProfile.findUnique({
      where: { userId },
    })
    if (!provider) throw new NotFoundException("Provider profile not found")

    const schedule = await this.prisma.availabilitySchedule.findUnique({
      where: { providerId: provider.id },
    })
    if (!schedule)
      throw new NotFoundException(
        "Schedule not found — set availability first",
      )

    return this.prisma.timeOff.create({
      data: {
        scheduleId: schedule.id,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        reason: dto.reason,
      },
    })
  }

  async removeTimeOff(userId: string, timeOffId: string) {
    const timeOff = await this.prisma.timeOff.findUnique({
      where: { id: timeOffId },
      include: { schedule: true },
    })
    if (!timeOff) throw new NotFoundException("Time-off entry not found")

    const provider = await this.prisma.providerProfile.findUnique({
      where: { userId },
    })
    if (!provider || provider.id !== timeOff.schedule.providerId)
      throw new ForbiddenException("Not your schedule")

    return this.prisma.timeOff.delete({ where: { id: timeOffId } })
  }

  /**
   * Compute available slots for a given date.
   * Parses the provider's JSON schedule for that weekday,
   * then excludes already-booked appointments and time-offs.
   */
  async getAvailableSlots(providerId: string, date: string) {
    const schedule = await this.prisma.availabilitySchedule.findUnique({
      where: { providerId },
      include: {
        appointments: {
          where: {
            status: { in: ["BOOKED", "CONFIRMED", "IN_PROGRESS"] },
            startTime: {
              gte: new Date(`${date}T00:00:00.000Z`),
              lt: new Date(`${date}T23:59:59.999Z`),
            },
          },
          select: { startTime: true, endTime: true },
        },
        timeOffs: {
          where: {
            startDate: { lte: new Date(`${date}T23:59:59.999Z`) },
            endDate: { gte: new Date(`${date}T00:00:00.000Z`) },
          },
        },
      },
    })
    if (!schedule) throw new NotFoundException("Schedule not found")

    // If the provider has a time-off covering this date, return no slots
    if (schedule.timeOffs.length > 0) return []

    const d = new Date(`${date}T12:00:00Z`)
    const dayIndex = d.getUTCDay() // 0=Sun, 1=Mon, ...
    const dayMap: Record<number, DayKey> = {
      1: "monday",
      2: "tuesday",
      3: "wednesday",
      4: "thursday",
      5: "friday",
      6: "saturday",
      0: "sunday",
    }
    const dayName = dayMap[dayIndex]
    if (!dayName) return []

    const daySlots: string[][] = JSON.parse(
      (schedule[dayName] as string) || "[]",
    )
    if (daySlots.length === 0) return []

    const slotDuration = schedule.slotDuration || 30
    const slots: { startTime: string; endTime: string; available: boolean }[] =
      []

  for (const [open, close] of daySlots) {
    if (!open || !close) continue
    const parts = open.split(":")
    const cparts = close.split(":")
    const oh = Number(parts[0]) || 0
    const om = Number(parts[1]) || 0
    const ch = Number(cparts[0]) || 0
    const cm = Number(cparts[1]) || 0
    let current = oh * 60 + om
      const end = ch * 60 + cm

      while (current + slotDuration <= end) {
        const slotStart = new Date(
          `${date}T${String(Math.floor(current / 60)).padStart(2, "0")}:${String(current % 60).padStart(2, "0")}:00.000Z`,
        )
        const slotEnd = new Date(
          `${date}T${String(Math.floor((current + slotDuration) / 60)).padStart(2, "0")}:${String((current + slotDuration) % 60).padStart(2, "0")}:00.000Z`,
        )

        // Check if slot overlaps with any existing appointment
        const isBooked = schedule.appointments.some(
          (a) => a.startTime < slotEnd && a.endTime > slotStart,
        )

        slots.push({
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          available: !isBooked,
        })

        current += slotDuration
      }
    }

    return slots
  }
}
