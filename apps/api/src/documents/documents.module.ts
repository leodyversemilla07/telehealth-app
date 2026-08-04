import { Module } from "@nestjs/common"
import { AuditLogsModule } from "../audit-logs/audit-logs.module"
import { PrismaModule } from "../prisma/prisma.module"
import { TrpcModule } from "../trpc/trpc.module"
import { DocumentsController } from "./documents.controller"
import { DocumentsRouter } from "./documents.router"
import { DocumentsService } from "./documents.service"

@Module({
  imports: [PrismaModule, AuditLogsModule, TrpcModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentsRouter],
  exports: [DocumentsService],
})
export class DocumentsModule {}
