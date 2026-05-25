import { Module } from "@nestjs/common"
import { AppointmentsController } from "@/appointments/appointments.controller"
import { AppointmentsService } from "@/appointments/appointments.service"
import { PrismaModule } from "@/prisma/prisma.module"

@Module({
  imports: [PrismaModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
