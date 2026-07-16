/// <reference types="multer" />
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger"
import { Throttle } from "@nestjs/throttler"
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { AllowAnonymous, Session } from "@thallesp/nestjs-better-auth"
import type { PublicUserDto } from "@workspace/shared/types/user"
import { StorageService } from "../storage/storage.service"
import { UpdateProfileDto } from "./dto/update-profile.dto"
import { UsersService } from "./users.service"

@ApiTags("Users")
@ApiBearerAuth("session-token")
@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly storage: StorageService,
  ) {}

  // ─── Current user ─────────────────────────────────────────────────────────

  @Get("me")
  @ApiOperation({ summary: "Get current user profile and session" })
  @ApiOkResponse({ description: "User profile and session" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  async getProfile(
    @Session() session: UserSession,
  ): Promise<{ user: PublicUserDto; session: object }> {
    return session as { user: PublicUserDto; session: object }
  }

  @Patch("me")
  @ApiOperation({ summary: "Update current user's name / image" })
  @ApiOkResponse({ description: "Updated user profile" })
  @ApiBadRequestResponse({ description: "Invalid input" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  async updateMyProfile(
    @Session() session: UserSession,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(
      session.user.id,
      session.user.id,
      session.user.role as "PATIENT" | "DOCTOR" | "ADMIN",
      dto,
    )
  }

  @Post("me/avatar")
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: "Upload avatar image" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: { file: { type: "string", format: "binary" } },
    },
  })
  @ApiOkResponse({ description: "Avatar uploaded successfully" })
  @ApiBadRequestResponse({ description: "No file or invalid file type" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  async uploadAvatar(
    @Session() session: UserSession,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException("No file provided")
    }

    if (!this.storage.validateMimeType(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Only ${this.storage.allowedMimeTypes.join(", ")} are allowed.`,
      )
    }

    if (!this.storage.validateSize(file.size)) {
      throw new BadRequestException(
        `File is too large. Max allowed size is ${this.storage.maxFileSize / 1024 / 1024}MB.`,
      )
    }

    const avatarUrl = await this.storage.uploadFile(
      session.user.id,
      file.buffer,
      file.originalname,
      file.mimetype,
    )

    return this.usersService.updateProfile(
      session.user.id,
      session.user.id,
      session.user.role as "PATIENT" | "DOCTOR" | "ADMIN",
      { image: avatarUrl },
    )
  }

  @Get("me/sessions")
  @ApiOperation({ summary: "List all active sessions for current user" })
  @ApiOkResponse({ description: "List of active sessions" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  async getMySessions(@Session() session: UserSession) {
    return this.usersService.getActiveSessions(
      session.user.id,
      (session.session as { id: string }).id,
    )
  }

  @Delete("me/sessions/:id")
  @ApiOperation({ summary: "Revoke a specific session" })
  @ApiParam({ name: "id", description: "Session ID to revoke" })
  @ApiOkResponse({ description: "Session revoked" })
  @ApiNotFoundResponse({ description: "Session not found" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  async revokeMySession(
    @Session() session: UserSession,
    @Param("id") id: string,
  ) {
    return this.usersService.revokeSession(session.user.id, id)
  }

  @Delete("me/sessions")
  @ApiOperation({ summary: "Revoke all other sessions" })
  @ApiOkResponse({ description: "Other sessions revoked" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  async revokeMyOtherSessions(@Session() session: UserSession) {
    return this.usersService.revokeOtherSessions(
      session.user.id,
      (session.session as { id: string }).id,
    )
  }

  // ─── Public ───────────────────────────────────────────────────────────────

  @Get("public")
  @AllowAnonymous()
  @ApiOperation({ summary: "Public health-check endpoint (no auth)" })
  @ApiOkResponse({ description: "Public endpoint response" })
  async publicRoute(): Promise<{ message: string }> {
    return { message: "Public endpoint" }
  }
}
