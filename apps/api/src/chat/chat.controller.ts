import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger"
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { Session } from "@thallesp/nestjs-better-auth"
import { IsOptional, IsString } from "class-validator"
import { ChatService } from "./chat.service"

class SendMessageDto {
  @IsString()
  receiverId!: string

  @IsString()
  content!: string

  @IsOptional()
  @IsString()
  appointmentId?: string
}

@ApiTags("Chat")
@ApiBearerAuth("session-token")
@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post("send")
  @ApiOperation({ summary: "Send a message" })
  async sendMessage(
    @Session() session: UserSession,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(
      session.user.id,
      dto.receiverId,
      dto.content,
      dto.appointmentId,
    )
  }

  @Get("conversations")
  @ApiOperation({ summary: "Get all conversations" })
  async getConversations(@Session() session: UserSession) {
    return this.chatService.getConversations(session.user.id)
  }

  @Get("conversation/:userId")
  @ApiOperation({ summary: "Get conversation with a specific user" })
  @ApiParam({ name: "userId", description: "Other user's ID" })
  async getConversation(
    @Session() session: UserSession,
    @Param("userId") otherUserId: string,
    @Query("limit") limit?: string,
  ) {
    return this.chatService.getConversation(
      session.user.id,
      otherUserId,
      limit ? parseInt(limit) : 50,
    )
  }

  @Post("read/:senderId")
  @ApiOperation({ summary: "Mark messages from a sender as read" })
  @ApiParam({ name: "senderId", description: "Sender's user ID" })
  async markAsRead(
    @Session() session: UserSession,
    @Param("senderId") senderId: string,
  ) {
    return this.chatService.markAsRead(session.user.id, senderId)
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Get unread message count" })
  async getUnreadCount(@Session() session: UserSession) {
    return this.chatService.getUnreadCount(session.user.id)
  }
}
