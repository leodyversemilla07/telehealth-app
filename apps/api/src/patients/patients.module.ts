import { Module } from "@nestjs/common"
import { PrismaModule } from "../prisma/prisma.module"
import { TrpcModule } from "../trpc/trpc.module"
import { PatientsRouter } from "./patients.router"
import { PatientsService } from "./patients.service"

@Module({
  imports: [TrpcModule, PrismaModule],
  providers: [PatientsRouter, PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
