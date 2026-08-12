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
  doctorIdInput,
  type RegisterDoctorInput,
  registerDoctorInput,
  type SearchDoctorsInput,
  searchDoctorsInput,
  type UpdateDoctorProfileInput,
  updateDoctorProfileInput,
} from "./doctors.contracts"
import { DoctorsService } from "./doctors.service"

/**
 * tRPC router for doctors (the retired DoctorsController had its routes
 * folded here). Public procedures
 * (list / byId) need no session; the rest require auth and (via
 * `meta.roles`) a specific role, enforced by AuthMiddleware + RolesMiddleware.
 */
@Router({ alias: "doctors" })
export class DoctorsRouter {
  constructor(
    @Inject(DoctorsService) private readonly doctors: DoctorsService,
  ) {}

  // ─── Public / Patient-facing ────────────────────────────────────────

  @Query({ input: searchDoctorsInput })
  async list(@Input() input: SearchDoctorsInput) {
    return this.doctors.findApproved(input)
  }

  @Query({ input: doctorIdInput })
  async byId(@Input("id") id: string) {
    return this.doctors.findById(id)
  }

  // ─── Registration (any signed-in patient or doctor) ─────────────────

  @Mutation({
    input: registerDoctorInput,
    meta: { roles: ["PATIENT", "DOCTOR"] },
  })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async register(
    @Ctx() ctx: AuthedTrpcContext,
    @Input() input: RegisterDoctorInput,
  ) {
    return this.doctors.register(ctx.user.id, input)
  }

  // ─── Doctor's own profile ───────────────────────────────────────────

  @Query({ meta: { roles: ["DOCTOR"] } })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async myProfile(@Ctx() ctx: AuthedTrpcContext) {
    return this.doctors.findByUserId(ctx.user.id)
  }

  @Mutation({
    input: updateDoctorProfileInput,
    meta: { roles: ["DOCTOR"] },
  })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async updateMyProfile(
    @Ctx() ctx: AuthedTrpcContext,
    @Input() input: UpdateDoctorProfileInput,
  ) {
    return this.doctors.updateProfile(ctx.user.id, input)
  }
}
