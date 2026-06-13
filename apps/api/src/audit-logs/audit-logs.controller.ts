import { Controller, Get, Query } from "@nestjs/common"
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger"
import { Roles } from "@thallesp/nestjs-better-auth"
import { AuditLogsService } from "./audit-logs.service"

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
  @ApiOkResponse({ description: "List of audit logs" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
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
