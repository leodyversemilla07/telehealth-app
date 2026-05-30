import { Injectable, Logger } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name)

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async purgeOldRecords() {
    this.logger.log("Starting data retention cleanup...")
    const results: string[] = []

    results.push(await this.purgeVerifications())
    results.push(await this.purgeNotifications())
    results.push(await this.purgeSecurityAlerts())
    results.push(await this.purgeAuditLogs())

    for (const result of results) {
      this.logger.log(result)
    }
    this.logger.log("Data retention cleanup complete.")
  }

  private async purgeVerifications(): Promise<string> {
    const cutoff = new Date()
    cutoff.setHours(cutoff.getHours() - 24)
    const count = await this.prisma.verification.deleteMany({
      where: { createdAt: { lt: cutoff } },
    })
    return `Purged ${count.count} expired verification codes`
  }

  private async purgeNotifications(): Promise<string> {
    const retentionDays = Number(process.env.RETENTION_NOTIFICATIONS_DAYS) || 90
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - retentionDays)
    const count = await this.prisma.notification.deleteMany({
      where: { createdAt: { lt: cutoff }, isRead: true },
    })
    return `Purged ${count.count} read notifications older than ${retentionDays} days`
  }

  private async purgeSecurityAlerts(): Promise<string> {
    const retentionDays =
      Number(process.env.RETENTION_SECURITY_ALERTS_DAYS) || 730
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - retentionDays)
    const count = await this.prisma.securityAlert.deleteMany({
      where: { createdAt: { lt: cutoff }, read: true },
    })
    return `Purged ${count.count} read security alerts older than ${retentionDays} days`
  }

  private async purgeAuditLogs(): Promise<string> {
    const retentionDays = Number(process.env.RETENTION_AUDIT_LOGS_DAYS) || 2555
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - retentionDays)
    const count = await this.prisma.auditLog.deleteMany({
      where: { timestamp: { lt: cutoff } },
    })
    return `Purged ${count.count} audit logs older than ${retentionDays} days (${Math.floor(retentionDays / 365)} years)`
  }
}
