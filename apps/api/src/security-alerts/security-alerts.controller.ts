import { Controller, Get, Post } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger"
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { Session } from "@thallesp/nestjs-better-auth"
import { SecurityAlertsService } from "@/security-alerts/security-alerts.service"

@ApiTags("Security Alerts")
@ApiBearerAuth("session-token")
@Controller("users/me/security-alerts")
export class SecurityAlertsController {
  constructor(private readonly alertsService: SecurityAlertsService) {}

  @Get()
  @ApiOperation({ summary: "Get current user's security alerts" })
  async getMyAlerts(@Session() session: UserSession) {
    return this.alertsService.getAlerts(session.user.id)
  }

  @Post("read")
  @ApiOperation({ summary: "Mark all alerts as read" })
  async readAllMyAlerts(@Session() session: UserSession) {
    return this.alertsService.markAsRead(session.user.id)
  }
}
