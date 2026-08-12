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
  type NotificationListInput,
  type NotificationPreferencesInput,
  notificationIdInput,
  notificationListInput,
  notificationPreferencesInput,
} from "./notifications.contracts"
import { NotificationsService } from "./notifications.service"

const EVERYONE = ["PATIENT", "DOCTOR", "ADMIN"]

/**
 * tRPC router for notifications. Mirrors the retired NotificationsController
 * (any authenticated role). The push/email dispatch + socket `createNotification`
 * path stay on NotificationsService directly.
 */
@Router({ alias: "notifications" })
export class NotificationsRouter {
  constructor(
    @Inject(NotificationsService)
    private readonly notifications: NotificationsService,
  ) {}

  @Query({ input: notificationListInput, meta: { roles: EVERYONE } })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async list(
    @Ctx() ctx: AuthedTrpcContext,
    @Input() input: NotificationListInput,
  ) {
    return this.notifications.getNotifications(ctx.user.id, input)
  }

  @Query({ meta: { roles: EVERYONE } })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async unreadCount(@Ctx() ctx: AuthedTrpcContext) {
    return this.notifications.getUnreadCount(ctx.user.id)
  }

  @Query({ meta: { roles: EVERYONE } })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async preferences(@Ctx() ctx: AuthedTrpcContext) {
    return this.notifications.getPreferences(ctx.user.id)
  }

  @Mutation({
    input: notificationPreferencesInput,
    meta: { roles: EVERYONE },
  })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async updatePreferences(
    @Ctx() ctx: AuthedTrpcContext,
    @Input() input: NotificationPreferencesInput,
  ) {
    return this.notifications.updatePreferences(ctx.user.id, input)
  }

  @Mutation({ meta: { roles: EVERYONE } })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async markAllRead(@Ctx() ctx: AuthedTrpcContext) {
    return this.notifications.markAllAsRead(ctx.user.id)
  }

  @Mutation({ input: notificationIdInput, meta: { roles: EVERYONE } })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async markAsRead(@Ctx() ctx: AuthedTrpcContext, @Input("id") id: string) {
    return this.notifications.markAsRead(ctx.user.id, id)
  }
}
