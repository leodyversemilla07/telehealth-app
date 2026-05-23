import { Module } from "@nestjs/common"
import { AuditLogsController } from "@/audit-logs/audit-logs.controller"
import { AuditLogsService } from "@/audit-logs/audit-logs.service"

@Module({
  controllers: [AuditLogsController],
  providers: [AuditLogsService],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
