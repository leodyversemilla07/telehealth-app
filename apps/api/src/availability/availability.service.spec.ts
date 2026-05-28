import { ForbiddenException, NotFoundException } from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import { PrismaService } from "@/prisma/prisma.service"
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
    const dayKey = dayKeys[new Date(date).getDay()] ?? "monday"

    const schedule: Record<string, unknown> = {
      id: "sched-1",
      slotDuration: 30,
      appointments: [
        {
          startTime: new Date(`${date}T09:30:00.000Z`),
          endTime: new Date(`${date}T10:00:00.000Z`),
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
        startTime: `${date}T09:00:00`,
        endTime: `${date}T09:30:00`,
        scheduleId: "sched-1",
      }),
    )
  })
})
