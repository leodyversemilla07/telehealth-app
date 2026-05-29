import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger"
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { Roles, Session } from "@thallesp/nestjs-better-auth"
import { IsObject, IsOptional, IsString, IsUrl } from "class-validator"
import { PushService } from "./push.service"

class PushKeysDto {
  @IsString()
  p256dh!: string

  @IsString()
  auth!: string
}

class SubscribeDto {
  @IsUrl({ require_tld: false })
  endpoint!: string

  @IsObject()
  keys!: PushKeysDto

  @IsString()
  @IsOptional()
  userAgent?: string
}

class UnsubscribeDto {
  @IsUrl({ require_tld: false })
  endpoint!: string
}

@ApiTags("Push Notifications")
@ApiBearerAuth("session-token")
@Controller("push")
@Roles(["PATIENT", "DOCTOR", "ADMIN"])
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Get("vapid-public-key")
  @ApiOperation({ summary: "Get the VAPID public key for Web Push" })
  getVapidPublicKey() {
    return { publicKey: this.pushService.getVapidPublicKey() }
  }

  @Post("subscribe")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Register a browser push subscription" })
  async subscribe(@Session() session: UserSession, @Body() dto: SubscribeDto) {
    return this.pushService.subscribe(session.user.id, dto)
  }

  @Delete("subscribe")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Remove a browser push subscription" })
  async unsubscribe(
    @Session() session: UserSession,
    @Body() dto: UnsubscribeDto,
  ) {
    return this.pushService.unsubscribe(session.user.id, dto.endpoint)
  }
}
