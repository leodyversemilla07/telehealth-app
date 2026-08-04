import { Module } from "@nestjs/common"
import { AuditLogsModule } from "../audit-logs/audit-logs.module"
import { NotificationsModule } from "../notifications/notifications.module"
import { PrismaModule } from "../prisma/prisma.module"
import { TrpcModule } from "../trpc/trpc.module"
import { AppointmentsRouter } from "./appointments.router"
import { AppointmentsService } from "./appointments.service"

@Module({
  imports: [PrismaModule, NotificationsModule, AuditLogsModule, TrpcModule],
  providers: [AppointmentsService, AppointmentsRouter],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
