import { ForbiddenException, NotFoundException } from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import { NotificationsService } from "../notifications/notifications.service"
import { PrismaService } from "../prisma/prisma.service"
import { AvailabilityService } from "./availability.service"

type MockPrisma = {
  doctorProfile: {
    findUnique: jest.Mock
  }
  availabilitySchedule: {
    upsert: jest.Mock
    findUnique: jest.Mock
  }
  timeOff: {
    create: jest.Mock
    findMany: jest.Mock
    findUnique: jest.Mock
    delete: jest.Mock
  }
}

describe("AvailabilityService", () => {
  let service: AvailabilityService
  let prisma: MockPrisma

  function buildMock(): MockPrisma {
    return {
      doctorProfile: {
        findUnique: jest.fn(),
      },
      availabilitySchedule: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
      },
      timeOff: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    }
  }

  beforeEach(async () => {
    const prismaMock = buildMock()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        {
          provide: PrismaService,
          useValue: prismaMock as unknown as PrismaService,
        },
        {
          provide: NotificationsService,
          useValue: { createNotification: jest.fn() },
        },
      ],
    }).compile()

    service = module.get<AvailabilityService>(AvailabilityService)
    prisma = module.get<PrismaService>(PrismaService) as unknown as MockPrisma
  })

  it("setAvailability should throw when doctor profile is missing", async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue(null)

    await expect(service.setAvailability("user-1", {})).rejects.toThrow(
      NotFoundException,
    )
  })

  it("setAvailability should serialize day arrays and upsert schedule", async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: "doc-1" })
    prisma.availabilitySchedule.upsert.mockResolvedValue({ id: "sched-1" })

    await service.setAvailability("user-1", {
      monday: '["09:00-12:00"]',
      tuesday: ["13:00-15:00"] as unknown as string,
      slotDuration: 30,
    })

    expect(prisma.availabilitySchedule.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { doctorId: "doc-1" },
        update: expect.objectContaining({
          monday: '["09:00-12:00"]',
          tuesday: JSON.stringify(["13:00-15:00"]),
          slotDuration: 30,
        }),
      }),
    )
  })

  it("getMyAvailability should throw when schedule does not exist", async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: "doc-1" })
    prisma.availabilitySchedule.findUnique.mockResolvedValue(null)

    await expect(service.getMyAvailability("user-1")).rejects.toThrow(
      NotFoundException,
    )
  })

  it("deleteTimeOff should throw ForbiddenException when entry belongs to another doctor", async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: "doc-1" })
    prisma.timeOff.findUnique.mockResolvedValue({
      id: "to-1",
      schedule: { doctorId: "doc-2" },
    })

    await expect(service.deleteTimeOff("user-1", "to-1")).rejects.toThrow(
      ForbiddenException,
    )
  })

  it("getAvailableSlots should remove booked slots", async () => {
    const date = "2026-06-15"
    const dayKeys = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ] as const
    // 2026-06-15 is Sunday in UTC, but in PHT (+8) it's also Sunday
    const dayKey =
      dayKeys[new Date(`${date}T12:00:00.000+08:00`).getDay()] ?? "monday"

    const schedule: Record<string, unknown> = {
      id: "sched-1",
      slotDuration: 30,
      appointments: [
        {
          // Booked at 09:30 PHT → 01:30 UTC, overlaps with PHT slot 09:00-10:00
          startTime: new Date(`${date}T01:30:00.000Z`),
          endTime: new Date(`${date}T02:00:00.000Z`),
        },
      ],
      timeOffs: [],
    }
    schedule[dayKey] = '["09:00-10:00"]'

    prisma.availabilitySchedule.findUnique.mockResolvedValue(schedule)

    const slots = await service.getAvailableSlots("doc-1", date)

    expect(slots).toHaveLength(1)
    expect(slots[0]).toEqual(
      expect.objectContaining({
        startTime: new Date(`${date}T01:00:00.000Z`).toISOString(),
        endTime: new Date(`${date}T01:30:00.000Z`).toISOString(),
        scheduleId: "sched-1",
      }),
    )
  })

  it("getAvailableSlots hides only the slots covered by a partial time-off", async () => {
    const date = "2026-06-15"
    const dayKey =
      [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ][new Date(`${date}T12:00:00.000+08:00`).getDay()] ?? "monday"

    const schedule: Record<string, unknown> = {
      id: "sched-1",
      slotDuration: 30,
      appointments: [],
      // Time-off 10:00–11:00 PHT (02:00–03:00 UTC) on the same day
      timeOffs: [
        {
          startDate: new Date(`${date}T02:00:00.000Z`),
          endDate: new Date(`${date}T03:00:00.000Z`),
        },
      ],
    }
    schedule[dayKey] = '["09:00-11:00"]'

    prisma.availabilitySchedule.findUnique.mockResolvedValue(schedule)

    const slots = await service.getAvailableSlots("doc-1", date)

    // 09:00–10:00 PHT remains bookable; 10:00–11:00 is hidden by the off
    expect(slots).toHaveLength(2)
    expect(slots.map((s) => s.startTime)).toEqual([
      new Date(`${date}T01:00:00.000Z`).toISOString(),
      new Date(`${date}T01:30:00.000Z`).toISOString(),
    ])
  })

  it("getAvailableSlots blocks slots overlapped by an appointment straddling the PHT midnight boundary", async () => {
    const date = "2026-06-15"
    const dayKey =
      [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ][new Date(`${date}T12:00:00.000+08:00`).getDay()] ?? "monday"

    const schedule: Record<string, unknown> = {
      id: "sched-1",
      slotDuration: 30,
      appointments: [
        {
          // 00:30–01:30 PHT Jun 15 = 16:30–17:30 UTC Jun 14 (previous day)
          startTime: new Date(`2026-06-14T16:30:00.000Z`),
          endTime: new Date(`2026-06-14T17:30:00.000Z`),
        },
      ],
      timeOffs: [],
    }
    schedule[dayKey] = '["00:00-02:00"]'

    prisma.availabilitySchedule.findUnique.mockResolvedValue(schedule)

    const slots = await service.getAvailableSlots("doc-1", date)

    // Only the non-overlapped 00:00–00:30 and 01:30–02:00 slots remain
    // (00:00 PHT Jun 15 = 16:00 UTC Jun 14)
    expect(slots).toHaveLength(2)
    expect(slots.map((s) => s.startTime)).toEqual([
      new Date(`2026-06-14T16:00:00.000Z`).toISOString(),
      new Date(`2026-06-14T17:30:00.000Z`).toISOString(),
    ])
  })
})
