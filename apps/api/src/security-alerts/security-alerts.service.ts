import { Injectable } from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"

@Injectable()
export class SecurityAlertsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a security alert, save it to the database, and log simulated SMTP email dispatch.
   */
  async createAlert(
    userId: string,
    title: string,
    message: string,
    ipAddress?: string | null,
    userAgent?: string | null,
  ) {
    // 1. Fetch user to get email for SMTP logs
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) return

    // 2. Save alert to database
    const alert = await this.prisma.securityAlert.create({
      data: {
        userId,
        title,
        message,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    })

    // 3. Print SMTP console logs
    console.log(
      `\x1b[33m[Security SMTP Send]\x1b[0m To: \x1b[36m${user.email}\x1b[0m | Subject: \x1b[1m[Telehealth Platform] Security Alert: ${title}\x1b[0m | Message: ${message}`,
    )

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
