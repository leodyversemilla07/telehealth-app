import { Controller, Get } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger"
import { Roles } from "@thallesp/nestjs-better-auth"
import { AuditLogsService } from "@/audit-logs/audit-logs.service"

@ApiTags("Audit Logs")
@ApiBearerAuth("session-token")
@Controller("audit-logs")
@Roles(["ADMIN"])
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: "List all audit logs (admin)" })
  async getLogs() {
    return this.auditLogsService.getLogs()
  }
}
