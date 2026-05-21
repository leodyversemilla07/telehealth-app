import { Injectable } from "@nestjs/common"
import type { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async createLog(
    actorId: string,
    action: string,
    targetId?: string,
    reason?: string,
  ) {
    // Resolve actor email
    const actor = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: { email: true },
    })
    const actorEmail = actor?.email || "unknown@system"

    // Resolve target email if targetId is provided
    let targetEmail: string | null = null
    if (targetId) {
      const target = await this.prisma.user.findUnique({
        where: { id: targetId },
        select: { email: true },
      })
      targetEmail = target?.email || null
    }

    return this.prisma.auditLog.create({
      data: {
        action,
        actorId,
        actorEmail,
        targetId: targetId || null,
        targetEmail,
        reason: reason || null,
      },
    })
  }

  async getLogs() {
    return this.prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
    })
  }
}
