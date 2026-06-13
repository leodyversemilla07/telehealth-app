import { Controller, Get, Post } from "@nestjs/common"
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger"
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { Roles, Session } from "@thallesp/nestjs-better-auth"
import { SecurityAlertsService } from "./security-alerts.service"

@ApiTags("Security Alerts")
@ApiBearerAuth("session-token")
@Controller("users/me/security-alerts")
@Roles(["PATIENT", "DOCTOR", "ADMIN"])
export class SecurityAlertsController {
  constructor(private readonly alertsService: SecurityAlertsService) {}

  @Get()
  @ApiOperation({ summary: "Get current user's security alerts" })
  @ApiOkResponse({ description: "List of security alerts" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async getMyAlerts(@Session() session: UserSession) {
    return this.alertsService.getAlerts(session.user.id)
  }

  @Post("read")
  @ApiOperation({ summary: "Mark all alerts as read" })
  @ApiOkResponse({ description: "Alerts marked as read" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async readAllMyAlerts(@Session() session: UserSession) {
    return this.alertsService.markAsRead(session.user.id)
  }
}
