import { Module } from "@nestjs/common"
import { AuditLogsModule } from "../audit-logs/audit-logs.module"
import { PrismaModule } from "../prisma/prisma.module"
import { TrpcModule } from "../trpc/trpc.module"
import { RecordsRouter } from "./records.router"
import { RecordsService } from "./records.service"

@Module({
  imports: [PrismaModule, AuditLogsModule, TrpcModule],
  providers: [RecordsService, RecordsRouter],
  exports: [RecordsService],
})
export class RecordsModule {}
