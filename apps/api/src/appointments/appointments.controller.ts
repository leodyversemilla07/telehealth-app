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
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger"
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { Roles, Session } from "@thallesp/nestjs-better-auth"
import { PaginationDto } from "../common/dto/pagination.dto"
import { AppointmentsService } from "./appointments.service"
import { CreateAppointmentDto } from "./dto/create-appointment.dto"
import { RescheduleAppointmentDto } from "./dto/reschedule-appointment.dto"
import { UpdateAppointmentStatusDto } from "./dto/update-appointment-status.dto"

@ApiTags("Appointments")
@ApiBearerAuth("session-token")
@Controller("appointments")
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(["PATIENT"])
  @ApiOperation({ summary: "Book a new appointment (Patient)" })
  @ApiCreatedResponse({ description: "Appointment created successfully" })
  @ApiBadRequestResponse({ description: "Invalid input" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async create(
    @Session() session: UserSession,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(session.user.id, dto)
  }

  @Get()
  @ApiOperation({ summary: "List my appointments (Patient or Doctor)" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  @ApiOkResponse({ description: "List of appointments" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  async findMine(
    @Session() session: UserSession,
    @Query() query: PaginationDto,
  ) {
    return this.appointmentsService.findMyAppointments(
      session.user.id,
      session.user.role as string,
      query.limit,
      query.offset,
    )
  }

  @Get(":id")
  @ApiOperation({ summary: "Get appointment detail" })
  @ApiParam({ name: "id", description: "Appointment ID" })
  @ApiOkResponse({ description: "Appointment details" })
  @ApiNotFoundResponse({ description: "Not found" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  async findOne(@Session() session: UserSession, @Param("id") id: string) {
    return this.appointmentsService.findOne(
      id,
      session.user.id,
      session.user.role as string,
    )
  }

  @Patch(":id/status")
  @Roles(["DOCTOR", "ADMIN"])
  @ApiOperation({ summary: "Update appointment status (Doctor/Admin)" })
  @ApiParam({ name: "id", description: "Appointment ID" })
  @ApiOkResponse({ description: "Appointment status updated" })
  @ApiBadRequestResponse({ description: "Invalid input" })
  @ApiNotFoundResponse({ description: "Not found" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
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
  @Roles(["PATIENT", "DOCTOR", "ADMIN"])
  @ApiOperation({ summary: "Cancel an appointment (Patient or Doctor)" })
  @ApiParam({ name: "id", description: "Appointment ID" })
  @ApiOkResponse({ description: "Appointment cancelled" })
  @ApiNotFoundResponse({ description: "Not found" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
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
  @ApiOkResponse({ description: "Appointment rescheduled" })
  @ApiBadRequestResponse({ description: "Invalid input" })
  @ApiNotFoundResponse({ description: "Not found" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async reschedule(
    @Session() session: UserSession,
    @Param("id") id: string,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.appointmentsService.reschedule(id, dto, session.user.id)
  }

  @Post("reminders")
  @Roles(["ADMIN"])
  @ApiOperation({ summary: "Send reminders for upcoming appointments (Admin)" })
  @ApiOkResponse({ description: "Reminders sent" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async sendReminders() {
    return this.appointmentsService.sendUpcomingReminders()
  }
}
