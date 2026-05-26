import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"
import type { CreateTimeOffDto, SetAvailabilityDto } from "./dto"

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get the provider profile ID from a user ID, or throw.
   */
  private async getProviderProfile(userId: string) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    })
    if (!profile) {
      throw new NotFoundException("Provider profile not found")
    }
    return profile
  }

  /**
   * Set weekly availability for a provider.
   * Replaces all existing slots for the provider with the new ones.
   */
  async setAvailability(userId: string, dto: SetAvailabilityDto) {
    const profile = await this.getProviderProfile(userId)

    // Delete existing availability slots
    await this.prisma.availability.deleteMany({
      where: { providerId: profile.id },
    })

    // Create new slots
    const slots = await Promise.all(
      dto.slots.map((slot) =>
        this.prisma.availability.create({
          data: {
            providerId: profile.id,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            slotDuration: slot.slotDuration,
            isActive: slot.isActive ?? true,
          },
        }),
      ),
    )

    return slots
  }

  /**
   * Get availability for the current provider.
   */
  async getMyAvailability(userId: string) {
    const profile = await this.getProviderProfile(userId)
    return this.prisma.availability.findMany({
      where: { providerId: profile.id, isActive: true },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    })
  }

  /**
   * Delete a specific availability slot.
   */
  async deleteSlot(slotId: string) {
    const slot = await this.prisma.availability.findUnique({
      where: { id: slotId },
    })
    if (!slot) {
      throw new NotFoundException(`Availability slot "${slotId}" not found`)
    }
    await this.prisma.availability.delete({ where: { id: slotId } })
    return { success: true }
  }

  /**
   * Create a time-off block.
   */
  async createTimeOff(userId: string, dto: CreateTimeOffDto) {
    const profile = await this.getProviderProfile(userId)

    return this.prisma.timeOff.create({
      data: {
        providerId: profile.id,
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
        reason: dto.reason ?? null,
      },
    })
  }

  /**
   * Get time-off blocks for the current provider.
   */
  async getTimeOff(userId: string) {
    const profile = await this.getProviderProfile(userId)
    return this.prisma.timeOff.findMany({
      where: { providerId: profile.id },
      orderBy: { date: "asc" },
    })
  }

  /**
   * Delete a time-off block.
   */
  async deleteTimeOff(timeOffId: string) {
    const entry = await this.prisma.timeOff.findUnique({
      where: { id: timeOffId },
    })
    if (!entry) {
      throw new NotFoundException(`Time-off entry "${timeOffId}" not found`)
    }
    await this.prisma.timeOff.delete({ where: { id: timeOffId } })
    return { success: true }
  }

  /**
   * Get available time slots for a provider on a specific date.
   * Excludes booked appointments and time-off blocks.
   */
  async getAvailableSlots(providerProfileId: string, date: string) {
    const targetDate = new Date(date)
    const dayOfWeek = targetDate.getDay()

    // Get active availability for this day of week
    const availabilities = await this.prisma.availability.findMany({
      where: { providerId: providerProfileId, dayOfWeek, isActive: true },
    })

    if (availabilities.length === 0) {
      return []
    }

    // Get time-off blocks for this date
    const dateStart = new Date(targetDate)
    dateStart.setHours(0, 0, 0, 0)
    const dateEnd = new Date(targetDate)
    dateEnd.setHours(23, 59, 59, 999)

    const timeOffBlocks = await this.prisma.timeOff.findMany({
      where: {
        providerId: providerProfileId,
        date: { gte: dateStart, lte: dateEnd },
      },
    })

    // Get existing appointments for this date
    const appointments = await this.prisma.appointment.findMany({
      where: {
        providerId: providerProfileId,
        startTime: { gte: dateStart, lte: dateEnd },
        status: { notIn: ["CANCELLED"] },
      },
    })

    // Generate available slots
    const slots: { startTime: string; endTime: string; available: boolean }[] =
      []

    for (const av of availabilities) {
      const startParts = av.startTime.split(":").map(Number)
      const endParts = av.endTime.split(":").map(Number)
      const startH = startParts[0] ?? 0
      const startM = startParts[1] ?? 0
      const endH = endParts[0] ?? 0
      const endM = endParts[1] ?? 0

      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM
      const duration = av.slotDuration

      for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
        const slotStart = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
        const slotEnd = `${String(Math.floor((m + duration) / 60)).padStart(2, "0")}:${String((m + duration) % 60).padStart(2, "0")}`

        // Check if this slot is covered by time-off
        const isTimeOff = timeOffBlocks.some((toff) => {
          const toffStart = toff.startTime
          const toffEnd = toff.endTime
          return slotStart >= toffStart && slotEnd <= toffEnd
        })
        if (isTimeOff) continue

        // Check if this slot is already booked
        const isBooked = appointments.some((apt) => {
          const aptStart = `${apt.startTime.getHours().toString().padStart(2, "0")}:${apt.startTime.getMinutes().toString().padStart(2, "0")}`
          const aptEnd = `${apt.endTime.getHours().toString().padStart(2, "0")}:${apt.endTime.getMinutes().toString().padStart(2, "0")}`
          return slotStart < aptEnd && slotEnd > aptStart
        })
        if (isBooked) continue

        slots.push({ startTime: slotStart, endTime: slotEnd, available: true })
      }
    }

    return slots
  }
}
