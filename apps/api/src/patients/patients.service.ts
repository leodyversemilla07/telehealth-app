import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"
import type { Prisma } from "../../generated/prisma/client.js"
import type { UpdatePatientProfileDto } from "./dto"

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get the patient profile for the current user.
   * Creates one automatically if it doesn't exist.
   */
  async getOrCreateProfile(userId: string) {
    let profile = await this.prisma.patientProfile.findUnique({
      where: { userId },
    })

    if (!profile) {
      profile = await this.prisma.patientProfile.create({
        data: { userId },
      })
    }

    return profile
  }

  /**
   * Update patient profile fields.
   */
  async updateProfile(userId: string, data: UpdatePatientProfileDto) {
    await this.getOrCreateProfile(userId)

    return this.prisma.patientProfile.update({
      where: { userId },
      data: {
        ...(data.dob ? { dob: new Date(data.dob) } : {}),
        ...(data.sex !== undefined ? { sex: data.sex } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.address !== undefined ? { address: data.address } : {}),
        ...(data.philhealthNumber !== undefined
          ? { philhealthNumber: data.philhealthNumber }
          : {}),
        ...(data.weight !== undefined ? { weight: data.weight } : {}),
        ...(data.height !== undefined ? { height: data.height } : {}),
        ...(data.medicalHistory !== undefined
          ? { medicalHistory: data.medicalHistory as Prisma.InputJsonValue }
          : {}),
      },
    })
  }

  /**
   * Get patient profile by user ID (with user info).
   */
  async findByUserId(userId: string) {
    const profile = await this.prisma.patientProfile.findUnique({
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
        `Patient profile for user "${userId}" not found`,
      )
    }
    return profile
  }
}
