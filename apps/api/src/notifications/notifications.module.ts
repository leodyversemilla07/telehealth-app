import { Module } from "@nestjs/common"
import { PrismaModule } from "../prisma/prisma.module"
import { PushModule } from "../push/push.module"
import { TrpcModule } from "../trpc/trpc.module"
import { NotificationsRouter } from "./notifications.router"
import { NotificationsService } from "./notifications.service"
import { SocketService } from "./socket.service"

@Module({
  imports: [TrpcModule, PrismaModule, PushModule],
  providers: [NotificationsRouter, NotificationsService, SocketService],
  exports: [NotificationsService, SocketService],
})
export class NotificationsModule {}
