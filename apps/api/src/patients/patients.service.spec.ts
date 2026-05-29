import { NotFoundException } from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import { PrismaService } from "@/prisma/prisma.service"
import { PatientsService } from "./patients.service"

type MockPrisma = {
  patientProfile: {
    findUnique: jest.Mock
    create: jest.Mock
    update: jest.Mock
  }
}

function buildMock(): MockPrisma {
  return {
    patientProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  }
}

describe("PatientsService", () => {
  let service: PatientsService
  let prisma: MockPrisma

  beforeEach(async () => {
    const mock = buildMock()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: PrismaService, useValue: mock as unknown as PrismaService },
      ],
    }).compile()

    service = module.get<PatientsService>(PatientsService)
    prisma = module.get<PrismaService>(PrismaService) as unknown as MockPrisma
  })

  describe("getOrCreateProfile", () => {
    it("should return existing profile when found", async () => {
      const profile = { id: "p1", userId: "u1" }
      prisma.patientProfile.findUnique.mockResolvedValue(profile)

      const result = await service.getOrCreateProfile("u1")

      expect(result).toEqual(profile)
      expect(prisma.patientProfile.create).not.toHaveBeenCalled()
    })

    it("should create a new profile when none exists", async () => {
      prisma.patientProfile.findUnique.mockResolvedValue(null)
      prisma.patientProfile.create.mockResolvedValue({
        id: "p-new",
        userId: "u1",
      })

      const result = await service.getOrCreateProfile("u1")

      expect(result).toEqual(expect.objectContaining({ id: "p-new" }))
      expect(prisma.patientProfile.create).toHaveBeenCalledWith({
        data: { userId: "u1" },
      })
    })
  })

  describe("updateProfile", () => {
    it("should update profile fields", async () => {
      prisma.patientProfile.findUnique.mockResolvedValue({
        id: "p1",
        userId: "u1",
      })
      prisma.patientProfile.update.mockResolvedValue({
        id: "p1",
        weight: 70,
        height: 175,
      })

      const result = await service.updateProfile("u1", {
        weight: 70,
        height: 175,
      })

      expect(result).toEqual(expect.objectContaining({ id: "p1" }))
      expect(prisma.patientProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "u1" },
          data: expect.objectContaining({
            weight: 70,
            height: 175,
          }),
        }),
      )
    })
  })

  describe("findByUserId", () => {
    it("should throw when profile is not found", async () => {
      prisma.patientProfile.findUnique.mockResolvedValue(null)

      await expect(service.findByUserId("missing")).rejects.toThrow(
        NotFoundException,
      )
    })

    it("should return profile with user info", async () => {
      const profile = {
        id: "p1",
        userId: "u1",
        dob: null,
        user: { id: "u1", name: "John", email: "john@test.com", image: null },
      }
      prisma.patientProfile.findUnique.mockResolvedValue(profile)

      const result = await service.findByUserId("u1")

      expect(result).toEqual(profile)
      expect(result.user.name).toBe("John")
    })
  })
})
