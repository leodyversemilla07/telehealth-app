import { Injectable, Logger } from "@nestjs/common"
import type { NotificationType } from "../generated/prisma/client.js"
import { PrismaService } from "../prisma/prisma.service"
import { PushService } from "../push/push.service"
import { SocketService } from "./socket.service"

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)
  constructor(
    private readonly prisma: PrismaService,
    private readonly socket: SocketService,
    private readonly push: PushService,
  ) {}

  async getNotifications(
    userId: string,
    query: { limit?: number; offset?: number },
  ) {
    const limit = query.limit ?? 50
    const offset = query.offset ?? 0

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ])

    return { items, total, limit, offset }
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    })
    return { count }
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification || notification.userId !== userId) {
      return null
    }

    if (notification.isRead) {
      return notification
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    })
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    })
    return { success: true }
  }

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body?: string,
  ) {
    const notification = await this.prisma.notification.create({
      data: { userId, type, title, body },
    })

    this.socket.emitToUser(userId, "notification", notification)

    // Fire-and-forget browser push (non-blocking)
    this.push.sendToUser(userId, { title, body }).catch((err) => {
      this.logger.warn(
        `Push notification failed for user ${userId}: ${err instanceof Error ? err.message : String(err)}`,
      )
    })

    return notification
  }
}
