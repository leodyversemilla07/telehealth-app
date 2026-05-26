import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"
import type { RegisterDoctorDto, SearchDoctorsDto } from "@/doctors/dto"

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
        isApproved: dto.isApproved ?? false,
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
        OR: [
          { specialty: searchFilter },
          { user: { name: searchFilter } },
        ],
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

    return this.prisma.doctorProfile.findMany({
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
      orderBy,
    })
  }

  /**
   * Get a single doctor profile by ID.
   */
  async findById(id: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { id },
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
      throw new NotFoundException(`Doctor profile "${id}" not found`)
    }
    return profile
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
