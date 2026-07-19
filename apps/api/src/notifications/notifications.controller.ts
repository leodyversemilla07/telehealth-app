import { Body, Controller, Get, Param, Patch, Put, Query } from "@nestjs/common"
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger"
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { Roles, Session } from "@thallesp/nestjs-better-auth"
import { NotificationQueryDto } from "./dto/notification-query.dto"
import { NotificationsService } from "./notifications.service"

@ApiTags("Notifications")
@ApiBearerAuth("session-token")
@Controller("notifications")
@Roles(["PATIENT", "DOCTOR", "ADMIN"])
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "List current user's notifications" })
  @ApiOkResponse({ description: "List of notifications" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async getNotifications(
    @Session() session: UserSession,
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationsService.getNotifications(session.user.id, query)
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Get unread notification count" })
  @ApiOkResponse({ description: "Unread notification count" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async getUnreadCount(@Session() session: UserSession) {
    return this.notificationsService.getUnreadCount(session.user.id)
  }

  @Get("preferences")
  @ApiOperation({ summary: "Get notification preferences" })
  @ApiOkResponse({ description: "Notification preferences" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  async getPreferences(@Session() session: UserSession) {
    return this.notificationsService.getPreferences(session.user.id)
  }

  @Put("preferences")
  @ApiOperation({ summary: "Update notification preferences" })
  @ApiOkResponse({ description: "Preferences updated" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  async updatePreferences(
    @Session() session: UserSession,
    @Body()
    data: {
      appointmentReminder?: boolean
      appointmentConfirmation?: boolean
      appointmentCancelled?: boolean
      newMessage?: boolean
      scheduleUpdated?: boolean
      system?: boolean
      pushEnabled?: boolean
      emailEnabled?: boolean
    },
  ) {
    return this.notificationsService.updatePreferences(session.user.id, data)
  }

  @Patch("mark-all-read")
  @ApiOperation({ summary: "Mark all notifications as read" })
  @ApiOkResponse({ description: "Notifications marked as read" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async markAllAsRead(@Session() session: UserSession) {
    return this.notificationsService.markAllAsRead(session.user.id)
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark a single notification as read" })
  @ApiParam({ name: "id", description: "Notification ID" })
  @ApiOkResponse({ description: "Notification marked as read" })
  @ApiNotFoundResponse({ description: "Not found" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async markAsRead(@Session() session: UserSession, @Param("id") id: string) {
    return this.notificationsService.markAsRead(session.user.id, id)
  }
}
