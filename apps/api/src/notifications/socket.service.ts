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

  /**
   * Force-disconnect a user's live sockets (e.g. after a ban revoked their
   * sessions). Emits `session:revoked` first so connected clients can react
   * (redirect to sign-in), then closes the connection. Any reconnect attempt
   * is rejected by the connection handler's session check.
   */
  disconnectUser(userId: string, reason = "session-revoked") {
    if (!this.server) return
    this.server.to(userId).emit("session:revoked", { reason })
    this.server.in(userId).disconnectSockets(true)
  }
}
