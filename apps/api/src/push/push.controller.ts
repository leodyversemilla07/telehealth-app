import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from "@nestjs/common"
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
import { Type } from "class-transformer"
import {
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from "class-validator"
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
  @ValidateNested()
  @Type(() => PushKeysDto)
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
  @ApiOkResponse({ description: "VAPID public key" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  getVapidPublicKey() {
    return { publicKey: this.pushService.getVapidPublicKey() }
  }

  @Post("subscribe")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Register a browser push subscription" })
  @ApiCreatedResponse({ description: "Push subscription registered" })
  @ApiBadRequestResponse({ description: "Invalid input" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async subscribe(@Session() session: UserSession, @Body() dto: SubscribeDto) {
    return this.pushService.subscribe(session.user.id, dto)
  }

  @Delete("subscribe")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Remove a browser push subscription" })
  @ApiOkResponse({ description: "Push subscription removed" })
  @ApiBadRequestResponse({ description: "Invalid input" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async unsubscribe(
    @Session() session: UserSession,
    @Body() dto: UnsubscribeDto,
  ) {
    return this.pushService.unsubscribe(session.user.id, dto.endpoint)
  }
}
