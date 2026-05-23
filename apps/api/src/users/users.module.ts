import { Module } from "@nestjs/common"
import { AuditLogsModule } from "@/audit-logs/audit-logs.module"
import { PrismaModule } from "@/prisma/prisma.module"
import { SecurityAlertsModule } from "@/security-alerts/security-alerts.module"
import { UsersController } from "@/users/users.controller"
import { UsersService } from "@/users/users.service"

@Module({
  imports: [PrismaModule, AuditLogsModule, SecurityAlertsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
