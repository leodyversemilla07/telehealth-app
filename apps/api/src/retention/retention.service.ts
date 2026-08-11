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

    let deactivated = 0
    let cancelledAppointments = 0
    let patientNotices = 0
    for (const doctor of expiredDoctors) {
      // Deactivate profile; a doctor whose PRC license lapsed must not be
      // bookable or continue taking new consultations.
      await this.prisma.doctorProfile.update({
        where: { id: doctor.id },
        data: { isApproved: false },
      })
      deactivated++

      // Cancel the doctor's future bookings so patients aren't left with a
      // consultation against a deactivated doctor — and tell those patients
      // why their appointment no longer stands.
      const upcoming = await this.prisma.appointment.findMany({
        where: {
          doctorId: doctor.id,
          status: { in: ["BOOKED", "CONFIRMED"] },
          startTime: { gt: now },
        },
        select: {
          id: true,
          patientId: true,
          doctor: { select: { user: { select: { name: true } } } },
        },
      })
      if (upcoming.length > 0) {
        const cancelled = await this.prisma.appointment.updateMany({
          where: { id: { in: upcoming.map((a) => a.id) } },
          data: { status: "CANCELLED" },
        })
        cancelledAppointments += cancelled.count
      }
      const doctorName = upcoming[0]?.doctor.user.name ?? "your doctor"
      for (const appt of upcoming) {
        await this.prisma.notification.create({
          data: {
            userId: appt.patientId,
            type: "APPOINTMENT_CANCELLED",
            title: "Appointment Cancelled — Doctor License Expired",
            body: `Your appointment with Dr. ${doctorName} was cancelled because the doctor's license expired on ${doctor.prcLicenseExpiry.toLocaleDateString()}.`,
          },
        })
        patientNotices++
      }

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

    // Dedup: only warn once per ~6-month window. The cron runs daily and
    // without this every expiring doctor would get a duplicate "expiring
    // soon" notification every single day until renewal.
    const warningWindowStart = new Date(
      now.getTime() - 5 * 30 * 24 * 60 * 60 * 1000,
    )
    let warned = 0
    for (const doctor of expiringSoon) {
      const alreadyWarned = await this.prisma.notification.findFirst({
        where: {
          userId: doctor.userId,
          title: "PRC License Expiring Soon",
          createdAt: { gte: warningWindowStart },
        },
        select: { id: true },
      })
      if (alreadyWarned) continue

      await this.prisma.notification.create({
        data: {
          userId: doctor.userId,
          type: "APPOINTMENT_REMINDER",
          title: "PRC License Expiring Soon",
          body: `Your PRC license will expire on ${doctor.prcLicenseExpiry.toLocaleDateString()}. Please renew before the expiration date to avoid deactivation.`,
        },
      })
      warned++
    }

    if (deactivated > 0 || warned > 0) {
      await this.prisma.auditLog.create({
        data: {
          action: "LICENSE_VERIFICATION",
          actorId: "system",
          actorEmail: "system@telehealth",
          reason: `NFR-COMP-05: Deactivated ${deactivated} expired (cancelled ${cancelledAppointments} future appointments, notified ${patientNotices} patients), warned ${warned} expiring doctors`,
        },
      })
    }

    return `License verification: deactivated ${deactivated} expired, warned ${warned} expiring doctors`
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
