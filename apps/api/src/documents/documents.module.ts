import { Module } from "@nestjs/common"
import { AuditLogsModule } from "../audit-logs/audit-logs.module"
import { PrismaModule } from "../prisma/prisma.module"
import { DocumentsController } from "./documents.controller"
import { DocumentsService } from "./documents.service"

@Module({
  imports: [PrismaModule, AuditLogsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
