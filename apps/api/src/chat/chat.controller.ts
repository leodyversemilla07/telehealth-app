import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common"
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger"
import { Throttle } from "@nestjs/throttler"
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { Roles, Session } from "@thallesp/nestjs-better-auth"
import { IsOptional, IsString, MaxLength } from "class-validator"
import { ChatService } from "./chat.service"

class SendMessageDto {
  @IsString()
  receiverId!: string

  @IsString()
  @MaxLength(5000)
  content!: string

  @IsOptional()
  @IsString()
  appointmentId?: string
}

@ApiTags("Chat")
@ApiBearerAuth("session-token")
@Roles(["PATIENT", "DOCTOR"])
@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post("send")
  @Throttle({ default: { limit: 30, ttl: 60_000 } }) // 30 messages per minute
  @ApiOperation({ summary: "Send a message" })
  @ApiCreatedResponse({ description: "Message sent" })
  @ApiBadRequestResponse({ description: "Invalid input" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
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
  @ApiOkResponse({ description: "List of conversations" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async getConversations(@Session() session: UserSession) {
    return this.chatService.getConversations(session.user.id)
  }

  @Get("conversation/:userId")
  @ApiOperation({ summary: "Get conversation with a specific user" })
  @ApiParam({ name: "userId", description: "Other user's ID" })
  @ApiOkResponse({ description: "Conversation messages" })
  @ApiNotFoundResponse({ description: "Not found" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async getConversation(
    @Session() session: UserSession,
    @Param("userId") otherUserId: string,
    @Query("limit") limit?: string,
  ) {
    return this.chatService.getConversation(
      session.user.id,
      otherUserId,
      Math.min(limit ? parseInt(limit, 10) : 50, 200),
    )
  }

  @Post("read/:senderId")
  @ApiOperation({ summary: "Mark messages from a sender as read" })
  @ApiParam({ name: "senderId", description: "Sender's user ID" })
  @ApiOkResponse({ description: "Messages marked as read" })
  @ApiNotFoundResponse({ description: "Not found" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async markAsRead(
    @Session() session: UserSession,
    @Param("senderId") senderId: string,
  ) {
    return this.chatService.markAsRead(session.user.id, senderId)
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Get unread message count" })
  @ApiOkResponse({ description: "Unread message count" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async getUnreadCount(@Session() session: UserSession) {
    return this.chatService.getUnreadCount(session.user.id)
  }

  @Get("contacts")
  @ApiOperation({ summary: "Get potential contacts based on appointments" })
  @ApiOkResponse({ description: "List of contacts" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async getContacts(@Session() session: UserSession) {
    return this.chatService.getContacts(session.user.id)
  }
}
