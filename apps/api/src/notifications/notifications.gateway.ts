import {
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common"
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets"
import { Server, Socket } from "socket.io"

@WebSocketGateway({ cors: { origin: "*" } })
export class NotificationsGateway
  implements
    OnModuleInit,
    OnModuleDestroy,
    OnGatewayConnection,
    OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsGateway.name)

  @WebSocketServer()
  server!: Server

  onModuleInit() {
    this.logger.log("Notifications WebSocket gateway initialized")
  }

  onModuleDestroy() {
    this.logger.log("Notifications WebSocket gateway destroyed")
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`)
  }

  @SubscribeMessage("join")
  handleJoin(client: Socket, userId: string) {
    client.join(userId)
    this.logger.log(`Client ${client.id} joined room: ${userId}`)
  }

  emitToUser(userId: string, event: string, data: any) {
    this.server.to(userId).emit(event, data)
  }
}
