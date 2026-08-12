import { Inject } from "@nestjs/common"
import type { AppointmentDto } from "@workspace/shared"
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

/** A raw appointment row as returned by the service (Prisma shape). */
type AppointmentRow = Awaited<ReturnType<AppointmentsService["findOne"]>>

/**
 * Single boundary where a Prisma appointment row becomes the shared
 * AppointmentDto contract. Every procedure below returns the DTO, so the
 * generated AppRouter types match what the web app consumes (no
 * `as unknown as` casts at the client). pricePerVisit (Prisma Decimal) is
 * normalized to a plain number here instead of leaking `{s,e,d}` objects
 * onto the wire.
 */
function toAppointmentDto(appt: AppointmentRow): AppointmentDto {
  const rawPrice = appt.doctor.pricePerVisit
  return {
    id: appt.id,
    patientId: appt.patientId,
    doctorId: appt.doctorId,
    scheduleId: appt.scheduleId,
    startTime: appt.startTime,
    endTime: appt.endTime,
    status: appt.status,
    reason: appt.reason,
    symptoms: appt.symptoms,
    type: appt.type,
    roomUrl: appt.roomUrl,
    notes: appt.notes,
    callMetadata:
      appt.callMetadata as unknown as AppointmentDto["callMetadata"],
    createdAt: appt.createdAt,
    updatedAt: appt.updatedAt,
    patient: {
      id: appt.patient.id,
      name: appt.patient.name,
      email: appt.patient.email,
    },
    doctor: {
      id: appt.doctor.id,
      specialty: appt.doctor.specialty,
      pricePerVisit: rawPrice == null ? null : Number(String(rawPrice)) || null,
      clinicAddress: appt.doctor.clinicAddress,
      user: {
        id: appt.doctor.user.id,
        name: appt.doctor.user.name,
        email: appt.doctor.user.email,
        image: appt.doctor.user.image,
      },
    },
  }
}

function toPagedAppointments(
  r: Awaited<ReturnType<AppointmentsService["findMyAppointments"]>>,
): { items: AppointmentDto[]; total: number; limit: number; offset: number } {
  return { ...r, items: r.items.map(toAppointmentDto) }
}

/**
 * tRPC router for appointments — the single API surface for the booking /
 * consultation lifecycle. Every procedure returns the shared AppointmentDto
 * (see toAppointmentDto), so the generated AppRouter types ARE the client
 * contract. Role guards: PATIENT books + reschedules; DOCTOR/ADMIN update
 * status; all signed-in users list / read.
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
    return toAppointmentDto(await this.appointments.create(ctx.user.id, input))
  }

  // ─── Listing (Patient or Doctor) ────────────────────────────────────

  @Query({ input: paginationInput })
  @UseMiddlewares(AuthMiddleware)
  async findMine(
    @Ctx() ctx: AuthedTrpcContext,
    @Input() input: { limit?: number; offset?: number },
  ) {
    return toPagedAppointments(
      await this.appointments.findMyAppointments(
        ctx.user.id,
        ctx.user.role as string,
        input.limit,
        input.offset,
      ),
    )
  }

  @Query({ input: paginationInput })
  @UseMiddlewares(AuthMiddleware)
  async findUpcoming(
    @Ctx() ctx: AuthedTrpcContext,
    @Input() input: { limit?: number; offset?: number },
  ) {
    return toPagedAppointments(
      await this.appointments.findMyAppointments(
        ctx.user.id,
        ctx.user.role as string,
        input.limit,
        input.offset,
        "upcoming",
      ),
    )
  }

  @Query({ input: paginationInput })
  @UseMiddlewares(AuthMiddleware)
  async findHistory(
    @Ctx() ctx: AuthedTrpcContext,
    @Input() input: { limit?: number; offset?: number },
  ) {
    return toPagedAppointments(
      await this.appointments.findMyAppointments(
        ctx.user.id,
        ctx.user.role as string,
        input.limit,
        input.offset,
        "history",
      ),
    )
  }

  @Query({ input: appointmentIdInput })
  @UseMiddlewares(AuthMiddleware)
  async findOne(@Ctx() ctx: AuthedTrpcContext, @Input("id") id: string) {
    return toAppointmentDto(
      await this.appointments.findOne(id, ctx.user.id, ctx.user.role as string),
    )
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
    return toAppointmentDto(
      await this.appointments.updateStatus(
        input.id,
        input.status,
        ctx.user.id,
        ctx.user.role as string,
      ),
    )
  }

  // ─── Cancel (Patient / Doctor / Admin) ──────────────────────────────

  @Mutation({
    input: appointmentIdInput,
    meta: { roles: ["PATIENT", "DOCTOR", "ADMIN"] },
  })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async cancel(@Ctx() ctx: AuthedTrpcContext, @Input("id") id: string) {
    return toAppointmentDto(
      await this.appointments.cancel(id, ctx.user.id, ctx.user.role as string),
    )
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
    return toAppointmentDto(
      await this.appointments.reschedule(
        input.id,
        { startTime: input.startTime, endTime: input.endTime },
        ctx.user.id,
      ),
    )
  }

  // ─── Reminders (Admin) ──────────────────────────────────────────────

  @Mutation({ meta: { roles: ["ADMIN"] } })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async sendReminders() {
    return this.appointments.sendUpcomingReminders()
  }
}
