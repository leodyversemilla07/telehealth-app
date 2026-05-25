import { Controller, Get } from "@nestjs/common"
import { SkipThrottle } from "@nestjs/throttler"
import { AllowAnonymous } from "@thallesp/nestjs-better-auth"
import { AppService } from "@/app.service"

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @SkipThrottle()
  @AllowAnonymous()
  getHealth() {
    return this.appService.getHealth()
  }
}
