import { Test, type TestingModule } from "@nestjs/testing"
import { PrismaService } from "../prisma/prisma.service"
import { ConsentService } from "./consent.service"

type MockPrisma = {
  consentLog: {
    create: jest.Mock
    findFirst: jest.Mock
    findMany: jest.Mock
  }
}

function buildMock(): MockPrisma {
  return {
    consentLog: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  }
}

describe("ConsentService", () => {
  let service: ConsentService
  let prisma: MockPrisma

  beforeEach(async () => {
    const mock = buildMock()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsentService,
        { provide: PrismaService, useValue: mock as unknown as PrismaService },
      ],
    }).compile()

    service = module.get<ConsentService>(ConsentService)
    prisma = module.get<PrismaService>(PrismaService) as unknown as MockPrisma
  })

  describe("recordConsent", () => {
    it("should create a consent log entry", async () => {
      prisma.consentLog.create.mockResolvedValue({
        id: "cl-1",
        userId: "u1",
        consentType: "privacy_policy",
        granted: true,
        ipAddress: "192.168.1.1",
      })

      const result = await service.recordConsent(
        "u1",
        "privacy_policy",
        true,
        "192.168.1.1",
      )

      expect(result).toEqual(expect.objectContaining({ id: "cl-1" }))
      expect(prisma.consentLog.create).toHaveBeenCalledWith({
        data: {
          userId: "u1",
          consentType: "privacy_policy",
          granted: true,
          ipAddress: "192.168.1.1",
        },
      })
    })

    it("should handle null ipAddress", async () => {
      prisma.consentLog.create.mockResolvedValue({ id: "cl-2" })

      await service.recordConsent("u1", "data_sharing", false, null)

      expect(prisma.consentLog.create).toHaveBeenCalledWith({
        data: {
          userId: "u1",
          consentType: "data_sharing",
          granted: false,
          ipAddress: null,
        },
      })
    })
  })

  describe("hasConsented", () => {
    it("should return false when no consent record exists", async () => {
      prisma.consentLog.findFirst.mockResolvedValue(null)

      const result = await service.hasConsented("u1", "privacy_policy")

      expect(result).toBe(false)
    })

    it("should return false when latest consent was denied", async () => {
      prisma.consentLog.findFirst.mockResolvedValue({
        granted: false,
      })

      const result = await service.hasConsented("u1", "data_sharing")

      expect(result).toBe(false)
    })

    it("should return true when latest consent was granted", async () => {
      prisma.consentLog.findFirst.mockResolvedValue({
        granted: true,
      })

      const result = await service.hasConsented("u1", "marketing")

      expect(result).toBe(true)
    })
  })

  describe("getUserConsents", () => {
    it("should return all consent logs sorted desc", async () => {
      const logs = [
        { id: "cl-2", consentType: "privacy_policy", granted: true },
        { id: "cl-1", consentType: "data_sharing", granted: false },
      ]
      prisma.consentLog.findMany.mockResolvedValue(logs)

      const result = await service.getUserConsents("u1")

      expect(result).toEqual(logs)
      expect(prisma.consentLog.findMany).toHaveBeenCalledWith({
        where: { userId: "u1" },
        orderBy: { createdAt: "desc" },
      })
    })
  })
})
