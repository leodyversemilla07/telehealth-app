import { Inject } from "@nestjs/common"
import {
  Ctx,
  Input,
  Mutation,
  Query,
  Router,
  UseMiddlewares,
} from "nestjs-trpc"
import type { AuthedTrpcContext } from "../trpc/context.types"
import { AuthMiddleware } from "../trpc/middlewares/auth.middleware"
import { RolesMiddleware } from "../trpc/middlewares/roles.middleware"
import {
  type CreateReviewInput,
  createReviewInput,
  type ReviewCheckInput,
  type ReviewsByDoctorInput,
  reviewCheckInput,
  reviewsByDoctorInput,
} from "./reviews.contracts"
import { ReviewsService } from "./reviews.service"

/**
 * tRPC router for reviews. Mirrors the retired ReviewsController: create /
 * myReviews / hasReviewed require a PATIENT; byDoctor is public (no session).
 */
@Router({ alias: "reviews" })
export class ReviewsRouter {
  constructor(
    @Inject(ReviewsService) private readonly reviews: ReviewsService,
  ) {}

  @Mutation({ input: createReviewInput, meta: { roles: ["PATIENT"] } })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async create(
    @Ctx() ctx: AuthedTrpcContext,
    @Input() input: CreateReviewInput,
  ) {
    return this.reviews.createReview(
      ctx.user.id,
      input.appointmentId,
      input.rating,
      input.comment,
    )
  }

  @Query({ input: reviewsByDoctorInput })
  async byDoctor(@Input() input: ReviewsByDoctorInput) {
    return this.reviews.getDoctorReviews(
      input.doctorId,
      input.limit ?? 50,
      input.offset ?? 0,
    )
  }

  @Query({ meta: { roles: ["PATIENT"] } })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async myReviews(@Ctx() ctx: AuthedTrpcContext) {
    return this.reviews.getPatientReviews(ctx.user.id)
  }

  @Query({ input: reviewCheckInput, meta: { roles: ["PATIENT"] } })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async hasReviewed(
    @Ctx() ctx: AuthedTrpcContext,
    @Input() input: ReviewCheckInput,
  ) {
    return this.reviews.hasReviewed(ctx.user.id, input.appointmentId)
  }
}
