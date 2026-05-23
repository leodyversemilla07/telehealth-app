import { Controller, Get, Post } from "@nestjs/common"
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { Session } from "@thallesp/nestjs-better-auth"
import { SecurityAlertsService } from "@/security-alerts/security-alerts.service"

@Controller("users/me/security-alerts")
export class SecurityAlertsController {
  constructor(private readonly alertsService: SecurityAlertsService) {}

  /**
   * GET /users/me/security-alerts - Retrieve all security alerts for current user
   */
  @Get()
  async getMyAlerts(@Session() session: UserSession) {
    return this.alertsService.getAlerts(session.user.id)
  }

  /**
   * POST /users/me/security-alerts/read - Mark all alerts as read for current user
   */
  @Post("read")
  async readAllMyAlerts(@Session() session: UserSession) {
    return this.alertsService.markAsRead(session.user.id)
  }
}
