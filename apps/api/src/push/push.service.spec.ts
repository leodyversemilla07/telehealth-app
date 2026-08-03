import { ConfigService } from "@nestjs/config"
import { Test, type TestingModule } from "@nestjs/testing"
import webPush from "web-push"
import { PrismaService } from "../prisma/prisma.service"
import { PushService } from "./push.service"

jest.mock("web-push", () => ({
  __esModule: true,
  default: {
    setVapidDetails: jest.fn(),
    sendNotification: jest.fn(),
  },
}))

type MockPrisma = {
  pushSubscription: {
    findUnique: jest.Mock
    findMany: jest.Mock
    upsert: jest.Mock
    delete: jest.Mock
    deleteMany: jest.Mock
  }
}

function buildPrismaMock(): MockPrisma {
  return {
    pushSubscription: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  }
}

const sendNotificationMock = webPush.sendNotification as jest.Mock

describe("PushService", () => {
  let service: PushService
  let prisma: MockPrisma

  const dto = {
    endpoint: "https://push.example.com/sub/abc",
    keys: { p256dh: "p256dh-key", auth: "auth-key" },
    userAgent: "Mozilla/5.0",
  }

  beforeEach(async () => {
    prisma = buildPrismaMock()
    jest.clearAllMocks()

    const configMock = {
      get: jest.fn((key: string) => {
        if (key === "VAPID_PUBLIC_KEY") return "public-key"
        if (key === "VAPID_PRIVATE_KEY") return "private-key"
        return undefined
      }),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile()

    service = module.get<PushService>(PushService)
  })

  describe("onModuleInit", () => {
    it("should configure VAPID when both keys are present", () => {
      service.onModuleInit()

      expect(webPush.setVapidDetails).toHaveBeenCalledWith(
        "mailto:admin@telehealth.app",
        "public-key",
        "private-key",
      )
      expect(service.isConfigured()).toBe(true)
    })

    it("should stay disabled without keys", () => {
      jest.replaceProperty(service, "config", {
        get: jest.fn().mockReturnValue(undefined),
      } as unknown as ConfigService)

      service.onModuleInit()

      expect(webPush.setVapidDetails).not.toHaveBeenCalled()
      expect(service.isConfigured()).toBe(false)
      expect(service.getVapidPublicKey()).toBeNull()
    })
  })

  describe("subscribe", () => {
    it("should upsert a new subscription when endpoint is free", async () => {
      prisma.pushSubscription.findUnique.mockResolvedValue(null)
      prisma.pushSubscription.upsert.mockResolvedValue({ id: "sub-1" })

      const result = await service.subscribe("u1", dto)

      expect(result).toEqual({ id: "sub-1" })
      expect(prisma.pushSubscription.upsert).toHaveBeenCalledWith({
        where: { endpoint: dto.endpoint },
        create: {
          userId: "u1",
          endpoint: dto.endpoint,
          p256dh: dto.keys.p256dh,
          auth: dto.keys.auth,
          userAgent: dto.userAgent,
        },
        update: {
          userId: "u1",
          p256dh: dto.keys.p256dh,
          auth: dto.keys.auth,
          userAgent: dto.userAgent,
        },
      })
      expect(prisma.pushSubscription.delete).not.toHaveBeenCalled()
    })

    it("should steal the endpoint from another user", async () => {
      prisma.pushSubscription.findUnique.mockResolvedValue({ userId: "other" })
      prisma.pushSubscription.upsert.mockResolvedValue({ id: "sub-2" })

      await service.subscribe("u1", dto)

      expect(prisma.pushSubscription.delete).toHaveBeenCalledWith({
        where: { endpoint: dto.endpoint },
      })
    })
  })

  describe("unsubscribe", () => {
    it("should delete matching subscriptions for the user", async () => {
      prisma.pushSubscription.deleteMany.mockResolvedValue({ count: 1 })

      const result = await service.unsubscribe("u1", dto.endpoint)

      expect(result).toEqual({ success: true })
      expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
        where: { userId: "u1", endpoint: dto.endpoint },
      })
    })
  })

  describe("sendToUser", () => {
    it("should do nothing when push is not configured", async () => {
      // Fresh service (onModuleInit not called) → vapidConfigured = false
      await service.sendToUser("u1", { title: "Hi" })

      expect(prisma.pushSubscription.findMany).not.toHaveBeenCalled()
    })

    it("should do nothing when the user has no subscriptions", async () => {
      service.onModuleInit() // configure VAPID with the mocked keys
      prisma.pushSubscription.findMany.mockResolvedValue([])

      await service.sendToUser("u1", { title: "Hi" })

      expect(sendNotificationMock).not.toHaveBeenCalled()
    })

    it("should send a JSON payload to every subscription", async () => {
      service.onModuleInit()
      sendNotificationMock.mockResolvedValue({})
      prisma.pushSubscription.findMany.mockResolvedValue([
        {
          endpoint: "https://push.example.com/sub/1",
          p256dh: "p1",
          auth: "a1",
        },
        {
          endpoint: "https://push.example.com/sub/2",
          p256dh: "p2",
          auth: "a2",
        },
      ])

      await service.sendToUser("u1", { title: "Hi", body: "Body", url: "/x" })

      expect(sendNotificationMock).toHaveBeenCalledTimes(2)
      expect(sendNotificationMock).toHaveBeenCalledWith(
        {
          endpoint: "https://push.example.com/sub/1",
          keys: { p256dh: "p1", auth: "a1" },
        },
        JSON.stringify({ title: "Hi", body: "Body", url: "/x" }),
      )
    })

    it("should remove subscriptions that reject with 410 Gone", async () => {
      service.onModuleInit()
      sendNotificationMock
        .mockRejectedValueOnce({ statusCode: 410 })
        .mockResolvedValueOnce({})
      prisma.pushSubscription.findMany.mockResolvedValue([
        {
          endpoint: "https://push.example.com/sub/stale",
          p256dh: "p",
          auth: "a",
        },
        {
          endpoint: "https://push.example.com/sub/live",
          p256dh: "p",
          auth: "a",
        },
      ])
      prisma.pushSubscription.deleteMany.mockResolvedValue({ count: 1 })

      await service.sendToUser("u1", { title: "Hi" })

      expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
        where: { endpoint: { in: ["https://push.example.com/sub/stale"] } },
      })
    })

    it("should ignore non-410 failures", async () => {
      service.onModuleInit()
      sendNotificationMock.mockRejectedValueOnce(new Error("network"))
      prisma.pushSubscription.findMany.mockResolvedValue([
        { endpoint: "https://push.example.com/sub/x", p256dh: "p", auth: "a" },
      ])

      await service.sendToUser("u1", { title: "Hi" })

      expect(prisma.pushSubscription.deleteMany).not.toHaveBeenCalled()
    })
  })
})
