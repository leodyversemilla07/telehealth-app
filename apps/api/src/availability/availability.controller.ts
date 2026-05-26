import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common"
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger"
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { AllowAnonymous, Roles, Session } from "@thallesp/nestjs-better-auth"
import type { CreateTimeOffDto, SetAvailabilityDto } from "./dto"
import { AvailabilityService } from "./availability.service"

@ApiTags("Availability")
@ApiBearerAuth("session-token")
@Controller("availability")
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Put()
  @Roles(["PROVIDER"])
  @ApiOperation({ summary: "Set weekly availability schedule (Doctor)" })
  async setSchedule(
    @Session() session: UserSession,
    @Body() dto: SetAvailabilityDto,
  ) {
    return this.availabilityService.upsertSchedule(session.user.id, dto)
  }

  @Get(":providerId")
  @AllowAnonymous()
  @ApiOperation({ summary: "Get a provider's weekly schedule (public)" })
  @ApiParam({ name: "providerId", description: "Provider profile ID" })
  async getSchedule(@Param("providerId") providerId: string) {
    return this.availabilityService.getSchedule(providerId)
  }

  @Post("time-off")
  @Roles(["PROVIDER"])
  @ApiOperation({ summary: "Add a time-off period (Doctor)" })
  async addTimeOff(
    @Session() session: UserSession,
    @Body() dto: CreateTimeOffDto,
  ) {
    return this.availabilityService.addTimeOff(session.user.id, dto)
  }

  @Delete("time-off/:id")
  @Roles(["PROVIDER"])
  @ApiOperation({ summary: "Remove a time-off entry (Doctor)" })
  @ApiParam({ name: "id", description: "Time-off ID" })
  async removeTimeOff(
    @Session() session: UserSession,
    @Param("id") id: string,
  ) {
    return this.availabilityService.removeTimeOff(session.user.id, id)
  }

  @Get(":providerId/slots")
  @AllowAnonymous()
  @ApiOperation({ summary: "Get available slots for a date (public)" })
  @ApiParam({ name: "providerId", description: "Provider profile ID" })
  @ApiQuery({ name: "date", description: "Date in YYYY-MM-DD format" })
  async getAvailableSlots(
    @Param("providerId") providerId: string,
    @Query("date") date: string,
  ) {
    return this.availabilityService.getAvailableSlots(providerId, date)
  }
}
