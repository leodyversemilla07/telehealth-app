import { Body, Controller, Post } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger"
import { Roles } from "@thallesp/nestjs-better-auth"
import { GetRecommendationDto } from "./dto"
import { RecommendationsService } from "./recommendations.service"

@ApiTags("Recommendations")
@ApiBearerAuth("session-token")
@Controller("recommendations")
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Post()
  @Roles(["PATIENT"])
  @ApiOperation({
    summary:
      "Get AI-powered doctor recommendations based on symptoms (patient only)",
  })
  async getRecommendation(@Body() dto: GetRecommendationDto) {
    return this.recommendationsService.getRecommendation(dto.symptoms)
  }

  @Post("symptoms")
  @Roles(["PATIENT"])
  @ApiOperation({
    summary: "AI Symptom Checker - analyze symptoms and get recommendations",
  })
  async checkSymptoms(@Body() dto: GetRecommendationDto) {
    return this.recommendationsService.checkSymptoms(dto.symptoms)
  }
}
