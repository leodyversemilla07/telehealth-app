import { writeFile } from "node:fs/promises"
import { extname, join } from "node:path"
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
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { AllowAnonymous, Roles, Session } from "@thallesp/nestjs-better-auth"
import type { PublicUserDto } from "@workspace/shared/types/user"
import type { BanUserDto } from "@/users/dto/ban-user.dto"
import type { SetRoleDto } from "@/users/dto/set-role.dto"
import type { UpdateProfileDto } from "@/users/dto/update-profile.dto"
import { UsersService } from "@/users/users.service"

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── Current user ─────────────────────────────────────────────────────────

  /** GET /users/me — returns the current authenticated session */
  @Get("me")
  async getProfile(
    @Session() session: UserSession,
  ): Promise<{ user: PublicUserDto; session: object }> {
    return session as { user: PublicUserDto; session: object }
  }

  /** PATCH /users/me — update current user's name / image */
  @Patch("me")
  async updateMyProfile(
    @Session() session: UserSession,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(
      session.user.id,
      session.user.id,
      session.user.role as "USER" | "ADMIN",
      dto,
    )
  }

  /** POST /users/me/avatar — upload avatar image */
  @Post("me/avatar")
  @UseInterceptors(FileInterceptor("file"))
  async uploadAvatar(
    @Session() session: UserSession,
    // biome-ignore lint/suspicious/noExplicitAny: Multer file structure is dynamically parsed in Express middleware
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException("No file provided")
    }

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        "Invalid file type. Only JPEG, PNG, and WEBP are allowed.",
      )
    }

    const maxBytes = 2 * 1024 * 1024 // 2MB
    if (file.size > maxBytes) {
      throw new BadRequestException(
        "File is too large. Max allowed size is 2MB.",
      )
    }

    const extension = extname(file.originalname) || ".jpg"
    const filename = `avatar-${session.user.id}-${Date.now()}${extension}`
    const filePath = join(process.cwd(), "uploads", filename)

    await writeFile(filePath, file.buffer)

    const apiBaseUrl = (
      process.env.BETTER_AUTH_URL ||
      `http://localhost:${process.env.PORT ?? 3000}`
    ).replace(/\/$/, "")
    const avatarUrl = `${apiBaseUrl}/uploads/${filename}`

    return this.usersService.updateProfile(
      session.user.id,
      session.user.id,
      session.user.role as "USER" | "ADMIN",
      { image: avatarUrl },
    )
  }

  /** GET /users/me/sessions — lists all active sessions for the current user */
  @Get("me/sessions")
  async getMySessions(@Session() session: UserSession) {
    return this.usersService.getActiveSessions(
      session.user.id,
      (session.session as { id: string }).id,
    )
  }

  /** DELETE /users/me/sessions/:id — revokes a specific active session */
  @Delete("me/sessions/:id")
  async revokeMySession(
    @Session() session: UserSession,
    @Param("id") id: string,
  ) {
    return this.usersService.revokeSession(session.user.id, id)
  }

  /** DELETE /users/me/sessions — revokes all other sessions for the user */
  @Delete("me/sessions")
  async revokeMyOtherSessions(@Session() session: UserSession) {
    return this.usersService.revokeOtherSessions(
      session.user.id,
      (session.session as { id: string }).id,
    )
  }

  // ─── Public ───────────────────────────────────────────────────────────────

  /** GET /users/public — unauthenticated health-check endpoint */
  @Get("public")
  @AllowAnonymous()
  async publicRoute(): Promise<{ message: string }> {
    return { message: "Public endpoint" }
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  /** GET /users — list all users (ADMIN only) */
  @Get()
  @Roles(["ADMIN"])
  async findAll() {
    return this.usersService.findAll()
  }

  /** GET /users/:id — get any user by ID (ADMIN only) */
  @Get(":id")
  @Roles(["ADMIN"])
  async findOne(@Param("id") id: string) {
    return this.usersService.findById(id)
  }

  /** PATCH /users/:id — update another user's profile (ADMIN only) */
  @Patch(":id")
  @Roles(["ADMIN"])
  async updateProfile(
    @Session() session: UserSession,
    @Param("id") id: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(
      id,
      session.user.id,
      session.user.role as "USER" | "ADMIN",
      dto,
    )
  }

  /** POST /users/:id/ban — ban a user (ADMIN only) */
  @Post(":id/ban")
  @Roles(["ADMIN"])
  async banUser(
    @Session() session: UserSession,
    @Param("id") id: string,
    @Body() dto: BanUserDto,
  ) {
    return this.usersService.banUser(session.user.id, id, {
      reason: dto.reason,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    })
  }

  /** Delete /users/:id/ban — unban a user (ADMIN only) */
  @Delete(":id/ban")
  @Roles(["ADMIN"])
  async unbanUser(@Session() session: UserSession, @Param("id") id: string) {
    return this.usersService.unbanUser(session.user.id, id)
  }

  /** Patch /users/:id/role — set role (ADMIN only) */
  @Patch(":id/role")
  @Roles(["ADMIN"])
  async setRole(
    @Session() session: UserSession,
    @Param("id") id: string,
    @Body() dto: SetRoleDto,
  ) {
    return this.usersService.setRole(session.user.id, id, dto.role)
  }
}
