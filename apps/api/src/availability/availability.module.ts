import { Module } from "@nestjs/common"
import { AuditLogsModule } from "../audit-logs/audit-logs.module"
import { NotificationsModule } from "../notifications/notifications.module"
import { PrismaModule } from "../prisma/prisma.module"
import { TrpcModule } from "../trpc/trpc.module"
import { AvailabilityRouter } from "./availability.router"
import { AvailabilityService } from "./availability.service"

@Module({
  imports: [PrismaModule, NotificationsModule, AuditLogsModule, TrpcModule],
  providers: [AvailabilityService, AvailabilityRouter],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
