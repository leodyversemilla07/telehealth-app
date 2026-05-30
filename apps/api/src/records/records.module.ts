import { Module } from "@nestjs/common"
import { AuditLogsModule } from "../audit-logs/audit-logs.module"
import { PrismaModule } from "../prisma/prisma.module"
import { RecordsController } from "./records.controller"
import { RecordsService } from "./records.service"

@Module({
  imports: [PrismaModule, AuditLogsModule],
  controllers: [RecordsController],
  providers: [RecordsService],
  exports: [RecordsService],
})
export class RecordsModule {}
