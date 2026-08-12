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
import type { UpdatePatientProfileInput } from "./patients.contracts"
import { updatePatientProfileInput } from "./patients.contracts"
import { PatientsService } from "./patients.service"

/**
 * tRPC router for the patient's own profile. Mirrors the retired
 * PatientsController (GET/PATCH /patients/me): PATIENT-only, and the profile
 * is upserted on first access.
 */
@Router({ alias: "patients" })
export class PatientsRouter {
  constructor(
    @Inject(PatientsService) private readonly patients: PatientsService,
  ) {}

  @Query({ meta: { roles: ["PATIENT"] } })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async me(@Ctx() ctx: AuthedTrpcContext) {
    return this.patients.findByUserId(ctx.user.id)
  }

  @Mutation({
    input: updatePatientProfileInput,
    meta: { roles: ["PATIENT"] },
  })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async updateMe(
    @Ctx() ctx: AuthedTrpcContext,
    @Input() input: UpdatePatientProfileInput,
  ) {
    return this.patients.updateProfile(ctx.user.id, input)
  }
}
