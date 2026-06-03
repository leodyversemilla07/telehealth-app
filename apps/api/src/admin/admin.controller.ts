import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common"
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger"
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { Roles, Session } from "@thallesp/nestjs-better-auth"
import { PaginationDto } from "../common/dto/pagination.dto"
import { AdminService } from "./admin.service"
import { BanUserDto } from "./dto/ban-user.dto"
import { SetRoleDto } from "./dto/set-role.dto"
import { UpdateProfileDto } from "./dto/update-profile.dto"

@ApiTags("Admin")
@ApiBearerAuth("session-token")
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── Dashboard ──────────────────────────────────────────────────────────

  @Get("dashboard")
  @Roles(["ADMIN"])
  @ApiOperation({ summary: "Get admin dashboard statistics" })
  async getDashboard() {
    return this.adminService.getDashboardStats()
  }

  // ─── Reports ──────────────────────────────────────────────────────────

  @Get("reports")
  @Roles(["ADMIN"])
  @ApiOperation({ summary: "Get aggregated reports data" })
  async getReports() {
    return this.adminService.getReports()
  }

  // ─── User management ───────────────────────────────────────────────────

  @Get("users")
  @Roles(["ADMIN"])
  @ApiOperation({ summary: "List all users (admin)" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  async listUsers(@Query() query: PaginationDto) {
    return this.adminService.listUsers(query.limit, query.offset)
  }

  @Get("users/:id")
  @Roles(["ADMIN"])
  @ApiOperation({ summary: "Get user by ID (admin)" })
  @ApiParam({ name: "id", description: "Target user ID" })
  async getUser(@Param("id") id: string) {
    return this.adminService.getUser(id)
  }

  @Patch("users/:id")
  @Roles(["ADMIN"])
  @ApiOperation({ summary: "Update a user's profile (admin)" })
  @ApiParam({ name: "id", description: "Target user ID" })
  async updateUser(
    @Session() session: UserSession,
    @Param("id") id: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.adminService.updateUser(
      id,
      session.user.id,
      session.user.role as "PATIENT" | "DOCTOR" | "ADMIN",
      dto,
    )
  }

  @Post("users/:id/ban")
  @Roles(["ADMIN"])
  @ApiOperation({ summary: "Ban a user (admin)" })
  @ApiParam({ name: "id", description: "Target user ID" })
  async banUser(
    @Session() session: UserSession,
    @Param("id") id: string,
    @Body() dto: BanUserDto,
  ) {
    return this.adminService.banUser(session.user.id, id, {
      reason: dto.reason,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    })
  }

  @Delete("users/:id/ban")
  @Roles(["ADMIN"])
  @ApiOperation({ summary: "Unban a user (admin)" })
  @ApiParam({ name: "id", description: "Target user ID" })
  async unbanUser(@Session() session: UserSession, @Param("id") id: string) {
    return this.adminService.unbanUser(session.user.id, id)
  }

  @Patch("users/:id/role")
  @Roles(["ADMIN"])
  @ApiOperation({ summary: "Set user role (admin)" })
  @ApiParam({ name: "id", description: "Target user ID" })
  async setRole(
    @Session() session: UserSession,
    @Param("id") id: string,
    @Body() dto: SetRoleDto,
  ) {
    return this.adminService.setRole(session.user.id, id, dto.role)
  }

  // ─── Doctor management ─────────────────────────────────────────────────

  @Get("doctors")
  @Roles(["ADMIN"])
  @ApiOperation({ summary: "List all doctors including unapproved (admin)" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  async listAllDoctors(@Query() query: PaginationDto) {
    return this.adminService.listAllDoctors(query.limit, query.offset)
  }

  @Patch("doctors/:id/approve")
  @Roles(["ADMIN"])
  @ApiOperation({ summary: "Approve a doctor after PRC verification" })
  @ApiParam({ name: "id", description: "Doctor profile ID" })
  async approveDoctor(
    @Session() session: UserSession,
    @Param("id") id: string,
  ) {
    return this.adminService.approveDoctor(id, session.user.id)
  }

  @Patch("doctors/:id/reject")
  @Roles(["ADMIN"])
  @ApiOperation({ summary: "Reject / unapprove a doctor" })
  @ApiParam({ name: "id", description: "Doctor profile ID" })
  async rejectDoctor(@Session() session: UserSession, @Param("id") id: string) {
    return this.adminService.rejectDoctor(id, session.user.id)
  }
}
