import { Module } from "@nestjs/common"
import { AuditLogsModule } from "../audit-logs/audit-logs.module"
import { NotificationsModule } from "../notifications/notifications.module"
import { PrismaModule } from "../prisma/prisma.module"
import { AppointmentsController } from "./appointments.controller"
import { AppointmentsService } from "./appointments.service"

@Module({
  imports: [PrismaModule, NotificationsModule, AuditLogsModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
