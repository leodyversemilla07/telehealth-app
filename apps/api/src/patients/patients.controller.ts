import { Body, Controller, Get, Patch } from "@nestjs/common"
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger"
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { Roles, Session } from "@thallesp/nestjs-better-auth"
import { UpdatePatientProfileDto } from "./dto"
import { PatientsService } from "./patients.service"

@ApiTags("Patients")
@ApiBearerAuth("session-token")
@Controller("patients")
@Roles(["PATIENT"])
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get("me")
  @ApiOperation({ summary: "Get current user's patient profile" })
  @ApiOkResponse({ description: "Patient profile" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  async getMyProfile(@Session() session: UserSession) {
    return this.patientsService.findByUserId(session.user.id)
  }

  @Patch("me")
  @ApiOperation({ summary: "Update current user's patient profile" })
  @ApiOkResponse({ description: "Updated patient profile" })
  @ApiBadRequestResponse({ description: "Invalid input" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  async updateMyProfile(
    @Session() session: UserSession,
    @Body() data: UpdatePatientProfileDto,
  ) {
    return this.patientsService.updateProfile(session.user.id, data)
  }
}
