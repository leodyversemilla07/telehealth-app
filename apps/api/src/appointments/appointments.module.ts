import { Module } from "@nestjs/common"
import { AuditLogsModule } from "../audit-logs/audit-logs.module"
import { NotificationsModule } from "../notifications/notifications.module"
import { PrismaModule } from "../prisma/prisma.module"
import { TrpcModule } from "../trpc/trpc.module"
import { AppointmentsController } from "./appointments.controller"
import { AppointmentsRouter } from "./appointments.router"
import { AppointmentsService } from "./appointments.service"

@Module({
  imports: [PrismaModule, NotificationsModule, AuditLogsModule, TrpcModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsRouter],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
