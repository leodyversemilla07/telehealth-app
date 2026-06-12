import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import { MemoryCache } from "../common/cache/memory-cache"
import { PrismaService } from "../prisma/prisma.service"
import type {
  RegisterDoctorDto,
  SearchDoctorsDto,
  UpdateDoctorProfileDto,
} from "./dto"

const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  image: true,
} as const

@Injectable()
export class DoctorsService {
  private readonly cache = new MemoryCache(120_000) // 2-minute TTL for doctor search

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register a doctor profile for the given user.
   * The user must have role DOCTOR.
   */
  async register(userId: string, dto: RegisterDoctorDto) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })
    if (!user) {
      throw new NotFoundException("User not found")
    }

    const existingProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId },
    })
    if (existingProfile) {
      throw new ConflictException(
        "A doctor profile already exists for this user",
      )
    }

    // Check PRC license uniqueness
    const existing = await this.prisma.doctorProfile.findUnique({
      where: { prcLicenseNumber: dto.prcLicenseNumber },
    })
    if (existing) {
      throw new ConflictException(
        "A doctor with this PRC license number is already registered",
      )
    }

    const profile = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { role: "DOCTOR" },
      })

      return tx.doctorProfile.create({
        data: {
          userId,
          specialty: dto.specialty,
          prcLicenseNumber: dto.prcLicenseNumber,
          prcLicenseExpiry: new Date(dto.prcLicenseExpiry),
          philhealthAccreditation: dto.philhealthAccreditation ?? null,
          pdeaS2License: dto.pdeaS2License ?? null,
          pdeaS2Expiry: dto.pdeaS2Expiry ? new Date(dto.pdeaS2Expiry) : null,
          bio: dto.bio ?? null,
          clinicAddress: dto.clinicAddress ?? null,
          pricePerVisit: dto.pricePerVisit
            ? Number.parseFloat(dto.pricePerVisit)
            : 0,
          isApproved: false,
        },
      })
    })

    return profile
  }

  /**
   * Get all doctors (with user info).
   */
  async findAll(limit = 50, offset = 0) {
    const where = {}
    const [items, total] = await Promise.all([
      this.prisma.doctorProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      this.prisma.doctorProfile.count({ where }),
    ])
    return { items, total, limit, offset }
  }

  /**
   * Get approved doctors (visible to patients for booking).
   * Supports optional filtering by specialty, search (name/specialty), and sorting.
   */
  async findApproved(filters?: SearchDoctorsDto) {
    // Cache key based on filters (cache for 2 minutes)
    const cacheKey = `doctors:approved:${JSON.stringify(filters || {})}`
    const cached = this.cache.get(cacheKey)
    if (cached) return cached as Awaited<ReturnType<typeof this.findApproved>>

    const where: Record<string, unknown> = { isApproved: true }

    // Filter by specialty (case-insensitive partial match)
    if (filters?.specialty) {
      where.specialty = {
        contains: filters.specialty,
        mode: "insensitive",
      }
    }

    // Search across doctor name (via user relation) and specialty
    if (filters?.search) {
      const searchFilter = {
        contains: filters.search,
        mode: "insensitive" as const,
      }

      const searchOr = {
        OR: [{ specialty: searchFilter }, { user: { name: searchFilter } }],
      }

      if (filters.specialty) {
        // Combine specialty filter and search with AND — build a fresh
        // base object instead of referencing `where` to avoid circular
        // Prisma filter.
        where.AND = [{ isApproved: true, specialty: where.specialty }, searchOr]
        delete where.specialty
      } else {
        Object.assign(where, searchOr)
      }
    }

    // Determine orderBy
    let orderBy: Record<string, unknown> = { createdAt: "desc" }
    if (filters?.sort === "price") {
      orderBy = { pricePerVisit: "asc" }
    } else if (filters?.sort === "name") {
      orderBy = { user: { name: "asc" } }
    }

    const doctors = await this.prisma.doctorProfile.findMany({
      where,
      include: {
        user: {
          select: PUBLIC_USER_SELECT,
        },
        _count: {
          select: { reviews: true },
        },
      },
      orderBy,
      take: filters?.limit ?? 50,
      skip: filters?.offset ?? 0,
    })

    // Batch-fetch average ratings for all doctors in one query
    const doctorIds = doctors.map((d) => d.id)
    const ratingAggregates = await this.prisma.review.groupBy({
      by: ["doctorId"],
      where: { doctorId: { in: doctorIds } },
      _avg: { rating: true },
    })
    const avgRatingByDoctor = new Map(
      ratingAggregates.map((r) => [
        r.doctorId,
        Math.round((r._avg.rating || 0) * 10) / 10,
      ]),
    )

    const result = doctors.map((doctor) => ({
      ...doctor,
      averageRating: avgRatingByDoctor.get(doctor.id) || 0,
      totalReviews: doctor._count.reviews,
      _count: undefined,
    }))

    this.cache.set(cacheKey, result)
    return result
  }

  /**
   * Get a single doctor profile by ID.
   */
  async findById(id: string) {
    const profile = await this.prisma.doctorProfile.findFirst({
      where: { id, isApproved: true },
      include: {
        user: {
          select: PUBLIC_USER_SELECT,
        },
        _count: {
          select: { reviews: true },
        },
      },
    })
    if (!profile) {
      throw new NotFoundException(`Doctor profile "${id}" not found`)
    }

    // Aggregate average rating in DB
    const [ratingAggregate] = await this.prisma.review.groupBy({
      by: ["doctorId"],
      where: { doctorId: id },
      _avg: { rating: true },
    })

    const avgRating = ratingAggregate?._avg.rating || 0

    return {
      ...profile,
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: profile._count.reviews,
      _count: undefined,
    }
  }

  /**
   * Get a doctor profile by user ID.
   */
  async findByUserId(userId: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })
    if (!profile) {
      throw new NotFoundException(
        `Doctor profile for user "${userId}" not found`,
      )
    }
    return profile
  }

  /**
   * Update the doctor's own profile.
   */
  async updateProfile(userId: string, dto: UpdateDoctorProfileDto) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId },
    })
    if (!profile) {
      throw new NotFoundException("Doctor profile not found")
    }

    const data: Record<string, unknown> = {}
    if (dto.specialty !== undefined) data.specialty = dto.specialty
    if (dto.bio !== undefined) data.bio = dto.bio
    if (dto.clinicAddress !== undefined) data.clinicAddress = dto.clinicAddress
    if (dto.pricePerVisit !== undefined)
      data.pricePerVisit = Number.parseFloat(dto.pricePerVisit)

    return this.prisma.doctorProfile.update({
      where: { userId },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })
  }

  /**
   * Approve a doctor (admin action — PRC verification).
   */
  async approve(id: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { id },
    })
    if (!profile) {
      throw new NotFoundException(`Doctor profile "${id}" not found`)
    }
    this.cache.invalidatePrefix("doctors:approved")
    return this.prisma.doctorProfile.update({
      where: { id },
      data: { isApproved: true },
    })
  }

  /**
   * Reject / unapprove a doctor.
   */
  async reject(id: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { id },
    })
    if (!profile) {
      throw new NotFoundException(`Doctor profile "${id}" not found`)
    }
    this.cache.invalidatePrefix("doctors:approved")
    return this.prisma.doctorProfile.update({
      where: { id },
      data: { isApproved: false },
    })
  }
}
