import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger"
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { Roles, Session } from "@thallesp/nestjs-better-auth"
import { AppointmentsService } from "@/appointments/appointments.service"
import type {
  CreateAppointmentDto,
  RescheduleAppointmentDto,
  UpdateAppointmentStatusDto,
} from "@/appointments/dto"
import { PrismaService } from "@/prisma/prisma.service"

@ApiTags("Appointments")
@Controller("appointments")
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @Roles(["PATIENT"])
  @ApiBearerAuth("session-token")
  @ApiOperation({ summary: "Book a new appointment (patient)" })
  async create(
    @Session() session: UserSession,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(session.user.id, dto)
  }

  @Get("my")
  @ApiBearerAuth("session-token")
  @ApiOperation({ summary: "Get my appointments (patient/provider)" })
  async getMyAppointments(@Session() session: UserSession) {
    const user = session.user as { id: string; role: string }
    if (user.role === "PROVIDER") {
      const profile = await this.prisma.providerProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })
      if (!profile) throw new Error("Provider profile not found")
      return this.appointmentsService.getProviderAppointments(profile.id)
    }
    return this.appointmentsService.getPatientAppointments(user.id)
  }

  @Get(":id")
  @ApiBearerAuth("session-token")
  @ApiOperation({ summary: "Get appointment by ID" })
  async findById(@Param("id") id: string) {
    return this.appointmentsService.findById(id)
  }

  @Patch(":id/status")
  @ApiBearerAuth("session-token")
  @ApiOperation({
    summary: "Update appointment status (patient cancels, provider progresses)",
  })
  async updateStatus(
    @Session() session: UserSession,
    @Param("id") id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentsService.updateStatus(id, session.user.id, dto)
  }

  @Patch(":id/reschedule")
  @Roles(["PATIENT"])
  @ApiBearerAuth("session-token")
  @ApiOperation({ summary: "Reschedule an appointment (patient)" })
  async reschedule(
    @Session() session: UserSession,
    @Param("id") id: string,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.appointmentsService.reschedule(id, session.user.id, dto)
  }
}
