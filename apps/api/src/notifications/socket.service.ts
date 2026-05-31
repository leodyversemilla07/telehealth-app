import { Injectable } from "@nestjs/common"
import type { Server } from "socket.io"

@Injectable()
export class SocketService {
  server: Server | null = null

  setServer(server: Server) {
    this.server = server
  }

  emitToUser(userId: string, event: string, data: unknown) {
    if (this.server) {
      this.server.to(userId).emit(event, data)
    }
  }
}
