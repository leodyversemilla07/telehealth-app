import { Module } from "@nestjs/common"
import { PrismaModule } from "../prisma/prisma.module"
import { TrpcModule } from "../trpc/trpc.module"
import { DoctorsController } from "./doctors.controller"
import { DoctorsRouter } from "./doctors.router"
import { DoctorsService } from "./doctors.service"

@Module({
  imports: [PrismaModule, TrpcModule],
  controllers: [DoctorsController],
  providers: [DoctorsService, DoctorsRouter],
  exports: [DoctorsService],
})
export class DoctorsModule {}
