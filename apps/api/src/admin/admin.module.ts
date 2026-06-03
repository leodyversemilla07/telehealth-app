import { Module } from "@nestjs/common"
import { AuditLogsModule } from "../audit-logs/audit-logs.module"
import { DoctorsModule } from "../doctors/doctors.module"
import { PrismaModule } from "../prisma/prisma.module"
import { SecurityAlertsModule } from "../security-alerts/security-alerts.module"
import { UsersModule } from "../users/users.module"
import { AdminController } from "./admin.controller"
import { AdminService } from "./admin.service"

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    DoctorsModule,
    AuditLogsModule,
    SecurityAlertsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
