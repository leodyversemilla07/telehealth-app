import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
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
import { AllowAnonymous, Roles, Session } from "@thallesp/nestjs-better-auth"
import { AvailabilityService } from "./availability.service"
import { SetAvailabilityDto } from "./dto/set-availability.dto"
import { CreateTimeOffDto } from "./dto/time-off.dto"

@ApiTags("Availability")
@ApiBearerAuth("session-token")
@Controller("availability")
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  // ─── Doctor availability management ─────────────────────────────────

  @Put()
  @Roles(["DOCTOR"])
  @ApiOperation({ summary: "Set weekly availability schedule (Doctor)" })
  @ApiOkResponse({ description: "Availability updated" })
  @ApiBadRequestResponse({ description: "Invalid input" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async setAvailability(
    @Session() session: UserSession,
    @Body() dto: SetAvailabilityDto,
  ) {
    return this.availabilityService.setAvailability(session.user.id, dto)
  }

  @Get("mine")
  @Roles(["DOCTOR"])
  @ApiOperation({ summary: "Get my availability schedule (Doctor)" })
  @ApiOkResponse({ description: "Doctor availability schedule" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async getMyAvailability(@Session() session: UserSession) {
    return this.availabilityService.getMyAvailability(session.user.id)
  }

  // ─── Time off ────────────────────────────────────────────────────────

  @Post("time-off")
  @Roles(["DOCTOR"])
  @ApiOperation({ summary: "Add a time-off period (Doctor)" })
  @ApiCreatedResponse({ description: "Time-off period added" })
  @ApiBadRequestResponse({ description: "Invalid input" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async addTimeOff(
    @Session() session: UserSession,
    @Body() dto: CreateTimeOffDto,
  ) {
    return this.availabilityService.createTimeOff(session.user.id, dto)
  }

  @Get("time-off")
  @Roles(["DOCTOR"])
  @ApiOperation({ summary: "Get my time-off blocks (Doctor)" })
  @ApiOkResponse({ description: "List of time-off blocks" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async getTimeOff(@Session() session: UserSession) {
    return this.availabilityService.getTimeOff(session.user.id)
  }

  @Delete("time-off/:id")
  @Roles(["DOCTOR"])
  @ApiOperation({ summary: "Remove a time-off entry (Doctor)" })
  @ApiParam({ name: "id", description: "Time-off ID" })
  @ApiOkResponse({ description: "Time-off entry removed" })
  @ApiNotFoundResponse({ description: "Not found" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async deleteTimeOff(
    @Session() session: UserSession,
    @Param("id") id: string,
  ) {
    return this.availabilityService.deleteTimeOff(session.user.id, id)
  }

  // ─── Public: available slots for booking ─────────────────────────────

  @Get(":doctorId/slots")
  @AllowAnonymous()
  @ApiOperation({ summary: "Get available slots for a date (public)" })
  @ApiParam({ name: "doctorId", description: "Doctor profile ID" })
  @ApiQuery({ name: "date", description: "Date in YYYY-MM-DD format" })
  @ApiOkResponse({ description: "Available time slots" })
  @ApiNotFoundResponse({ description: "Not found" })
  async getAvailableSlots(
    @Param("doctorId") doctorId: string,
    @Query("date") date: string,
  ) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException("Invalid date format. Use YYYY-MM-DD.")
    }
    return this.availabilityService.getAvailableSlots(doctorId, date)
  }

  @Get(":doctorId")
  @AllowAnonymous()
  @ApiOperation({ summary: "Get a doctor's weekly schedule (public)" })
  @ApiParam({ name: "doctorId", description: "Doctor profile ID" })
  @ApiOkResponse({ description: "Doctor weekly schedule" })
  @ApiNotFoundResponse({ description: "Not found" })
  async getSchedule(@Param("doctorId") doctorId: string) {
    return this.availabilityService.getSchedule(doctorId)
  }
}
