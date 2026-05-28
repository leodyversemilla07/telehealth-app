import { Body, Controller, Get, Patch } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger"
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { Roles, Session } from "@thallesp/nestjs-better-auth"
import { UpdatePatientProfileDto } from "@/patients/dto"
import { PatientsService } from "@/patients/patients.service"

@ApiTags("Patients")
@ApiBearerAuth("session-token")
@Controller("patients")
@Roles(["PATIENT"])
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get("me")
  @ApiOperation({ summary: "Get current user's patient profile" })
  async getMyProfile(@Session() session: UserSession) {
    return this.patientsService.findByUserId(session.user.id)
  }

  @Patch("me")
  @ApiOperation({ summary: "Update current user's patient profile" })
  async updateMyProfile(
    @Session() session: UserSession,
    @Body() data: UpdatePatientProfileDto,
  ) {
    return this.patientsService.updateProfile(session.user.id, data)
  }
}
