import { Body, Controller, Get, Post } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger"
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { Session } from "@thallesp/nestjs-better-auth"
import { ConsentService } from "@/consent/consent.service"

@ApiTags("Consent")
@ApiBearerAuth("session-token")
@Controller("consent")
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Post()
  @ApiOperation({
    summary: "Record a consent action (privacy policy, data sharing, etc.)",
  })
  async recordConsent(
    @Session() session: UserSession,
    @Body() body: { consentType: string; granted: boolean },
  ) {
    const ipAddress =
      session.session && typeof session.session === "object"
        ? ((session.session as Record<string, unknown>).ipAddress as
            | string
            | undefined)
        : undefined
    return this.consentService.recordConsent(
      session.user.id,
      body.consentType,
      body.granted,
      ipAddress,
    )
  }

  @Get()
  @ApiOperation({ summary: "Get current user's consent history" })
  async getMyConsents(@Session() session: UserSession) {
    return this.consentService.getUserConsents(session.user.id)
  }
}
