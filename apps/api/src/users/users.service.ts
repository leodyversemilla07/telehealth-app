import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import type { Role } from "@workspace/shared/types/user"
import { AuditLogsService } from "../audit-logs/audit-logs.service"
import { SocketService } from "../notifications/socket.service"
import { PrismaService } from "../prisma/prisma.service"
import { SecurityAlertsService } from "../security-alerts/security-alerts.service"
import { StorageService } from "../storage/storage.service"

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
    private readonly alertsService: SecurityAlertsService,
    private readonly socket: SocketService,
    private readonly storage: StorageService,
  ) {}

  /**
   * Fetch all users (admin only).
   */
  async findAll(limit = 50, offset = 0) {
    const where = {}
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          mobile: true,
          preferredLang: true,
          image: true,
          role: true,
          banned: true,
          banReason: true,
          banExpires: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      this.prisma.user.count({ where }),
    ])
    return { items, total, limit, offset }
  }

  /**
   * Fetch a single user by ID.
   * Throws 404 if not found.
   */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        mobile: true,
        preferredLang: true,
        image: true,
        role: true,
        banned: true,
        banReason: true,
        banExpires: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`)
    }

    return user
  }

  /**
   * Update display name or image for a user.
   * Only the owner or an admin can update.
   */
  async updateProfile(
    id: string,
    requesterId: string,
    requesterRole: Role,
    data: {
      firstName?: string
      middleName?: string
      lastName?: string
      image?: string
      role?: Role
    },
  ) {
    if (requesterId !== id && requesterRole !== "ADMIN") {
      throw new ForbiddenException("You can only update your own profile")
    }

    if (data.role !== undefined) {
      throw new ForbiddenException("Use the dedicated role-management flow")
    }

    await this.findById(id) // ensure exists

    // Auto-compute name from individual parts
    const hasNameUpdate =
      data.firstName !== undefined ||
      data.middleName !== undefined ||
      data.lastName !== undefined
    const name = hasNameUpdate
      ? [
          data.firstName ?? undefined,
          data.middleName ?? undefined,
          data.lastName ?? undefined,
        ]
          .filter((n): n is string => !!n)
          .join(" ")
      : undefined

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        name,
        image: data.image,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        updatedAt: true,
      },
    })

    await this.auditLogs.createLog(requesterId, "Updated profile", id)

    // Trigger security alerts
    if (data.image) {
      await this.alertsService.createAlert(
        id,
        "Profile Picture Updated",
        "Your account avatar image was successfully updated.",
      )
    }
    if (hasNameUpdate) {
      await this.alertsService.createAlert(
        id,
        "Profile Info Updated",
        "Your account name was successfully updated.",
      )
    }

    return updated
  }

  /**
   * Ban a user (admin only).
   */
  async banUser(
    actorId: string,
    id: string,
    data: { reason?: string; expiresAt?: Date },
  ) {
    if (actorId === id) {
      throw new ForbiddenException("Cannot ban your own account")
    }
    await this.findById(id) // ensure exists

    // Revoke all active sessions and ban user atomically
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.session.deleteMany({ where: { userId: id } })

      return tx.user.update({
        where: { id },
        data: {
          banned: true,
          banReason: data.reason ?? null,
          banExpires: data.expiresAt ?? null,
        },
        select: {
          id: true,
          email: true,
          banned: true,
          banReason: true,
          banExpires: true,
        },
      })
    })

    // Kill live socket connections: a revoked session must not keep
    // receiving notifications/events until the client happens to reconnect.
    this.socket.disconnectUser(id)

    await this.auditLogs.createLog(
      actorId,
      "Banned user",
      id,
      data.reason ?? undefined,
    )

    return updated
  }

  /**
   * Unban a user (admin only).
   */
  async unbanUser(actorId: string, id: string) {
    await this.findById(id)

    const updated = await this.prisma.user.update({
      where: { id },
      data: { banned: false, banReason: null, banExpires: null },
      select: {
        id: true,
        email: true,
        banned: true,
      },
    })

    await this.auditLogs.createLog(actorId, "Unbanned user", id)

    return updated
  }

  /**
   * Promote or demote a user's role (admin only).
   */
  async setRole(actorId: string, id: string, role: Role) {
    if (actorId === id) {
      throw new ForbiddenException("Cannot change your own role")
    }
    await this.findById(id)

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true },
    })

    await this.auditLogs.createLog(actorId, `Changed role to ${role}`, id)

    return updated
  }

  /**
   * Fetch all active sessions for a user, sorted by creation date.
   */
  async getActiveSessions(userId: string, currentSessionId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    return sessions.map((s) => ({
      id: s.id,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      isCurrent: s.id === currentSessionId,
    }))
  }

  /**
   * Revoke a specific active session.
   * Verify session ownership.
   */
  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    })

    if (!session) {
      throw new NotFoundException(`Session with id "${sessionId}" not found`)
    }

    await this.prisma.session.delete({
      where: { id: sessionId },
    })

    await this.auditLogs.createLog(
      userId,
      "Revoked active session",
      userId,
      `Session ID: ${sessionId}`,
    )

    // Trigger security alert
    await this.alertsService.createAlert(
      userId,
      "Device Session Revoked",
      `An active device session (ID: ${sessionId}) was successfully revoked.`,
    )

    return { success: true }
  }

  /**
   * Revoke all other sessions except the current active one.
   */
  async revokeOtherSessions(userId: string, currentSessionId: string) {
    await this.prisma.session.deleteMany({
      where: {
        userId,
        id: { not: currentSessionId },
      },
    })

    await this.auditLogs.createLog(
      userId,
      "Revoked other active sessions",
      userId,
    )

    // Trigger security alert
    await this.alertsService.createAlert(
      userId,
      "Multiple Device Sessions Revoked",
      "All other active device sessions were successfully terminated.",
    )

    return { success: true }
  }

  /**
   * Deactivate and anonymize the account while retaining clinical records.
   * Healthcare records and appointment history must not be deleted merely
   * because authentication access is withdrawn. Direct identifiers and
   * authentication artifacts are removed in the same transaction so the
   * account can never be left half-anonymized.
   */
  async deleteAccount(userId: string) {
    const account = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        doctorProfile: { select: { id: true } },
      },
    })
    if (!account) {
      throw new NotFoundException(`User with id "${userId}" not found`)
    }

    const avatarKeys = await this.storage.listFiles(`avatar-${userId}-`)

    // Fail closed if object cleanup fails; the user can retry the request.
    await Promise.all(avatarKeys.map((key) => this.storage.deleteFile(key)))

    const anonymizedEmail = `deleted-${userId}@invalid.telehealth`

    await this.prisma.$transaction(async (tx) => {
      // Keep the row so appointment and clinical-record foreign keys remain
      // valid, but remove direct identifiers and all authentication access.
      await tx.user.update({
        where: { id: userId },
        data: {
          email: anonymizedEmail,
          emailVerified: false,
          mobile: null,
          mobileVerified: false,
          name: null,
          firstName: null,
          middleName: null,
          lastName: null,
          image: null,
          banned: true,
          banReason: "Account deleted by user",
          banExpires: null,
          failedLoginAttempts: 0,
          lockoutUntil: null,
          privacyPolicyAcceptedAt: null,
          privacyPolicyVersion: null,
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorBackupCodes: null,
        },
      })

      // Patient contact details and government identifiers are direct PII.
      // Clinical attributes (DOB, measurements, and medical history) remain
      // available for continuity of care.
      await tx.patientProfile.updateMany({
        where: { userId },
        data: {
          phone: null,
          address: null,
          philhealthNumber: null,
        },
      })

      // A doctor account may also be deleted. Keep the professional profile
      // for appointment/record foreign keys, but hide it and remove license,
      // accreditation, clinic, and biography identifiers.
      await tx.doctorProfile.updateMany({
        where: { userId },
        data: {
          prcLicenseNumber: `deleted-${userId}`,
          philhealthAccreditation: null,
          pdeaS2License: null,
          pdeaS2Expiry: null,
          bio: null,
          clinicAddress: null,
          isApproved: false,
          isVerified: false,
          verifiedAt: null,
          rejectionReason: null,
        },
      })

      await tx.session.deleteMany({ where: { userId } })
      await tx.account.deleteMany({ where: { userId } })
      await tx.twoFactor.deleteMany({ where: { userId } })
      await tx.notificationPreference.deleteMany({ where: { userId } })
      await tx.pushSubscription.deleteMany({ where: { userId } })
      await tx.notification.deleteMany({ where: { userId } })
      await tx.securityAlert.deleteMany({ where: { userId } })

      // Pending verification records have no foreign key to User and may
      // contain the original email address, so remove them explicitly.
      await tx.verification.deleteMany({
        where: {
          OR: [{ identifier: account.email }, { identifier: userId }],
        },
      })

      // Consent history is retained for compliance, but request IP addresses
      // are direct account data and must not survive deactivation.
      await tx.consentLog.updateMany({
        where: { userId },
        data: { ipAddress: null },
      })

      // Conversations are retained as clinical context, but message bodies may
      // contain identifiers that were not present in the structured profile.
      await tx.chatMessage.updateMany({
        where: { OR: [{ senderId: userId }, { receiverId: userId }] },
        data: { content: "[Message removed with deleted account]" },
      })

      // Medical-document bytes are retained for care/legal obligations. Their
      // original filenames can contain patient identifiers, so redact those.
      await tx.medicalDocument.updateMany({
        where: { OR: [{ patientId: userId }, { uploadedById: userId }] },
        data: { fileName: "redacted-document" },
      })

      // Reviews are user-authored public content rather than clinical records.
      // Remove a deleted patient's reviews instead of exposing a pseudonymous
      // account that still represents that person.
      await tx.review.deleteMany({ where: { patientId: userId } })

      // Audit trails are retained, but email addresses are replaced with the
      // same stable pseudonym used by the deactivated account.
      await tx.auditLog.updateMany({
        where: { actorId: userId },
        data: {
          actorEmail: anonymizedEmail,
          reason: null,
        },
      })
      await tx.auditLog.updateMany({
        where: {
          targetId: {
            in: [
              userId,
              ...(account.doctorProfile ? [account.doctorProfile.id] : []),
            ],
          },
        },
        data: { targetEmail: anonymizedEmail },
      })
      await tx.auditLog.create({
        data: {
          action: "Anonymized own account",
          actorId: userId,
          actorEmail: anonymizedEmail,
          targetId: userId,
          targetEmail: anonymizedEmail,
        },
      })
    })

    // A revoked session must not keep receiving live events while the client
    // waits for its next session check.
    this.socket.disconnectUser(userId)

    return { success: true }
  }
}
