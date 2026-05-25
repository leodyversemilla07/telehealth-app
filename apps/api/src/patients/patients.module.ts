import { Module } from "@nestjs/common"
import { PatientsController } from "@/patients/patients.controller"
import { PatientsService } from "@/patients/patients.service"
import { PrismaModule } from "@/prisma/prisma.module"

@Module({
  imports: [PrismaModule],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
