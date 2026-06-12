import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an audit log entry.
   * Accepts optional pre-resolved emails to avoid extra DB lookups.
   */
  async createLog(
    actorId: string,
    action: string,
    targetId?: string,
    reason?: string,
    actorEmail?: string,
    targetEmail?: string | null,
  ) {
    // Resolve emails only if not provided by caller
    let resolvedActorEmail = actorEmail
    let resolvedTargetEmail = targetEmail

    if (!resolvedActorEmail || (!resolvedTargetEmail && targetId)) {
      const [actor, target] = await Promise.all([
        !resolvedActorEmail
          ? this.prisma.user.findUnique({
              where: { id: actorId },
              select: { email: true },
            })
          : null,
        targetId && !resolvedTargetEmail
          ? this.prisma.user.findUnique({
              where: { id: targetId },
              select: { email: true },
            })
          : null,
      ])
      resolvedActorEmail =
        resolvedActorEmail || actor?.email || "unknown@system"
      resolvedTargetEmail = resolvedTargetEmail || target?.email || null
    }

    return this.prisma.auditLog.create({
      data: {
        action,
        actorId,
        actorEmail: resolvedActorEmail,
        targetId: targetId || null,
        targetEmail: resolvedTargetEmail,
        reason: reason || null,
      },
    })
  }

  async getLogs(limit = 50, offset = 0) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        take: limit,
        skip: offset,
        orderBy: { timestamp: "desc" },
      }),
      this.prisma.auditLog.count(),
    ])
    return { items, total, limit, offset }
  }
}
