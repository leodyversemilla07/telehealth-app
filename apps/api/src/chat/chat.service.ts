import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import { sanitize } from "../common/utils/sanitize"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertCanChat(
    userId: string,
    otherUserId: string,
    appointmentId?: string,
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        ...(appointmentId ? { id: appointmentId } : {}),
        OR: [
          { patientId: userId, doctor: { userId: otherUserId } },
          { patientId: otherUserId, doctor: { userId } },
        ],
      },
      select: { id: true },
    })

    if (!appointment) {
      throw new ForbiddenException(
        "Chat is only available between appointment participants",
      )
    }
  }

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

    await this.assertCanChat(senderId, receiverId, appointmentId)

    const safeContent = sanitize(content, 5000) ?? ""

    return this.prisma.chatMessage.create({
      data: {
        senderId,
        receiverId,
        content: safeContent,
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
    await this.assertCanChat(userId, otherUserId)

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

    // Batch fetch: last message per conversation partner, unread counts, and user profiles
    const [allLastMessages, allUnreadCounts, allUsers] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where: {
          OR: otherUserIds.flatMap((otherUserId) => [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ]),
        },
        orderBy: { createdAt: "desc" },
        include: {
          sender: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      }),
      this.prisma.chatMessage.groupBy({
        by: ["senderId"],
        where: {
          receiverId: userId,
          isRead: false,
          senderId: { in: otherUserIds },
        },
        _count: { id: true },
      }),
      this.prisma.user.findMany({
        where: { id: { in: otherUserIds } },
        select: { id: true, name: true, email: true, image: true },
      }),
    ])

    // Index batch results by conversation partner
    const lastMessageByUser = new Map(
      allLastMessages.map((msg) => [
        msg.senderId === userId ? msg.receiverId : msg.senderId,
        msg,
      ]),
    )
    const unreadByUser = new Map(
      allUnreadCounts.map((g) => [g.senderId, g._count.id]),
    )
    const userById = new Map(allUsers.map((u) => [u.id, u]))

    const conversations = otherUserIds.map((otherUserId) => ({
      otherUser: userById.get(otherUserId) || null,
      lastMessage: lastMessageByUser.get(otherUserId) || null,
      unreadCount: unreadByUser.get(otherUserId) || 0,
    }))

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
    await this.assertCanChat(userId, senderId)

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

  /**
   * Get potential contacts based on appointments.
   * For patients: returns doctors they've had appointments with.
   * For doctors: returns patients they've had appointments with.
   */
  async getContacts(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user) return []

    if (user.role === "PATIENT") {
      // Get doctors from appointments
      const appointments = await this.prisma.appointment.findMany({
        where: { patientId: userId },
        select: {
          doctor: {
            select: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
        },
        distinct: ["doctorId"],
      })

      return appointments.map((appt) => appt.doctor.user)
    } else {
      // Get patients from appointments
      const appointments = await this.prisma.appointment.findMany({
        where: {
          doctor: { userId },
        },
        select: {
          patient: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        distinct: ["patientId"],
      })

      return appointments.map((appt) => appt.patient)
    }
  }
}
