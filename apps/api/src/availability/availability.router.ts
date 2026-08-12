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
  availableSlotsInput,
  type CreateTimeOffInput,
  createTimeOffInput,
  doctorIdInput,
  type SetAvailabilityInput,
  setAvailabilityInput,
  timeOffIdInput,
} from "./availability.contracts"
import { AvailabilityService } from "./availability.service"

/**
 * tRPC router for availability (the retired AvailabilityController had its
 * routes folded here). Doctor-only procedures for the weekly schedule + time
 * off, plus public procedures for
 * the booking flow (available slots + weekly schedule).
 */
@Router({ alias: "availability" })
export class AvailabilityRouter {
  constructor(
    @Inject(AvailabilityService)
    private readonly availability: AvailabilityService,
  ) {}

  // ─── Doctor availability management ─────────────────────────────────

  @Mutation({
    input: setAvailabilityInput,
    meta: { roles: ["DOCTOR"] },
  })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async setAvailability(
    @Ctx() ctx: AuthedTrpcContext,
    @Input() input: SetAvailabilityInput,
  ) {
    return this.availability.setAvailability(ctx.user.id, input)
  }

  @Query({ meta: { roles: ["DOCTOR"] } })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async getMyAvailability(@Ctx() ctx: AuthedTrpcContext) {
    return this.availability.getMyAvailability(ctx.user.id)
  }

  // ─── Time off ───────────────────────────────────────────────────────

  @Mutation({
    input: createTimeOffInput,
    meta: { roles: ["DOCTOR"] },
  })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async addTimeOff(
    @Ctx() ctx: AuthedTrpcContext,
    @Input() input: CreateTimeOffInput,
  ) {
    return this.availability.createTimeOff(ctx.user.id, input)
  }

  @Query({ meta: { roles: ["DOCTOR"] } })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async getTimeOff(@Ctx() ctx: AuthedTrpcContext) {
    return this.availability.getTimeOff(ctx.user.id)
  }

  @Mutation({
    input: timeOffIdInput,
    meta: { roles: ["DOCTOR"] },
  })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async deleteTimeOff(@Ctx() ctx: AuthedTrpcContext, @Input("id") id: string) {
    return this.availability.deleteTimeOff(ctx.user.id, id)
  }

  // ─── Public: available slots for booking ────────────────────────────

  @Query({ input: availableSlotsInput })
  async getAvailableSlots(@Input() input: { doctorId: string; date: string }) {
    return this.availability.getAvailableSlots(input.doctorId, input.date)
  }

  @Query({ input: doctorIdInput })
  async getSchedule(@Input("doctorId") doctorId: string) {
    return this.availability.getSchedule(doctorId)
  }
}
