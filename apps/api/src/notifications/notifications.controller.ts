import { Controller, Get, Param, Patch, Query } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger"
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
  async getNotifications(
    @Session() session: UserSession,
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationsService.getNotifications(session.user.id, query)
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Get unread notification count" })
  async getUnreadCount(@Session() session: UserSession) {
    return this.notificationsService.getUnreadCount(session.user.id)
  }

  @Patch("mark-all-read")
  @ApiOperation({ summary: "Mark all notifications as read" })
  async markAllAsRead(@Session() session: UserSession) {
    return this.notificationsService.markAllAsRead(session.user.id)
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark a single notification as read" })
  @ApiParam({ name: "id", description: "Notification ID" })
  async markAsRead(@Session() session: UserSession, @Param("id") id: string) {
    return this.notificationsService.markAsRead(session.user.id, id)
  }
}
