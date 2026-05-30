import { NotFoundException } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import { PrismaService } from "../prisma/prisma.service"
import { DoctorsService } from "./doctors.service"

type MockPrisma = {
  doctorProfile: {
    findUnique: jest.Mock
    findFirst: jest.Mock
    findMany: jest.Mock
    update: jest.Mock
    create: jest.Mock
  }
  user: {
    findUnique: jest.Mock
    findMany: jest.Mock
    update: jest.Mock
  }
  $transaction: jest.Mock
}

describe("DoctorsService", () => {
  let service: DoctorsService
  let prisma: MockPrisma

  function buildMock(): MockPrisma {
    return {
      doctorProfile: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    }
  }

  beforeEach(async () => {
    const prismaMock = buildMock()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile()

    service = module.get<DoctorsService>(DoctorsService)
    prisma = prismaMock
  })

  // ─── findApproved ─────────────────────────────────────────────────────

  describe("findApproved", () => {
    it("should return only approved doctors when no filters", async () => {
      const doctors = [
        {
          id: "doc-1",
          specialty: "Cardiology",
          isApproved: true,
          averageRating: 0,
          totalReviews: 0,
          reviews: undefined,
          user: { name: "Dr. Cruz" },
        },
        {
          id: "doc-2",
          specialty: "Dermatology",
          isApproved: true,
          averageRating: 0,
          totalReviews: 0,
          reviews: undefined,
          user: { name: "Dr. Reyes" },
        },
      ]
      prisma.doctorProfile.findMany.mockResolvedValue(doctors)

      const result = await service.findApproved()
      expect(result).toEqual(doctors)
      expect(prisma.doctorProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isApproved: true }),
        }),
      )
    })

    it("should filter by specialty when provided", async () => {
      prisma.doctorProfile.findMany.mockResolvedValue([])

      await service.findApproved({ specialty: "Cardiology" })

      expect(prisma.doctorProfile.findMany).toHaveBeenCalled()
    })

    it("should search by name when search term provided", async () => {
      prisma.doctorProfile.findMany.mockResolvedValue([])

      await service.findApproved({ search: "Cruz" })

      expect(prisma.doctorProfile.findMany).toHaveBeenCalled()
      const call = prisma.doctorProfile.findMany.mock.calls[0][0]
      expect(JSON.stringify(call)).toContain("Cruz")
    })
  })

  // ─── findById ─────────────────────────────────────────────────────────

  describe("findById", () => {
    it("should throw NotFoundException if doctor not found", async () => {
      prisma.doctorProfile.findFirst.mockResolvedValue(null)

      await expect(service.findById("nonexistent")).rejects.toThrow(
        NotFoundException,
      )
    })

    it("should return doctor when found", async () => {
      const profile = {
        id: "doc-1",
        specialty: "Cardiology",
        isApproved: true,
        averageRating: 0,
        totalReviews: 0,
        reviews: undefined,
      }
      prisma.doctorProfile.findFirst.mockResolvedValue(profile)

      const result = await service.findById("doc-1")
      expect(result).toEqual(profile)
    })
  })

  // ─── findByUserId ─────────────────────────────────────────────────────

  describe("findByUserId", () => {
    it("should throw NotFoundException if no doctor profile for user", async () => {
      prisma.doctorProfile.findUnique.mockResolvedValue(null)

      await expect(service.findByUserId("user-no-doc")).rejects.toThrow(
        NotFoundException,
      )
    })

    it("should return doctor profile when found", async () => {
      const profile = { id: "doc-1", userId: "user-1", specialty: "Cardiology" }
      prisma.doctorProfile.findUnique.mockResolvedValue(profile)

      const result = await service.findByUserId("user-1")
      expect(result).toEqual(profile)
    })
  })

  // ─── approve ──────────────────────────────────────────────────────────

  describe("approve", () => {
    it("should throw NotFoundException if doctor not found", async () => {
      prisma.doctorProfile.findUnique.mockResolvedValue(null)

      await expect(service.approve("nonexistent")).rejects.toThrow(
        NotFoundException,
      )
    })

    it("should update isApproved to true", async () => {
      const profile = { id: "doc-1", isApproved: false }
      const updated = { id: "doc-1", isApproved: true }
      prisma.doctorProfile.findUnique.mockResolvedValue(profile)
      prisma.doctorProfile.update.mockResolvedValue(updated)

      const result = await service.approve("doc-1")
      expect(result).toEqual(updated)
      expect(prisma.doctorProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isApproved: true } }),
      )
    })
  })
})
