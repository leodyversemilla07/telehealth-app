import { Module } from "@nestjs/common"
import { AuditLogsModule } from "../audit-logs/audit-logs.module"
import { NotificationsModule } from "../notifications/notifications.module"
import { PrismaModule } from "../prisma/prisma.module"
import { SecurityAlertsModule } from "../security-alerts/security-alerts.module"
import { UsersController } from "./users.controller"
import { UsersService } from "./users.service"

@Module({
  imports: [
    PrismaModule,
    AuditLogsModule,
    SecurityAlertsModule,
    NotificationsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
