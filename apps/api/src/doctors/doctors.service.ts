import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import type {
  RegisterDoctorDto,
  SearchDoctorsDto,
  UpdateDoctorProfileDto,
} from "@/doctors/dto"
import { PrismaService } from "@/prisma/prisma.service"

const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  image: true,
} as const

@Injectable()
export class DoctorsService {
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

    // Check PRC license uniqueness
    const existing = await this.prisma.doctorProfile.findUnique({
      where: { prcLicenseNumber: dto.prcLicenseNumber },
    })
    if (existing) {
      throw new ConflictException(
        "A doctor with this PRC license number is already registered",
      )
    }

    // Create the doctor profile
    const profile = await this.prisma.doctorProfile.create({
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

    return profile
  }

  /**
   * Get all doctors (with user info).
   */
  async findAll() {
    return this.prisma.doctorProfile.findMany({
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
    })
  }

  /**
   * Get approved doctors (visible to patients for booking).
   * Supports optional filtering by specialty, search (name/specialty), and sorting.
   */
  async findApproved(filters?: SearchDoctorsDto) {
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

      // When both specialty filter and search are present, combine with AND
      const searchOr = {
        OR: [{ specialty: searchFilter }, { user: { name: searchFilter } }],
      }

      if (filters.specialty) {
        // Merge search OR with existing specialty filter under AND
        where.AND = [where, searchOr]
        // Remove the top-level specialty since it's now inside AND
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
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy,
    })

    return doctors.map((doctor) => {
      const reviews = doctor.reviews || []
      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0

      return {
        ...doctor,
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length,
        reviews: undefined,
      }
    })
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
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    })
    if (!profile) {
      throw new NotFoundException(`Doctor profile "${id}" not found`)
    }

    const reviews = profile.reviews || []
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0

    return {
      ...profile,
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length,
      reviews: undefined,
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
    return this.prisma.doctorProfile.update({
      where: { id },
      data: { isApproved: false },
    })
  }
}
