import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class ConsentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record a consent action (privacy policy, data sharing, recording, etc.).
   */
  async recordConsent(
    userId: string,
    consentType: string,
    granted: boolean,
    ipAddress?: string | null,
  ) {
    return this.prisma.consentLog.create({
      data: {
        userId,
        consentType,
        granted,
        ipAddress: ipAddress ?? null,
      },
    })
  }

  /**
   * Check if a user has granted a specific consent type.
   */
  async hasConsented(userId: string, consentType: string): Promise<boolean> {
    const latest = await this.prisma.consentLog.findFirst({
      where: { userId, consentType },
      orderBy: { createdAt: "desc" },
    })
    return latest?.granted ?? false
  }

  /**
   * Get all consent logs for a user.
   */
  async getUserConsents(userId: string) {
    return this.prisma.consentLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })
  }
}
