import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common"
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger"
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { Roles, Session } from "@thallesp/nestjs-better-auth"
import type {
  CreateAppointmentDto,
  RescheduleAppointmentDto,
  UpdateAppointmentStatusDto,
} from "./dto"
import { AppointmentsService } from "./appointments.service"

@ApiTags("Appointments")
@ApiBearerAuth("session-token")
@Controller("appointments")
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(["PATIENT"])
  @ApiOperation({ summary: "Book a new appointment (Patient)" })
  async create(
    @Session() session: UserSession,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(session.user.id, dto)
  }

  @Get()
  @ApiOperation({ summary: "List my appointments (Patient or Doctor)" })
  async findMine(@Session() session: UserSession) {
    return this.appointmentsService.findMyAppointments(
      session.user.id,
      session.user.role as string,
    )
  }

  @Get(":id")
  @ApiOperation({ summary: "Get appointment detail" })
  @ApiParam({ name: "id", description: "Appointment ID" })
  async findOne(
    @Session() session: UserSession,
    @Param("id") id: string,
  ) {
    return this.appointmentsService.findOne(
      id,
      session.user.id,
      session.user.role as string,
    )
  }

  @Patch(":id/status")
  @Roles(["PROVIDER", "ADMIN"])
  @ApiOperation({ summary: "Update appointment status (Doctor/Admin)" })
  @ApiParam({ name: "id", description: "Appointment ID" })
  async updateStatus(
    @Session() session: UserSession,
    @Param("id") id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentsService.updateStatus(
      id,
      dto.status,
      session.user.id,
      session.user.role as string,
    )
  }

  @Patch(":id/cancel")
  @ApiOperation({ summary: "Cancel an appointment (Patient or Doctor)" })
  @ApiParam({ name: "id", description: "Appointment ID" })
  async cancel(@Session() session: UserSession, @Param("id") id: string) {
    return this.appointmentsService.cancel(
      id,
      session.user.id,
      session.user.role as string,
    )
  }

  @Patch(":id/reschedule")
  @Roles(["PATIENT"])
  @ApiOperation({ summary: "Reschedule an appointment (Patient)" })
  @ApiParam({ name: "id", description: "Appointment ID" })
  async reschedule(
    @Session() session: UserSession,
    @Param("id") id: string,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.appointmentsService.reschedule(id, dto, session.user.id)
  }
}
