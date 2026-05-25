import { Injectable } from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"

@Injectable()
export class AppService {
  private readonly startTime = Date.now()

  constructor(private readonly prisma: PrismaService) {}

  async getHealth() {
    let dbStatus: "healthy" | "unhealthy" = "healthy"
    let dbLatency: number | null = null

    try {
      const before = Date.now()
      await this.prisma.$queryRaw<never[]>`SELECT 1`
      dbLatency = Date.now() - before
    } catch {
      dbStatus = "unhealthy"
    }

    return {
      status: "ok",
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
      },
      version: process.env.npm_package_version ?? "0.0.1",
    }
  }
}
