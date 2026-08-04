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
import { paginationInput } from "../trpc/contracts.util"
import { AuthMiddleware } from "../trpc/middlewares/auth.middleware"
import { RolesMiddleware } from "../trpc/middlewares/roles.middleware"
import type { CreateConsultationDto } from "./dto"
import {
  byAppointmentInput,
  createConsultationInput,
  patientIdInput,
} from "./records.contracts"
import { RecordsService } from "./records.service"

/**
 * tRPC router for medical records. Mirrors RecordsController — doctors create
 * consultations (incl. prescriptions) and read their patients; patients read
 * their own consultations + prescriptions.
 */
@Router({ alias: "records" })
export class RecordsRouter {
  constructor(
    @Inject(RecordsService) private readonly records: RecordsService,
  ) {}

  // ─── Doctor: record a consultation ──────────────────────────────────

  @Mutation({
    input: createConsultationInput,
    meta: { roles: ["DOCTOR"] },
  })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async create(
    @Ctx() ctx: AuthedTrpcContext,
    @Input() input: CreateConsultationDto,
  ) {
    return this.records.createConsultation(ctx.user.id, input)
  }

  // ─── Read consultation by appointment (patient or doctor) ───────────

  @Query({ input: byAppointmentInput })
  @UseMiddlewares(AuthMiddleware)
  async byAppointment(
    @Ctx() ctx: AuthedTrpcContext,
    @Input("appointmentId") appointmentId: string,
  ) {
    return this.records.getConsultationByAppointment(
      appointmentId,
      ctx.user.id,
      ctx.user.role as string,
    )
  }

  // ─── Patient: my records + prescriptions ────────────────────────────

  @Query({ input: paginationInput, meta: { roles: ["PATIENT"] } })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async myRecords(
    @Ctx() ctx: AuthedTrpcContext,
    @Input() input: { limit?: number; offset?: number },
  ) {
    return this.records.getPatientRecords(
      ctx.user.id,
      input.limit,
      input.offset,
    )
  }

  @Query({ input: paginationInput, meta: { roles: ["PATIENT"] } })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async myPrescriptions(
    @Ctx() ctx: AuthedTrpcContext,
    @Input() input: { limit?: number; offset?: number },
  ) {
    return this.records.getPatientPrescriptions(
      ctx.user.id,
      input.limit,
      input.offset,
    )
  }

  // ─── Doctor: patients + per-patient records ─────────────────────────

  @Query({ input: paginationInput, meta: { roles: ["DOCTOR"] } })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async doctorPatients(
    @Ctx() ctx: AuthedTrpcContext,
    @Input() input: { limit?: number; offset?: number },
  ) {
    return this.records.getDoctorPatients(
      ctx.user.id,
      input.limit,
      input.offset,
    )
  }

  @Query({ input: patientIdInput, meta: { roles: ["DOCTOR"] } })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async doctorPatientRecords(
    @Ctx() ctx: AuthedTrpcContext,
    @Input("patientId") patientId: string,
  ) {
    return this.records.getPatientRecordsForDoctor(patientId, ctx.user.id)
  }
}
