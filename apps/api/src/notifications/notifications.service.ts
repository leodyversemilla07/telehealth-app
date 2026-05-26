import { Injectable } from "@nestjs/common"
import type { NotificationType } from "@generated/prisma/client.js"
import { PrismaService } from "@/prisma/prisma.service"
import { NotificationsGateway } from "./notifications.gateway"

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
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

    this.gateway.emitToUser(userId, "notification", notification)

    return notification
  }
}
