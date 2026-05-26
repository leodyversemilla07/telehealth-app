import {
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
import type { CreateTimeOffDto, SetAvailabilityDto } from "./dto"

@ApiTags("Availability")
@ApiBearerAuth("session-token")
@Controller("providers")
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  // ─── Provider availability management ─────────────────────────────────

  @Put("availability")
  @Roles(["PROVIDER"])
  @ApiOperation({ summary: "Set weekly availability schedule (Doctor)" })
  async setAvailability(
    @Session() session: UserSession,
    @Body() dto: SetAvailabilityDto,
  ) {
    return this.availabilityService.setAvailability(session.user.id, dto)
  }

  @Get("availability")
  @Roles(["PROVIDER"])
  @ApiOperation({ summary: "Get my availability schedule (Doctor)" })
  async getMyAvailability(@Session() session: UserSession) {
    return this.availabilityService.getMyAvailability(session.user.id)
  }

  @Delete("availability/:slotId")
  @Roles(["PROVIDER"])
  @ApiOperation({ summary: "Delete an availability slot" })
  @ApiParam({ name: "slotId", description: "Availability slot ID" })
  async deleteSlot(@Param("slotId") slotId: string) {
    return this.availabilityService.deleteSlot(slotId)
  }

  // ─── Time off ────────────────────────────────────────────────────────

  @Post("time-off")
  @Roles(["PROVIDER"])
  @ApiOperation({ summary: "Create a time-off block (Doctor)" })
  async createTimeOff(
    @Session() session: UserSession,
    @Body() dto: CreateTimeOffDto,
  ) {
    return this.availabilityService.createTimeOff(session.user.id, dto)
  }

  @Get("time-off")
  @Roles(["PROVIDER"])
  @ApiOperation({ summary: "Get my time-off blocks (Doctor)" })
  async getTimeOff(@Session() session: UserSession) {
    return this.availabilityService.getTimeOff(session.user.id)
  }

  @Delete("time-off/:id")
  @Roles(["PROVIDER"])
  @ApiOperation({ summary: "Delete a time-off block" })
  @ApiParam({ name: "id", description: "Time-off ID" })
  async deleteTimeOff(@Param("id") id: string) {
    return this.availabilityService.deleteTimeOff(id)
  }

  // ─── Public: available slots for booking ─────────────────────────────

  @Get(":providerProfileId/slots")
  @AllowAnonymous()
  @ApiOperation({
    summary: "Get available slots for a provider on a date (public)",
  })
  @ApiParam({ name: "providerProfileId", description: "Provider profile ID" })
  @ApiQuery({ name: "date", description: "Date in YYYY-MM-DD format" })
  async getAvailableSlots(
    @Param("providerProfileId") providerProfileId: string,
    @Query("date") date: string,
  ) {
    return this.availabilityService.getAvailableSlots(providerProfileId, date)
  }
}
