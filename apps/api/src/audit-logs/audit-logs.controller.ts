import { Controller, Get } from "@nestjs/common"
import { Roles } from "@thallesp/nestjs-better-auth"
import { AuditLogsService } from "@/audit-logs/audit-logs.service"

@Controller("audit-logs")
@Roles(["ADMIN"])
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  async getLogs() {
    return this.auditLogsService.getLogs()
  }
}
