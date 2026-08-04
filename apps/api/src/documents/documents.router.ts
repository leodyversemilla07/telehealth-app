import { Inject } from "@nestjs/common"
import { Ctx, Input, Query, Router, UseMiddlewares } from "nestjs-trpc"
import type { AuthedTrpcContext } from "../trpc/context.types"
import { AuthMiddleware } from "../trpc/middlewares/auth.middleware"
import { documentsByAppointmentInput } from "./documents.contracts"
import { DocumentsService, type UserRole } from "./documents.service"

/**
 * tRPC router for medical documents. Only the read procedures live here —
 * upload (multipart) and file streaming stay on the REST controller.
 */
@Router({ alias: "documents" })
export class DocumentsRouter {
  constructor(
    @Inject(DocumentsService) private readonly documents: DocumentsService,
  ) {}

  @Query({ input: documentsByAppointmentInput })
  @UseMiddlewares(AuthMiddleware)
  async byAppointment(
    @Ctx() ctx: AuthedTrpcContext,
    @Input("appointmentId") appointmentId: string,
  ) {
    return this.documents.listForAppointment(
      ctx.user.id,
      ctx.user.role as UserRole,
      appointmentId,
    )
  }
}
