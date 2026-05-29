import { Injectable } from "@nestjs/common"
import type { Role } from "@workspace/shared/types/user"
import { DoctorsService } from "@/doctors/doctors.service"
import { PrismaService } from "@/prisma/prisma.service"
import { UsersService } from "@/users/users.service"

/**
 * AdminService — centralizes admin-only operations.
 * Delegates user/doctor CRUD to existing services and adds
 * dashboard stats that aggregate across modules.
 */
@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly doctorsService: DoctorsService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── User management (delegated) ───────────────────────────────────────

  async listUsers() {
    return this.usersService.findAll()
  }

  async getUser(id: string) {
    return this.usersService.findById(id)
  }

  async updateUser(
    targetId: string,
    actorId: string,
    actorRole: Role,
    data: { name?: string; image?: string },
  ) {
    return this.usersService.updateProfile(targetId, actorId, actorRole, data)
  }

  async banUser(
    actorId: string,
    targetId: string,
    data: { reason?: string; expiresAt?: Date },
  ) {
    return this.usersService.banUser(actorId, targetId, data)
  }

  async unbanUser(actorId: string, targetId: string) {
    return this.usersService.unbanUser(actorId, targetId)
  }

  async setRole(actorId: string, targetId: string, role: Role) {
    return this.usersService.setRole(actorId, targetId, role)
  }

  // ─── Doctor management (delegated) ─────────────────────────────────────

  async listAllDoctors() {
    return this.doctorsService.findAll()
  }

  async approveDoctor(id: string) {
    return this.doctorsService.approve(id)
  }

  async rejectDoctor(id: string) {
    return this.doctorsService.reject(id)
  }

  // ─── Dashboard stats ───────────────────────────────────────────────────

  async getDashboardStats() {
    const [
      totalUsers,
      totalDoctors,
      totalPatients,
      totalAppointments,
      pendingDoctors,
      approvedDoctors,
      bannedUsers,
      recentAppointments,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.doctorProfile.count(),
      this.prisma.user.count({ where: { role: "PATIENT" } }),
      this.prisma.appointment.count(),
      this.prisma.doctorProfile.count({ where: { isApproved: false } }),
      this.prisma.doctorProfile.count({ where: { isApproved: true } }),
      this.prisma.user.count({ where: { banned: true } }),
      this.prisma.appointment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          patient: { select: { name: true } },
          doctor: {
            select: { user: { select: { name: true } } },
          },
        },
      }),
    ])

    return {
      totalUsers,
      totalDoctors,
      totalPatients,
      totalAppointments,
      pendingDoctors,
      approvedDoctors,
      bannedUsers,
      recentAppointments,
    }
  }

  // ─── Reports ──────────────────────────────────────────────────────────

  async getReports() {
    const [
      appointmentsByStatus,
      appointmentsByType,
      usersByRole,
      auditLogsByAction,
      recentAuditLogs,
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
    ] = await Promise.all([
      this.prisma.appointment.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      this.prisma.appointment.groupBy({
        by: ["type"],
        _count: { id: true },
      }),
      this.prisma.user.groupBy({
        by: ["role"],
        _count: { id: true },
      }),
      this.prisma.auditLog.groupBy({
        by: ["action"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      this.prisma.auditLog.findMany({
        take: 20,
        orderBy: { timestamp: "desc" },
      }),
      this.prisma.appointment.count(),
      this.prisma.appointment.count({ where: { status: "COMPLETED" } }),
      this.prisma.appointment.count({ where: { status: "CANCELLED" } }),
    ])

    return {
      appointmentsByStatus: appointmentsByStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      appointmentsByType: appointmentsByType.map((t) => ({
        type: t.type,
        count: t._count.id,
      })),
      usersByRole: usersByRole.map((r) => ({
        role: r.role,
        count: r._count.id,
      })),
      auditLogsByAction: auditLogsByAction.map((a) => ({
        action: a.action,
        count: a._count.id,
      })),
      recentAuditLogs,
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      completionRate:
        totalAppointments > 0
          ? Math.round((completedAppointments / totalAppointments) * 100)
          : 0,
      cancellationRate:
        totalAppointments > 0
          ? Math.round((cancelledAppointments / totalAppointments) * 100)
          : 0,
    }
  }
}
