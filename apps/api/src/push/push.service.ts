import { Injectable, Logger, OnModuleInit } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import webPush, { type PushSubscription as WebPushSubscription } from "web-push"
import type { Env } from "@/config/env.validation"
import { PrismaService } from "@/prisma/prisma.service"

export interface SubscribeDto {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  userAgent?: string
}

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name)
  private vapidConfigured = false

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env>,
  ) {}

  onModuleInit() {
    const publicKey = this.config.get("VAPID_PUBLIC_KEY", { infer: true })
    const privateKey = this.config.get("VAPID_PRIVATE_KEY", { infer: true })
    const subject =
      this.config.get("VAPID_SUBJECT", { infer: true }) ??
      "mailto:admin@telehealth.app"

    if (publicKey && privateKey) {
      webPush.setVapidDetails(subject, publicKey, privateKey)
      this.vapidConfigured = true
      this.logger.log("Web Push VAPID configured")
    } else {
      this.logger.warn(
        "VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set — push notifications disabled. " +
          "Generate keys with: node -e \"const wp=require('web-push');const k=wp.generateVAPIDKeys();console.log(JSON.stringify(k))\"",
      )
    }
  }

  getVapidPublicKey(): string | null {
    return this.config.get("VAPID_PUBLIC_KEY", { infer: true }) ?? null
  }

  isConfigured(): boolean {
    return this.vapidConfigured
  }

  async subscribe(userId: string, dto: SubscribeDto) {
    const sub = await this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: {
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: dto.userAgent,
      },
      update: {
        userId,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: dto.userAgent,
      },
    })
    return sub
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    })
    return { success: true }
  }

  async sendToUser(
    userId: string,
    payload: { title: string; body?: string | null; url?: string },
  ) {
    if (!this.vapidConfigured) return

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    })

    if (subscriptions.length === 0) return

    const message = JSON.stringify({
      title: payload.title,
      body: payload.body ?? undefined,
      url: payload.url ?? "/",
    })

    const results = await Promise.allSettled(
      subscriptions.map(
        (sub: { endpoint: string; p256dh: string; auth: string }) => {
          const pushSub: WebPushSubscription = {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          }
          return webPush.sendNotification(pushSub, message)
        },
      ),
    )

    // Clean up expired/invalid subscriptions (410 Gone)
    const staleEndpoints: string[] = []
    for (let i = 0; i < results.length; i++) {
      const r = results[i]
      if (r && r.status === "rejected") {
        const reason = (r as PromiseRejectedResult).reason
        if (
          reason &&
          typeof reason === "object" &&
          "statusCode" in reason &&
          (reason as { statusCode: number }).statusCode === 410
        ) {
          const sub = subscriptions[i]
          if (sub) {
            staleEndpoints.push(sub.endpoint)
          }
        }
      }
    }

    if (staleEndpoints.length > 0) {
      await this.prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: staleEndpoints } },
      })
      this.logger.log(
        `Removed ${staleEndpoints.length} stale push subscription(s)`,
      )
    }
  }
}
