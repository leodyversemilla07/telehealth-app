import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import { PrismaService } from "@/prisma/prisma.service"
import { ReviewsService } from "./reviews.service"

type MockPrisma = {
  appointment: {
    findUnique: jest.Mock
  }
  review: {
    create: jest.Mock
    findMany: jest.Mock
    findUnique: jest.Mock
    count: jest.Mock
  }
}

function buildMock(): MockPrisma {
  return {
    appointment: { findUnique: jest.fn() },
    review: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  }
}

describe("ReviewsService", () => {
  let service: ReviewsService
  let prisma: MockPrisma

  beforeEach(async () => {
    const mock = buildMock()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: mock as unknown as PrismaService },
      ],
    }).compile()

    service = module.get<ReviewsService>(ReviewsService)
    prisma = module.get<PrismaService>(PrismaService) as unknown as MockPrisma
  })

  describe("createReview", () => {
    it("should reject rating below 1", async () => {
      await expect(
        service.createReview("patient-1", "apt-1", 0),
      ).rejects.toThrow(BadRequestException)
    })

    it("should reject rating above 5", async () => {
      await expect(
        service.createReview("patient-1", "apt-1", 6),
      ).rejects.toThrow(BadRequestException)
    })

    it("should throw when appointment not found", async () => {
      prisma.appointment.findUnique.mockResolvedValue(null)

      await expect(
        service.createReview("patient-1", "missing", 5),
      ).rejects.toThrow(NotFoundException)
    })

    it("should throw when patient is not the owner", async () => {
      prisma.appointment.findUnique.mockResolvedValue({
        id: "apt-1",
        patientId: "other-patient",
        doctorId: "doc-1",
        status: "COMPLETED",
        reviews: [],
      })

      await expect(
        service.createReview("wrong-patient", "apt-1", 5),
      ).rejects.toThrow(ForbiddenException)
    })

    it("should throw when appointment is not completed", async () => {
      prisma.appointment.findUnique.mockResolvedValue({
        id: "apt-1",
        patientId: "patient-1",
        doctorId: "doc-1",
        status: "BOOKED",
        reviews: [],
      })

      await expect(
        service.createReview("patient-1", "apt-1", 5),
      ).rejects.toThrow(BadRequestException)
    })

    it("should throw when already reviewed", async () => {
      prisma.appointment.findUnique.mockResolvedValue({
        id: "apt-1",
        patientId: "patient-1",
        doctorId: "doc-1",
        status: "COMPLETED",
        reviews: [{ id: "existing-review" }],
      })

      await expect(
        service.createReview("patient-1", "apt-1", 5),
      ).rejects.toThrow(ConflictException)
    })

    it("should create review when all checks pass", async () => {
      prisma.appointment.findUnique.mockResolvedValue({
        id: "apt-1",
        patientId: "patient-1",
        doctorId: "doc-1",
        status: "COMPLETED",
        reviews: [],
      })
      prisma.review.create.mockResolvedValue({
        id: "rev-1",
        patientId: "patient-1",
        doctorId: "doc-1",
        appointmentId: "apt-1",
        rating: 4,
        comment: "Great doctor",
      })

      const result = await service.createReview(
        "patient-1",
        "apt-1",
        4,
        "Great doctor",
      )

      expect(result).toEqual(expect.objectContaining({ id: "rev-1" }))
      expect(prisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            patientId: "patient-1",
            doctorId: "doc-1",
            rating: 4,
            comment: "Great doctor",
          }),
        }),
      )
    })
  })

  describe("getDoctorReviews", () => {
    it("should return empty stats when no reviews", async () => {
      prisma.review.findMany.mockResolvedValue([])
      prisma.review.count.mockResolvedValue(0)

      const result = await service.getDoctorReviews("doc-1")

      expect(result).toEqual({
        items: [],
        total: 0,
        limit: 50,
        offset: 0,
        averageRating: 0,
      })
    })

    it("should calculate average rating correctly", async () => {
      prisma.review.findMany.mockResolvedValue([
        { rating: 5, patient: { id: "p1", name: "A", image: null } },
        { rating: 4, patient: { id: "p2", name: "B", image: null } },
      ])
      prisma.review.count.mockResolvedValue(2)

      const result = await service.getDoctorReviews("doc-1")

      expect(result.averageRating).toBe(4.5)
      expect(result.total).toBe(2)
      expect(result.items).toHaveLength(2)
    })
  })

  describe("getPatientReviews", () => {
    it("should return reviews for the patient", async () => {
      const reviews = [
        {
          id: "rev-1",
          rating: 5,
          doctor: { user: { id: "doc-1", name: "Dr. Smith", image: null } },
        },
      ]
      prisma.review.findMany.mockResolvedValue(reviews)

      const result = await service.getPatientReviews("patient-1")

      expect(result).toEqual(reviews)
      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { patientId: "patient-1" } }),
      )
    })
  })

  describe("hasReviewed", () => {
    it("should return false when no review exists", async () => {
      prisma.review.findUnique.mockResolvedValue(null)

      const result = await service.hasReviewed("patient-1", "apt-1")

      expect(result).toEqual({ hasReviewed: false, review: null })
    })

    it("should return true with review when one exists", async () => {
      const review = { id: "rev-1", rating: 5 }
      prisma.review.findUnique.mockResolvedValue(review)

      const result = await service.hasReviewed("patient-1", "apt-1")

      expect(result.hasReviewed).toBe(true)
      expect(result.review).toEqual(review)
    })
  })
})
