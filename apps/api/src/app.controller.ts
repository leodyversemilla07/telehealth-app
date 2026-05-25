import { Controller, Get } from "@nestjs/common"
import { ApiOperation, ApiTags } from "@nestjs/swagger"
import { SkipThrottle } from "@nestjs/throttler"
import { AllowAnonymous } from "@thallesp/nestjs-better-auth"
import { AppService } from "@/app.service"

@ApiTags("Health")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @SkipThrottle()
  @AllowAnonymous()
  @ApiOperation({ summary: "Health check with database connectivity" })
  getHealth() {
    return this.appService.getHealth()
  }
}
