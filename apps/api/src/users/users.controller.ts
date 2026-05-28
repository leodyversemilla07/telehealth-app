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
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger"
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { AllowAnonymous, Session } from "@thallesp/nestjs-better-auth"
import type { PublicUserDto } from "@workspace/shared/types/user"
import { StorageService } from "@/storage/storage.service"
import type { UpdateProfileDto } from "@/users/dto/index.js"
import { UsersService } from "@/users/users.service"

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
  async getProfile(
    @Session() session: UserSession,
  ): Promise<{ user: PublicUserDto; session: object }> {
    return session as { user: PublicUserDto; session: object }
  }

  @Patch("me")
  @ApiOperation({ summary: "Update current user's name / image" })
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
  async uploadAvatar(
    @Session() session: UserSession,
    // biome-ignore lint/suspicious/noExplicitAny: Multer file structure is dynamically parsed in Express middleware
    @UploadedFile() file: any,
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
  async getMySessions(@Session() session: UserSession) {
    return this.usersService.getActiveSessions(
      session.user.id,
      (session.session as { id: string }).id,
    )
  }

  @Delete("me/sessions/:id")
  @ApiOperation({ summary: "Revoke a specific session" })
  @ApiParam({ name: "id", description: "Session ID to revoke" })
  async revokeMySession(
    @Session() session: UserSession,
    @Param("id") id: string,
  ) {
    return this.usersService.revokeSession(session.user.id, id)
  }

  @Delete("me/sessions")
  @ApiOperation({ summary: "Revoke all other sessions" })
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
  async publicRoute(): Promise<{ message: string }> {
    return { message: "Public endpoint" }
  }
}
