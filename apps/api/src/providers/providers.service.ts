import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"
import type { RegisterProviderDto } from "@/providers/dto"

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register a provider profile for the given user.
   * The user must have role PROVIDER.
   */
  async register(userId: string, dto: RegisterProviderDto) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })
    if (!user) {
      throw new NotFoundException("User not found")
    }

    // Check PRC license uniqueness
    const existing = await this.prisma.providerProfile.findUnique({
      where: { prcLicenseNumber: dto.prcLicenseNumber },
    })
    if (existing) {
      throw new ConflictException(
        "A provider with this PRC license number is already registered",
      )
    }

    // Create the provider profile
    const profile = await this.prisma.providerProfile.create({
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
   * Get all providers (with user info).
   */
  async findAll() {
    return this.prisma.providerProfile.findMany({
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
   * Get approved providers (visible to patients for booking).
   */
  async findApproved() {
    return this.prisma.providerProfile.findMany({
      where: { isApproved: true },
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
   * Get a single provider profile by ID.
   */
  async findById(id: string) {
    const profile = await this.prisma.providerProfile.findUnique({
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
      throw new NotFoundException(`Provider profile "${id}" not found`)
    }
    return profile
  }

  /**
   * Get a provider profile by user ID.
   */
  async findByUserId(userId: string) {
    const profile = await this.prisma.providerProfile.findUnique({
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
        `Provider profile for user "${userId}" not found`,
      )
    }
    return profile
  }

  /**
   * Approve a provider (admin action — PRC verification).
   */
  async approve(id: string) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { id },
    })
    if (!profile) {
      throw new NotFoundException(`Provider profile "${id}" not found`)
    }
    return this.prisma.providerProfile.update({
      where: { id },
      data: { isApproved: true },
    })
  }

  /**
   * Reject / unapprove a provider.
   */
  async reject(id: string) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { id },
    })
    if (!profile) {
      throw new NotFoundException(`Provider profile "${id}" not found`)
    }
    return this.prisma.providerProfile.update({
      where: { id },
      data: { isApproved: false },
    })
  }
}
