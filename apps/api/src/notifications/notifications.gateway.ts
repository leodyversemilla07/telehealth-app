import { Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets"
import { Server, Socket } from "socket.io"
import { auth } from "../auth/auth"

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:3000"],
    credentials: true,
  },
})
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

  async handleConnection(client: Socket) {
    const cookie = client.handshake.headers.cookie
    const session = await auth.api.getSession({
      headers: new Headers(cookie ? { cookie } : undefined),
    })

    if (!session?.user?.id) {
      client.disconnect(true)
      return
    }

    client.data.userId = session.user.id
    client.join(session.user.id)
    this.logger.log(`Client connected: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`)
  }

  @SubscribeMessage("join")
  handleJoin(client: Socket) {
    const userId = client.data.userId as string | undefined
    if (!userId) return

    client.join(userId)
    this.logger.log(`Client ${client.id} joined room: ${userId}`)
  }

  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(userId).emit(event, data)
  }
}
