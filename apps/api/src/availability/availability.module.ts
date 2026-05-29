import { Module } from "@nestjs/common"
import { NotificationsModule } from "@/notifications/notifications.module"
import { PrismaModule } from "@/prisma/prisma.module"
import { AvailabilityController } from "./availability.controller"
import { AvailabilityService } from "./availability.service"

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
