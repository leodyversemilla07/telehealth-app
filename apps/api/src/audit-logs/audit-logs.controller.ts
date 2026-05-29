import { Controller, Get, Query } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger"
import { Roles } from "@thallesp/nestjs-better-auth"
import { AuditLogsService } from "@/audit-logs/audit-logs.service"

@ApiTags("Audit Logs")
@ApiBearerAuth("session-token")
@Controller("audit-logs")
@Roles(["ADMIN"])
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: "List audit logs with pagination (admin)" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  async getLogs(
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    return this.auditLogsService.getLogs(
      limit ? Math.min(parseInt(limit, 10) || 50, 200) : 50,
      offset ? parseInt(offset, 10) || 0 : 0,
    )
  }
}
