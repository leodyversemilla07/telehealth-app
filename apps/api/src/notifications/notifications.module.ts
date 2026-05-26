import { Module } from "@nestjs/common"
import { NotificationsController } from "./notifications.controller"
import { NotificationsGateway } from "./notifications.gateway"
import { NotificationsService } from "./notifications.service"
import { PrismaModule } from "@/prisma/prisma.module"

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
