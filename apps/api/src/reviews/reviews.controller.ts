import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common"
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
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator"
import { PaginationDto } from "../common/dto/pagination.dto"
import { ReviewsService } from "./reviews.service"

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
  @ApiCreatedResponse({ description: "Review created" })
  @ApiBadRequestResponse({ description: "Invalid input" })
  @ApiNotFoundResponse({ description: "Not found" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
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
  @AllowAnonymous()
  @ApiOperation({ summary: "Get reviews for a doctor (public)" })
  @ApiParam({ name: "doctorId", description: "Doctor profile ID" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  @ApiOkResponse({ description: "List of reviews" })
  async getDoctorReviews(
    @Param("doctorId") doctorId: string,
    @Query() query: PaginationDto,
  ) {
    return this.reviewsService.getDoctorReviews(
      doctorId,
      query.limit,
      query.offset,
    )
  }

  @Get("patient")
  @Roles(["PATIENT"])
  @ApiOperation({ summary: "Get reviews given by current patient" })
  @ApiOkResponse({ description: "List of reviews" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async getPatientReviews(@Session() session: UserSession) {
    return this.reviewsService.getPatientReviews(session.user.id)
  }

  @Get("check/:appointmentId")
  @Roles(["PATIENT"])
  @ApiOperation({ summary: "Check if patient has reviewed an appointment" })
  @ApiParam({ name: "appointmentId", description: "Appointment ID" })
  @ApiOkResponse({ description: "Review check result" })
  @ApiNotFoundResponse({ description: "Not found" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async hasReviewed(
    @Session() session: UserSession,
    @Param("appointmentId") appointmentId: string,
  ) {
    return this.reviewsService.hasReviewed(session.user.id, appointmentId)
  }
}
