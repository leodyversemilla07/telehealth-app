import { Body, Controller, Post } from "@nestjs/common"
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger"
import { Throttle } from "@nestjs/throttler"
import { Roles } from "@thallesp/nestjs-better-auth"
import { GetRecommendationDto } from "./dto"
import { RecommendationsService } from "./recommendations.service"

// Stricter rate limit for AI endpoints (costly per-call)
const AI_THROTTLE = { default: { ttl: 60_000, limit: 10 } }

@ApiTags("Recommendations")
@ApiBearerAuth("session-token")
@Controller("recommendations")
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Post()
  @Throttle(AI_THROTTLE)
  @Roles(["PATIENT"])
  @ApiOperation({
    summary:
      "Get AI-powered doctor recommendations based on symptoms (patient only)",
  })
  @ApiOkResponse({ description: "Doctor recommendations" })
  @ApiBadRequestResponse({ description: "Invalid input" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async getRecommendation(@Body() dto: GetRecommendationDto) {
    return this.recommendationsService.getRecommendation(dto.symptoms)
  }

  @Post("symptoms")
  @Throttle(AI_THROTTLE)
  @Roles(["PATIENT"])
  @ApiOperation({
    summary: "AI Symptom Checker - analyze symptoms and get recommendations",
  })
  @ApiOkResponse({ description: "Symptom analysis results" })
  @ApiBadRequestResponse({ description: "Invalid input" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async checkSymptoms(@Body() dto: GetRecommendationDto) {
    return this.recommendationsService.checkSymptoms(dto.symptoms)
  }
}
