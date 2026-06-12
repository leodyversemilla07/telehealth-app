import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import type { Role } from "@workspace/shared/types/user"
import { AuditLogsService } from "../audit-logs/audit-logs.service"
import { PrismaService } from "../prisma/prisma.service"
import { SecurityAlertsService } from "../security-alerts/security-alerts.service"

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
    private readonly alertsService: SecurityAlertsService,
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
    data: { name?: string; image?: string; role?: Role },
  ) {
    if (requesterId !== id && requesterRole !== "ADMIN") {
      throw new ForbiddenException("You can only update your own profile")
    }

    if (data.role !== undefined) {
      throw new ForbiddenException("Use the dedicated role-management flow")
    }

    await this.findById(id) // ensure exists

    const updated = await this.prisma.user.update({
      where: { id },
      data: { name: data.name, image: data.image },
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
    if (data.name) {
      await this.alertsService.createAlert(
        id,
        "Profile Info Updated",
        "Your account display name was successfully updated.",
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

    // Revoke all active sessions so an already-authenticated banned user
    // is signed out on next API call.
    await this.prisma.session.deleteMany({ where: { userId: id } })

    const updated = await this.prisma.user.update({
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
}
