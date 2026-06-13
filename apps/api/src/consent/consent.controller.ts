import { Body, Controller, Get, Post } from "@nestjs/common"
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger"
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { Roles, Session } from "@thallesp/nestjs-better-auth"
import { ConsentService } from "./consent.service"
import { RecordConsentDto } from "./dto"

@ApiTags("Consent")
@ApiBearerAuth("session-token")
@Controller("consent")
@Roles(["PATIENT", "DOCTOR", "ADMIN"])
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Post()
  @ApiOperation({
    summary: "Record a consent action (privacy policy, data sharing, etc.)",
  })
  @ApiCreatedResponse({ description: "Consent recorded" })
  @ApiBadRequestResponse({ description: "Invalid input" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async recordConsent(
    @Session() session: UserSession,
    @Body() body: RecordConsentDto,
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
  @ApiOkResponse({ description: "Consent history" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async getMyConsents(@Session() session: UserSession) {
    return this.consentService.getUserConsents(session.user.id)
  }
}
