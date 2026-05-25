import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger"
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { AllowAnonymous, Roles, Session } from "@thallesp/nestjs-better-auth"
import type { RegisterProviderDto } from "@/providers/dto"
import { ProvidersService } from "@/providers/providers.service"

@ApiTags("Providers")
@ApiBearerAuth("session-token")
@Controller("providers")
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  // ─── Registration (authenticated user) ──────────────────────────────

  @Post("register")
  @ApiOperation({
    summary: "Register as a provider (requires PROVIDER role)",
  })
  async register(
    @Session() session: UserSession,
    @Body() dto: RegisterProviderDto,
  ) {
    return this.providersService.register(session.user.id, dto)
  }

  // ─── Public / Patient-facing ────────────────────────────────────────

  @Get()
  @AllowAnonymous()
  @ApiOperation({ summary: "List all approved providers (public)" })
  async findAllApproved() {
    return this.providersService.findApproved()
  }

  @Get(":id")
  @AllowAnonymous()
  @ApiOperation({ summary: "Get a provider profile by ID (public)" })
  @ApiParam({ name: "id", description: "Provider profile ID" })
  async findOne(@Param("id") id: string) {
    return this.providersService.findById(id)
  }

  // ─── Admin ──────────────────────────────────────────────────────────

  @Get("admin/all")
  @Roles(["ADMIN"])
  @ApiOperation({ summary: "List all providers including unapproved (admin)" })
  async findAllAdmin() {
    return this.providersService.findAll()
  }

  @Patch(":id/approve")
  @Roles(["ADMIN"])
  @ApiOperation({ summary: "Approve a provider after PRC verification" })
  @ApiParam({ name: "id", description: "Provider profile ID" })
  async approve(@Param("id") id: string) {
    return this.providersService.approve(id)
  }

  @Patch(":id/reject")
  @Roles(["ADMIN"])
  @ApiOperation({ summary: "Reject / unapprove a provider" })
  @ApiParam({ name: "id", description: "Provider profile ID" })
  async reject(@Param("id") id: string) {
    return this.providersService.reject(id)
  }
}
