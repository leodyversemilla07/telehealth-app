import { Inject } from "@nestjs/common"
import type { PatientProfileDto } from "@workspace/shared"
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
import type { PatientProfileRow } from "./patients.service"
import { PatientsService } from "./patients.service"

/**
 * Single boundary where a raw Prisma patient profile becomes the shared
 * PatientProfileDto. Dates stay as `Date` — the global PhtDateInterceptor
 * converts them to PHT strings on the wire, and clients read them back with
 * the shared `toDate` helper (profile-content already does for `dob`).
 * Exported for direct unit coverage.
 */
export function toPatientProfileDto(row: PatientProfileRow): PatientProfileDto {
  return {
    id: row.id,
    userId: row.userId,
    dob: row.dob,
    sex: row.sex,
    phone: row.phone,
    address: row.address,
    philhealthNumber: row.philhealthNumber,
    weight: row.weight,
    height: row.height,
    // Prisma JSON — the stored medical-history object is validated at write
    // time; narrow JsonValue to the shared record shape here once.
    medicalHistory: row.medicalHistory as unknown as Record<
      string,
      unknown
    > | null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    user: {
      id: row.user.id,
      name: row.user.name,
      firstName: row.user.firstName ?? null,
      middleName: row.user.middleName ?? null,
      lastName: row.user.lastName ?? null,
      email: row.user.email,
      image: row.user.image,
    },
  }
}

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
    return toPatientProfileDto(await this.patients.findByUserId(ctx.user.id))
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
