import { ServiceUnavailableException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { Test, type TestingModule } from "@nestjs/testing"
import { PrismaService } from "../prisma/prisma.service"
import { RecommendationsService } from "./recommendations.service"

type MockPrisma = {
  doctorProfile: {
    findMany: jest.Mock
  }
}

function buildPrismaMock(): MockPrisma {
  return {
    doctorProfile: { findMany: jest.fn() },
  }
}

function okResponse(content: string): Response {
  return {
    ok: true,
    json: async () => ({
      choices: [{ message: { content } }],
    }),
  } as unknown as Response
}

function errResponse(status: number): Response {
  return {
    ok: false,
    status,
    text: async () => "boom",
  } as unknown as Response
}

describe("RecommendationsService", () => {
  let service: RecommendationsService
  let prisma: MockPrisma
  let config: { get: jest.Mock }
  const originalFetch = globalThis.fetch

  beforeEach(async () => {
    prisma = buildPrismaMock()
    config = { get: jest.fn() }
    config.get.mockImplementation((key: string) =>
      key === "NIM_API_KEY" ? "nim-key" : undefined,
    )

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile()

    service = module.get<RecommendationsService>(RecommendationsService)
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    jest.restoreAllMocks()
  })

  describe("getRecommendation", () => {
    it("should return matching approved doctors for mapped specialties", async () => {
      globalThis.fetch = jest
        .fn()
        .mockResolvedValue(
          okResponse('["Cardiology","Internal Medicine"]'),
        ) as unknown as typeof fetch
      const doctors = [{ id: "d1", user: { name: "Dr. A" } }]
      prisma.doctorProfile.findMany.mockResolvedValue(doctors)

      const result = await service.getRecommendation("chest pain")

      expect(result).toEqual({
        specialties: ["Cardiology", "Internal Medicine"],
        doctors,
      })
      expect(prisma.doctorProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isApproved: true,
            specialty: { in: ["Cardiology", "Internal Medicine"] },
          },
        }),
      )
    })

    it("should tolerate markdown-fenced JSON from the model", async () => {
      globalThis.fetch = jest
        .fn()
        .mockResolvedValue(
          okResponse('```json\n["Neurology"]\n```'),
        ) as unknown as typeof fetch
      prisma.doctorProfile.findMany.mockResolvedValue([])

      const result = await service.getRecommendation("headache")

      expect(result.specialties).toEqual(["Neurology"])
    })

    it("should try the fallback model when the primary fails", async () => {
      const fetchMock = jest
        .fn()
        .mockRejectedValueOnce(new Error("timeout"))
        .mockResolvedValueOnce(okResponse('["Dermatology"]'))
      globalThis.fetch = fetchMock as unknown as typeof fetch
      prisma.doctorProfile.findMany.mockResolvedValue([])

      const result = await service.getRecommendation("rash")

      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(result.specialties).toEqual(["Dermatology"])
    })

    it("should throw ServiceUnavailable when the API key is missing", async () => {
      config.get.mockReturnValue(undefined)

      await expect(service.getRecommendation("pain")).rejects.toThrow(
        ServiceUnavailableException,
      )
    })

    it("should throw when both models are unavailable", async () => {
      globalThis.fetch = jest
        .fn()
        .mockRejectedValue(new Error("down"))
        .mockRejectedValue(new Error("down")) as unknown as typeof fetch

      await expect(service.getRecommendation("pain")).rejects.toThrow(
        ServiceUnavailableException,
      )
    })
  })

  describe("checkSymptoms", () => {
    it("should return parsed analysis plus matching doctors", async () => {
      globalThis.fetch = jest.fn().mockResolvedValue(
        okResponse(
          JSON.stringify({
            possibleConditions: [{ name: "Common Cold", likelihood: "high" }],
            severity: "low",
            recommendedAction: "Rest",
            specialties: ["General Practice"],
          }),
        ),
      ) as unknown as typeof fetch
      const doctors = [{ id: "d1" }]
      prisma.doctorProfile.findMany.mockResolvedValue(doctors)

      const result = await service.checkSymptoms("runny nose")

      expect(result).toEqual(
        expect.objectContaining({
          severity: "low",
          specialties: ["General Practice"],
          doctors,
        }),
      )
    })

    it("should throw ServiceUnavailable when the API key is missing", async () => {
      config.get.mockReturnValue(undefined)

      await expect(service.checkSymptoms("cough")).rejects.toThrow(
        ServiceUnavailableException,
      )
    })

    it("should fall back to the second model when the first returns garbage", async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce(okResponse("not json at all"))
        .mockResolvedValueOnce(
          okResponse(
            JSON.stringify({
              severity: "moderate",
              recommendedAction: "Call",
              specialties: [],
            }),
          ),
        )
      globalThis.fetch = fetchMock as unknown as typeof fetch
      prisma.doctorProfile.findMany.mockResolvedValue([])

      const result = await service.checkSymptoms("fever")

      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(result).toEqual(
        expect.objectContaining({
          severity: "moderate",
          recommendedAction: "Call",
        }),
      )
    })

    it("should throw when the NIM API returns a non-2xx status", async () => {
      globalThis.fetch = jest
        .fn()
        .mockResolvedValue(errResponse(500)) as unknown as typeof fetch

      await expect(service.checkSymptoms("pain")).rejects.toThrow(
        ServiceUnavailableException,
      )
    })
  })
})
