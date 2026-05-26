import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger"
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { AllowAnonymous, Roles, Session } from "@thallesp/nestjs-better-auth"
import type { RegisterDoctorDto } from "@/doctors/dto"
import { SearchDoctorsDto } from "@/doctors/dto"
import { DoctorsService } from "@/doctors/doctors.service"

@ApiTags("Doctors")
@ApiBearerAuth("session-token")
@Controller("doctors")
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  // ─── Registration (authenticated user) ──────────────────────────────

  @Post("register")
  @ApiOperation({
    summary: "Register as a doctor (requires DOCTOR role)",
  })
  async register(
    @Session() session: UserSession,
    @Body() dto: RegisterDoctorDto,
  ) {
    return this.doctorsService.register(session.user.id, dto)
  }

  // ─── Public / Patient-facing ────────────────────────────────────────

  @Get()
  @AllowAnonymous()
  @ApiOperation({ summary: "List all approved doctors with optional search, filter, and sort (public)" })
  async findAllApproved(@Query() query: SearchDoctorsDto) {
    return this.doctorsService.findApproved(query)
  }

  @Get(":id")
  @AllowAnonymous()
  @ApiOperation({ summary: "Get a doctor profile by ID (public)" })
  @ApiParam({ name: "id", description: "Doctor profile ID" })
  async findOne(@Param("id") id: string) {
    return this.doctorsService.findById(id)
  }

  // ─── Admin ──────────────────────────────────────────────────────────

  @Get("admin/all")
  @Roles(["ADMIN"])
  @ApiOperation({ summary: "List all doctors including unapproved (admin)" })
  async findAllAdmin() {
    return this.doctorsService.findAll()
  }

  @Patch(":id/approve")
  @Roles(["ADMIN"])
  @ApiOperation({ summary: "Approve a doctor after PRC verification" })
  @ApiParam({ name: "id", description: "Doctor profile ID" })
  async approve(@Param("id") id: string) {
    return this.doctorsService.approve(id)
  }

  @Patch(":id/reject")
  @Roles(["ADMIN"])
  @ApiOperation({ summary: "Reject / unapprove a doctor" })
  @ApiParam({ name: "id", description: "Doctor profile ID" })
  async reject(@Param("id") id: string) {
    return this.doctorsService.reject(id)
  }
}
