import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { Cron, CronExpression } from "@nestjs/schedule"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async purgeOldRecords() {
    this.logger.log("Starting data retention cleanup...")
    const results: string[] = []

    results.push(await this.purgeVerifications())
    results.push(await this.purgeNotifications())
    results.push(await this.purgeSecurityAlerts())
    results.push(await this.purgeAuditLogs())
    results.push(await this.verifyDoctorLicenses())

    for (const result of results) {
      this.logger.log(result)
    }
    this.logger.log("Data retention cleanup complete.")
  }

  // NFR-COMP-05: Auto-reverify doctor PRC licenses every 6 months.
  // Runs daily and flags doctors with expired or soon-to-expire licenses.
  private async verifyDoctorLicenses(): Promise<string> {
    const now = new Date()
    const sixMonthsFromNow = new Date()
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)

    const expiredDoctors = await this.prisma.doctorProfile.findMany({
      where: { prcLicenseExpiry: { lt: now }, isApproved: true },
      select: { id: true, userId: true, prcLicenseExpiry: true },
    })

    for (const doctor of expiredDoctors) {
      await this.prisma.doctorProfile.update({
        where: { id: doctor.id },
        data: { isApproved: false },
      })
      await this.prisma.notification.create({
        data: {
          userId: doctor.userId,
          type: "APPOINTMENT_CANCELLED",
          title: "License Expired — Profile Deactivated",
          body: `Your PRC license expired on ${doctor.prcLicenseExpiry.toLocaleDateString()}. Your profile has been deactivated. Please renew your license and contact support.`,
        },
      })
    }

    const expiringSoon = await this.prisma.doctorProfile.findMany({
      where: {
        prcLicenseExpiry: { gt: now, lt: sixMonthsFromNow },
        isApproved: true,
      },
      select: { id: true, userId: true, prcLicenseExpiry: true },
    })

    for (const doctor of expiringSoon) {
      await this.prisma.notification.create({
        data: {
          userId: doctor.userId,
          type: "APPOINTMENT_REMINDER",
          title: "PRC License Expiring Soon",
          body: `Your PRC license will expire on ${doctor.prcLicenseExpiry.toLocaleDateString()}. Please renew before the expiration date to avoid deactivation.`,
        },
      })
    }

    const expiredCount = expiredDoctors.length
    const expiringCount = expiringSoon.length
    if (expiredCount > 0 || expiringCount > 0) {
      await this.prisma.auditLog.create({
        data: {
          action: "LICENSE_VERIFICATION",
          actorId: "system",
          actorEmail: "system@telehealth",
          reason: `NFR-COMP-05: Deactivated ${expiredCount} expired, warned ${expiringCount} expiring doctors`,
        },
      })
    }

    return `License verification: deactivated ${expiredCount} expired, notified ${expiringCount} expiring doctors`
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
    const retentionDays =
      this.config.get<number>("RETENTION_NOTIFICATIONS_DAYS") || 90
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - retentionDays)
    const count = await this.prisma.notification.deleteMany({
      where: { createdAt: { lt: cutoff }, isRead: true },
    })
    return `Purged ${count.count} read notifications older than ${retentionDays} days`
  }

  private async purgeSecurityAlerts(): Promise<string> {
    const retentionDays =
      this.config.get<number>("RETENTION_SECURITY_ALERTS_DAYS") || 730
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - retentionDays)
    const count = await this.prisma.securityAlert.deleteMany({
      where: { createdAt: { lt: cutoff }, read: true },
    })
    return `Purged ${count.count} read security alerts older than ${retentionDays} days`
  }

  private async purgeAuditLogs(): Promise<string> {
    const retentionDays =
      this.config.get<number>("RETENTION_AUDIT_LOGS_DAYS") || 2555
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - retentionDays)
    const count = await this.prisma.auditLog.deleteMany({
      where: { timestamp: { lt: cutoff } },
    })
    return `Purged ${count.count} audit logs older than ${retentionDays} days (${Math.floor(retentionDays / 365)} years)`
  }
}
