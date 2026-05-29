import { Body, Controller, Get, Param, Post } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger"
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { Roles, Session } from "@thallesp/nestjs-better-auth"
import { ReviewsService } from "./reviews.service"
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator"

class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number

  @IsOptional()
  @IsString()
  comment?: string
}

@ApiTags("Reviews")
@ApiBearerAuth("session-token")
@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post(":appointmentId")
  @Roles(["PATIENT"])
  @ApiOperation({ summary: "Leave a review for a completed appointment" })
  @ApiParam({ name: "appointmentId", description: "Appointment ID" })
  async createReview(
    @Session() session: UserSession,
    @Param("appointmentId") appointmentId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(
      session.user.id,
      appointmentId,
      dto.rating,
      dto.comment,
    )
  }

  @Get("doctor/:doctorId")
  @ApiOperation({ summary: "Get reviews for a doctor (public)" })
  @ApiParam({ name: "doctorId", description: "Doctor profile ID" })
  async getDoctorReviews(@Param("doctorId") doctorId: string) {
    return this.reviewsService.getDoctorReviews(doctorId)
  }

  @Get("patient")
  @Roles(["PATIENT"])
  @ApiOperation({ summary: "Get reviews given by current patient" })
  async getPatientReviews(@Session() session: UserSession) {
    return this.reviewsService.getPatientReviews(session.user.id)
  }

  @Get("check/:appointmentId")
  @Roles(["PATIENT"])
  @ApiOperation({ summary: "Check if patient has reviewed an appointment" })
  @ApiParam({ name: "appointmentId", description: "Appointment ID" })
  async hasReviewed(
    @Session() session: UserSession,
    @Param("appointmentId") appointmentId: string,
  ) {
    return this.reviewsService.hasReviewed(session.user.id, appointmentId)
  }
}
