import { Module } from "@nestjs/common"
import { AvailabilityController } from "@/availability/availability.controller"
import { AvailabilityService } from "@/availability/availability.service"
import { PrismaModule } from "@/prisma/prisma.module"

@Module({
  imports: [PrismaModule],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
