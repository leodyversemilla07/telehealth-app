import { Injectable, Logger } from "@nestjs/common"
import { EmailService } from "../common/services/email.service"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class SecurityAlertsService {
  private readonly logger = new Logger(SecurityAlertsService.name)
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async createAlert(
    userId: string,
    title: string,
    message: string,
    ipAddress?: string | null,
    userAgent?: string | null,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) return

    const alert = await this.prisma.securityAlert.create({
      data: {
        userId,
        title,
        message,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    })

    try {
      await this.emailService.sendSecurityAlert(user.email, title, message)
    } catch (err) {
      this.logger.error("Failed to send security alert email:", err)
    }

    return alert
  }

  /**
   * Get all security alerts for a user, sorted by creation date descending.
   */
  async getAlerts(userId: string) {
    return this.prisma.securityAlert.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })
  }

  /**
   * Mark all security alerts as read for a user.
   */
  async markAsRead(userId: string) {
    await this.prisma.securityAlert.updateMany({
      where: { userId, read: false },
      data: { read: true },
    })
    return { success: true }
  }
}
