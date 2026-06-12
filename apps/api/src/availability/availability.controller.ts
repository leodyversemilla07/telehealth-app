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
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
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
  async setAvailability(
    @Session() session: UserSession,
    @Body() dto: SetAvailabilityDto,
  ) {
    return this.availabilityService.setAvailability(session.user.id, dto)
  }

  @Get("mine")
  @Roles(["DOCTOR"])
  @ApiOperation({ summary: "Get my availability schedule (Doctor)" })
  async getMyAvailability(@Session() session: UserSession) {
    return this.availabilityService.getMyAvailability(session.user.id)
  }

  // ─── Time off ────────────────────────────────────────────────────────

  @Post("time-off")
  @Roles(["DOCTOR"])
  @ApiOperation({ summary: "Add a time-off period (Doctor)" })
  async addTimeOff(
    @Session() session: UserSession,
    @Body() dto: CreateTimeOffDto,
  ) {
    return this.availabilityService.createTimeOff(session.user.id, dto)
  }

  @Get("time-off")
  @Roles(["DOCTOR"])
  @ApiOperation({ summary: "Get my time-off blocks (Doctor)" })
  async getTimeOff(@Session() session: UserSession) {
    return this.availabilityService.getTimeOff(session.user.id)
  }

  @Delete("time-off/:id")
  @Roles(["DOCTOR"])
  @ApiOperation({ summary: "Remove a time-off entry (Doctor)" })
  @ApiParam({ name: "id", description: "Time-off ID" })
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
  async getSchedule(@Param("doctorId") doctorId: string) {
    return this.availabilityService.getSchedule(doctorId)
  }
}
