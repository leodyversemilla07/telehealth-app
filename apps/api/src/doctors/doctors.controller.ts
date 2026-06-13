import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common"
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger"
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { AllowAnonymous, Roles, Session } from "@thallesp/nestjs-better-auth"
import { DoctorsService } from "./doctors.service"
import {
  RegisterDoctorDto,
  SearchDoctorsDto,
  UpdateDoctorProfileDto,
} from "./dto"

@ApiTags("Doctors")
@ApiBearerAuth("session-token")
@Controller("doctors")
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  // ─── Registration (authenticated user) ──────────────────────────────

  @Post("register")
  @Roles(["PATIENT", "DOCTOR"])
  @ApiOperation({
    summary: "Submit a doctor profile for admin approval",
  })
  @ApiCreatedResponse({ description: "Doctor profile submitted" })
  @ApiBadRequestResponse({ description: "Invalid input" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async register(
    @Session() session: UserSession,
    @Body() dto: RegisterDoctorDto,
  ) {
    return this.doctorsService.register(session.user.id, dto)
  }

  // ─── Doctor's own profile ───────────────────────────────────────────

  @Get("profile")
  @Roles(["DOCTOR"])
  @ApiOperation({ summary: "Get current doctor's own profile" })
  @ApiOkResponse({ description: "Doctor profile" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async getMyProfile(@Session() session: UserSession) {
    return this.doctorsService.findByUserId(session.user.id)
  }

  @Patch("profile")
  @Roles(["DOCTOR"])
  @ApiOperation({ summary: "Update current doctor's own profile" })
  @ApiOkResponse({ description: "Doctor profile updated" })
  @ApiBadRequestResponse({ description: "Invalid input" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async updateMyProfile(
    @Session() session: UserSession,
    @Body() dto: UpdateDoctorProfileDto,
  ) {
    return this.doctorsService.updateProfile(session.user.id, dto)
  }

  // ─── Public / Patient-facing ────────────────────────────────────────

  @Get()
  @AllowAnonymous()
  @ApiOperation({
    summary:
      "List all approved doctors with optional search, filter, and sort (public)",
  })
  @ApiOkResponse({ description: "List of approved doctors" })
  async findAllApproved(@Query() query: SearchDoctorsDto) {
    return this.doctorsService.findApproved(query)
  }

  @Get("by-id/:id")
  @AllowAnonymous()
  @ApiOperation({ summary: "Get a doctor profile by ID (public)" })
  @ApiParam({ name: "id", description: "Doctor profile ID" })
  @ApiOkResponse({ description: "Doctor profile" })
  @ApiNotFoundResponse({ description: "Not found" })
  async findOne(@Param("id") id: string) {
    return this.doctorsService.findById(id)
  }
}
