import { Body, Controller, Get, Patch } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger"
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { Session } from "@thallesp/nestjs-better-auth"
import { PatientsService } from "@/patients/patients.service"

@ApiTags("Patients")
@ApiBearerAuth("session-token")
@Controller("patients")
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
    @Body()
    data: {
      dob?: string
      sex?: string
      phone?: string
      address?: string
      philhealthNumber?: string
    },
  ) {
    return this.patientsService.updateProfile(session.user.id, data)
  }
}
