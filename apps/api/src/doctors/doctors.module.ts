import { Module } from "@nestjs/common"
import { PrismaModule } from "../prisma/prisma.module"
import { TrpcModule } from "../trpc/trpc.module"
import { DoctorsRouter } from "./doctors.router"
import { DoctorsService } from "./doctors.service"

@Module({
  imports: [PrismaModule, TrpcModule],
  providers: [DoctorsService, DoctorsRouter],
  exports: [DoctorsService],
})
export class DoctorsModule {}
