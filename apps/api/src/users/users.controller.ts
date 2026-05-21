import { Controller, Get } from "@nestjs/common"
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { AllowAnonymous, Session } from "@thallesp/nestjs-better-auth"

@Controller("users")
export class UsersController {
  @Get("me")
  async getProfile(@Session() session: UserSession) {
    return session
  }

  @Get("public")
  @AllowAnonymous()
  async publicRoute() {
    return { message: "Public endpoint" }
  }
}
