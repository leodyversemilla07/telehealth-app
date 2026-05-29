import { ForbiddenException, NotFoundException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { Test, type TestingModule } from "@nestjs/testing"
import type { Mockify } from "../../test/mocks/prisma-client"
import { PrismaService } from "../prisma/prisma.service"
import { VideoService } from "./video.service"

jest.mock("livekit-server-sdk", () => ({
  AccessToken: jest.fn().mockImplementation(() => ({
    addGrant: jest.fn(),
    toJwt: jest.fn().mockResolvedValue("mock-jwt-token"),
  })),
  RoomServiceClient: jest.fn().mockImplementation(() => ({
    createRoom: jest.fn().mockResolvedValue({ name: "appointment-apt-1" }),
    deleteRoom: jest.fn().mockResolvedValue(undefined),
  })),
}))

describe("VideoService", () => {
  let service: VideoService
  let prisma: Mockify<Pick<PrismaService, "appointment">>

  function mockConfig(
    overrides: Record<string, string> = {},
  ): jest.Mocked<ConfigService> {
    const defaults: Record<string, string> = {
      LIVEKIT_URL: "wss://livekit.example.com",
      LIVEKIT_API_KEY: "apikey",
      LIVEKIT_API_SECRET: "secret",
      ...overrides,
    }
    return {
      get: jest.fn((key: string) => defaults[key] ?? null),
    } as unknown as jest.Mocked<ConfigService>
  }

  function mockPrisma(): Mockify<Pick<PrismaService, "appointment">> {
    return {
      appointment: { findUnique: jest.fn(), update: jest.fn() },
    } as unknown as Mockify<Pick<PrismaService, "appointment">>
  }

  function makeAppointment(overrides: Record<string, unknown> = {}) {
    return {
      id: "apt-1",
      patientId: "patient-1",
      doctorId: "doc-profile-1",
      status: "CONFIRMED",
      startTime: new Date(Date.now() - 60_000),
      roomUrl: null,
      patient: { id: "patient-1", name: "Patient" },
      doctor: {
        id: "doc-profile-1",
        userId: "doctor-1",
        specialty: "Cardiology",
        user: { name: "Dr. Cruz" },
      },
      ...overrides,
    }
  }

  beforeEach(async () => {
    prisma = mockPrisma()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: mockConfig() },
      ],
    }).compile()

    service = module.get<VideoService>(VideoService)
  })

  describe("createRoom", () => {
    it("should throw if LiveKit is not configured", async () => {
      const module = await Test.createTestingModule({
        providers: [
          VideoService,
          { provide: PrismaService, useValue: mockPrisma() },
          {
            provide: ConfigService,
            useValue: mockConfig({ LIVEKIT_API_KEY: "dev-key" }),
          },
        ],
      }).compile()

      const svc = module.get<VideoService>(VideoService)

      await expect(
        svc.createRoom("apt-1", "Doctor", "Patient"),
      ).rejects.toThrow(ForbiddenException)
    })

    it("should create a room and return name and url", async () => {
      const result = await service.createRoom("apt-1", "Dr. Cruz", "Patient")

      expect(result).toEqual({
        roomName: "appointment-apt-1",
        url: "wss://livekit.example.com",
      })
    })
  })

  describe("generateToken", () => {
    it("should return a JWT string for a patient", async () => {
      const token = await service.generateToken(
        "patient-user-1",
        "appointment-apt-1",
        false,
      )

      expect(token).toBe("mock-jwt-token")
    })

    it("should return a JWT string for a doctor", async () => {
      const token = await service.generateToken(
        "doctor-user-1",
        "appointment-apt-1",
        true,
      )

      expect(token).toBe("mock-jwt-token")
    })

    it("should throw if LiveKit not configured", async () => {
      const module = await Test.createTestingModule({
        providers: [
          VideoService,
          { provide: PrismaService, useValue: mockPrisma() },
          {
            provide: ConfigService,
            useValue: mockConfig({ LIVEKIT_API_KEY: "dev-key" }),
          },
        ],
      }).compile()

      const svc = module.get<VideoService>(VideoService)

      await expect(svc.generateToken("user-1", "room", false)).rejects.toThrow(
        ForbiddenException,
      )
    })
  })

  describe("joinRoom", () => {
    it("should throw when appointment not found", async () => {
      prisma.appointment.findUnique.mockResolvedValue(null)

      await expect(
        service.joinRoom({ appointmentId: "missing" }, "patient-1"),
      ).rejects.toThrow(NotFoundException)
    })

    it("should throw when user is not a participant", async () => {
      prisma.appointment.findUnique.mockResolvedValue(makeAppointment())

      await expect(
        service.joinRoom({ appointmentId: "apt-1" }, "stranger"),
      ).rejects.toThrow(ForbiddenException)
    })

    it("should throw when appointment status is not joinable", async () => {
      prisma.appointment.findUnique.mockResolvedValue(
        makeAppointment({ status: "BOOKED" }),
      )

      await expect(
        service.joinRoom({ appointmentId: "apt-1" }, "patient-1"),
      ).rejects.toThrow(ForbiddenException)
    })

    it("should throw when joining too early", async () => {
      const futureStart = new Date(Date.now() + 10 * 60 * 1000)
      prisma.appointment.findUnique.mockResolvedValue(
        makeAppointment({ startTime: futureStart }),
      )

      await expect(
        service.joinRoom({ appointmentId: "apt-1" }, "patient-1"),
      ).rejects.toThrow(ForbiddenException)
    })

    it("should create room, update appointment, and return token for patient", async () => {
      prisma.appointment.findUnique.mockResolvedValue(makeAppointment())
      prisma.appointment.update.mockResolvedValue(
        makeAppointment({
          roomUrl: "wss://livekit.example.com",
          status: "IN_PROGRESS",
        }),
      )

      const result = await service.joinRoom(
        { appointmentId: "apt-1" },
        "patient-1",
      )

      expect(result.roomName).toBe("appointment-apt-1")
      expect(result.url).toBe("wss://livekit.example.com")
      expect(result.token).toBe("mock-jwt-token")
      expect(prisma.appointment.update).toHaveBeenCalled()
    })

    it("should allow doctor to join", async () => {
      prisma.appointment.findUnique.mockResolvedValue(makeAppointment())
      prisma.appointment.update.mockResolvedValue(
        makeAppointment({
          roomUrl: "wss://livekit.example.com",
          status: "IN_PROGRESS",
        }),
      )

      const result = await service.joinRoom(
        { appointmentId: "apt-1" },
        "doctor-1",
      )

      expect(result.roomName).toBe("appointment-apt-1")
      expect(result.token).toBe("mock-jwt-token")
    })

    it("should not create a new room if one already exists", async () => {
      prisma.appointment.findUnique.mockResolvedValue(
        makeAppointment({ roomUrl: "wss://livekit.example.com" }),
      )

      const result = await service.joinRoom(
        { appointmentId: "apt-1" },
        "patient-1",
      )

      expect(result.roomName).toBe("appointment-apt-1")
      expect(result.token).toBe("mock-jwt-token")
    })
  })

  describe("endRoom", () => {
    it("should throw when appointment not found", async () => {
      prisma.appointment.findUnique.mockResolvedValue(null)

      await expect(
        service.endRoom({ appointmentId: "missing" }, "patient-1"),
      ).rejects.toThrow(NotFoundException)
    })

    it("should throw when appointment is not in progress", async () => {
      prisma.appointment.findUnique.mockResolvedValue(
        makeAppointment({ status: "BOOKED" }),
      )

      await expect(
        service.endRoom({ appointmentId: "apt-1" }, "patient-1"),
      ).rejects.toThrow(ForbiddenException)
    })

    it("should throw when user is not a participant", async () => {
      prisma.appointment.findUnique.mockResolvedValue(
        makeAppointment({ status: "IN_PROGRESS" }),
      )

      await expect(
        service.endRoom({ appointmentId: "apt-1" }, "stranger"),
      ).rejects.toThrow(ForbiddenException)
    })

    it("should complete appointment and return metadata", async () => {
      const startTime = new Date(Date.now() - 10 * 60 * 1000)
      prisma.appointment.findUnique.mockResolvedValue(
        makeAppointment({
          status: "IN_PROGRESS",
          startTime,
          roomUrl: "wss://livekit.example.com",
        }),
      )
      prisma.appointment.update.mockResolvedValue({})

      const result = await service.endRoom(
        { appointmentId: "apt-1" },
        "patient-1",
      )

      expect(result.status).toBe("COMPLETED")
      expect(result.duration).toBeGreaterThan(0)
      expect(result.appointmentId).toBe("apt-1")
      expect(prisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "apt-1" },
          data: expect.objectContaining({ status: "COMPLETED" }),
        }),
      )
    })
  })
})
