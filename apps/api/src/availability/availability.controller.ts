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
import { AllowAnonymous, Session } from "@thallesp/nestjs-better-auth"
import { AvailabilityService } from "@/availability/availability.service"
import type { CreateTimeOffDto, SetAvailabilityDto } from "@/availability/dto"
import { PrismaService } from "@/prisma/prisma.service"

@ApiTags("Availability")
@Controller()
export class AvailabilityController {
  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly prisma: PrismaService,
  ) {}

  private async getProviderProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!profile) throw new Error("Provider profile not found")
    return profile.id
  }

  // ─── Provider availability management ─────────────────────────────────

  @Put("providers/availability")
  @ApiBearerAuth("session-token")
  @ApiOperation({ summary: "Set weekly availability schedule (provider)" })
  async setAvailability(
    @Session() session: UserSession,
    @Body() dto: SetAvailabilityDto,
  ) {
    const profileId = await this.getProviderProfileId(session.user.id)
    return this.availabilityService.setAvailability(profileId, dto)
  }

  @Get("providers/availability")
  @ApiBearerAuth("session-token")
  @ApiOperation({ summary: "Get my availability schedule (provider)" })
  async getMyAvailability(@Session() session: UserSession) {
    const profileId = await this.getProviderProfileId(session.user.id)
    return this.availabilityService.getAvailability(profileId)
  }

  @Delete("providers/availability/:slotId")
  @ApiBearerAuth("session-token")
  @ApiOperation({ summary: "Delete an availability slot" })
  async deleteSlot(@Param("slotId") slotId: string) {
    return this.availabilityService.deleteSlot(slotId)
  }

  // ─── Time off ────────────────────────────────────────────────────────

  @Post("providers/time-off")
  @ApiBearerAuth("session-token")
  @ApiOperation({ summary: "Create a time-off block (provider)" })
  async createTimeOff(
    @Session() session: UserSession,
    @Body() dto: CreateTimeOffDto,
  ) {
    const profileId = await this.getProviderProfileId(session.user.id)
    return this.availabilityService.createTimeOff(profileId, dto)
  }

  @Get("providers/time-off")
  @ApiBearerAuth("session-token")
  @ApiOperation({ summary: "Get time-off blocks (provider)" })
  async getTimeOff(@Session() session: UserSession) {
    const profileId = await this.getProviderProfileId(session.user.id)
    return this.availabilityService.getTimeOff(profileId)
  }

  @Delete("providers/time-off/:id")
  @ApiBearerAuth("session-token")
  @ApiOperation({ summary: "Delete a time-off block" })
  async deleteTimeOff(@Param("id") id: string) {
    return this.availabilityService.deleteTimeOff(id)
  }

  // ─── Public: available slots for booking ─────────────────────────────

  @Get("providers/:providerProfileId/slots")
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
