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
  appointmentIdInput,
  createAppointmentInput,
  paginationInput,
  rescheduleAppointmentInput,
  updateAppointmentStatusInput,
} from "./appointments.contracts"
import { AppointmentsService } from "./appointments.service"
import type {
  CreateAppointmentDto,
  RescheduleAppointmentDto,
  UpdateAppointmentStatusDto,
} from "./dto"

/**
 * tRPC router for appointments. Mirrors AppointmentsController — a mirror set
 * of procedures for the booking / consultation lifecycle, with the same
 * role guards (PATIENT books + reschedules; DOCTOR/ADMIN update status;
 * all signed-in users list / read).
 */
@Router({ alias: "appointments" })
export class AppointmentsRouter {
  constructor(
    @Inject(AppointmentsService)
    private readonly appointments: AppointmentsService,
  ) {}

  // ─── Booking (Patient) ──────────────────────────────────────────────

  @Mutation({
    input: createAppointmentInput,
    meta: { roles: ["PATIENT"] },
  })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async create(
    @Ctx() ctx: AuthedTrpcContext,
    @Input() input: CreateAppointmentDto,
  ) {
    return this.appointments.create(ctx.user.id, input)
  }

  // ─── Listing (Patient or Doctor) ────────────────────────────────────

  @Query({ input: paginationInput })
  @UseMiddlewares(AuthMiddleware)
  async findMine(
    @Ctx() ctx: AuthedTrpcContext,
    @Input() input: { limit?: number; offset?: number },
  ) {
    return this.appointments.findMyAppointments(
      ctx.user.id,
      ctx.user.role as string,
      input.limit,
      input.offset,
    )
  }

  @Query({ input: paginationInput })
  @UseMiddlewares(AuthMiddleware)
  async findUpcoming(
    @Ctx() ctx: AuthedTrpcContext,
    @Input() input: { limit?: number; offset?: number },
  ) {
    return this.appointments.findMyAppointments(
      ctx.user.id,
      ctx.user.role as string,
      input.limit,
      input.offset,
      "upcoming",
    )
  }

  @Query({ input: paginationInput })
  @UseMiddlewares(AuthMiddleware)
  async findHistory(
    @Ctx() ctx: AuthedTrpcContext,
    @Input() input: { limit?: number; offset?: number },
  ) {
    return this.appointments.findMyAppointments(
      ctx.user.id,
      ctx.user.role as string,
      input.limit,
      input.offset,
      "history",
    )
  }

  @Query({ input: appointmentIdInput })
  @UseMiddlewares(AuthMiddleware)
  async findOne(@Ctx() ctx: AuthedTrpcContext, @Input("id") id: string) {
    return this.appointments.findOne(id, ctx.user.id, ctx.user.role as string)
  }

  // ─── Workflow (Doctor / Admin) ──────────────────────────────────────

  @Mutation({
    input: updateAppointmentStatusInput,
    meta: { roles: ["DOCTOR", "ADMIN"] },
  })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async updateStatus(
    @Ctx() ctx: AuthedTrpcContext,
    @Input() input: UpdateAppointmentStatusDto & { id: string },
  ) {
    return this.appointments.updateStatus(
      input.id,
      input.status,
      ctx.user.id,
      ctx.user.role as string,
    )
  }

  // ─── Cancel (Patient / Doctor / Admin) ──────────────────────────────

  @Mutation({
    input: appointmentIdInput,
    meta: { roles: ["PATIENT", "DOCTOR", "ADMIN"] },
  })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async cancel(@Ctx() ctx: AuthedTrpcContext, @Input("id") id: string) {
    return this.appointments.cancel(id, ctx.user.id, ctx.user.role as string)
  }

  // ─── Reschedule (Patient) ───────────────────────────────────────────

  @Mutation({
    input: rescheduleAppointmentInput,
    meta: { roles: ["PATIENT"] },
  })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async reschedule(
    @Ctx() ctx: AuthedTrpcContext,
    @Input() input: RescheduleAppointmentDto & { id: string },
  ) {
    return this.appointments.reschedule(
      input.id,
      { startTime: input.startTime, endTime: input.endTime },
      ctx.user.id,
    )
  }

  // ─── Reminders (Admin) ──────────────────────────────────────────────

  @Mutation({ meta: { roles: ["ADMIN"] } })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async sendReminders() {
    return this.appointments.sendUpcomingReminders()
  }
}
