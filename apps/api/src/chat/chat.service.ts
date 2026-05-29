import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Send a message from one user to another.
   */
  async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
    appointmentId?: string,
  ) {
    // Verify receiver exists
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    })
    if (!receiver) {
      throw new NotFoundException("Receiver not found")
    }

    return this.prisma.chatMessage.create({
      data: {
        senderId,
        receiverId,
        content,
        appointmentId: appointmentId || null,
      },
      include: {
        sender: { select: { id: true, name: true, email: true, image: true } },
        receiver: { select: { id: true, name: true, email: true } },
      },
    })
  }

  /**
   * Get conversation between two users.
   */
  async getConversation(userId: string, otherUserId: string, limit = 50) {
    return this.prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    })
  }

  /**
   * Get all conversations for a user (list of people they've chatted with).
   */
  async getConversations(userId: string) {
    // Get distinct users the current user has chatted with
    const sentMessages = await this.prisma.chatMessage.findMany({
      where: { senderId: userId },
      select: { receiverId: true },
      distinct: ["receiverId"],
    })

    const receivedMessages = await this.prisma.chatMessage.findMany({
      where: { receiverId: userId },
      select: { senderId: true },
      distinct: ["senderId"],
    })

    const otherUserIds = [
      ...new Set([
        ...sentMessages.map((m) => m.receiverId),
        ...receivedMessages.map((m) => m.senderId),
      ]),
    ]

    if (otherUserIds.length === 0) return []

    // Get last message and unread count for each conversation
    const conversations = await Promise.all(
      otherUserIds.map(async (otherUserId) => {
        const lastMessage = await this.prisma.chatMessage.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: otherUserId },
              { senderId: otherUserId, receiverId: userId },
            ],
          },
          orderBy: { createdAt: "desc" },
          include: {
            sender: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        })

        const unreadCount = await this.prisma.chatMessage.count({
          where: {
            senderId: otherUserId,
            receiverId: userId,
            isRead: false,
          },
        })

        const otherUser = await this.prisma.user.findUnique({
          where: { id: otherUserId },
          select: { id: true, name: true, email: true, image: true },
        })

        return {
          otherUser,
          lastMessage,
          unreadCount,
        }
      }),
    )

    // Sort by last message time
    return conversations.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt?.getTime() || 0
      const bTime = b.lastMessage?.createdAt?.getTime() || 0
      return bTime - aTime
    })
  }

  /**
   * Mark messages as read.
   */
  async markAsRead(userId: string, senderId: string) {
    return this.prisma.chatMessage.updateMany({
      where: {
        senderId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true },
    })
  }

  /**
   * Get unread count for a user.
   */
  async getUnreadCount(userId: string) {
    const count = await this.prisma.chatMessage.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    })
    return { count }
  }
}
