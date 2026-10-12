import { RedisService } from "../../redis/redis.service"
import { CacheService } from "./cache.service"

const originalRedisUrl = process.env.REDIS_URL

function mockRedis() {
  return {
    configured: true,
    cacheGet: jest.fn(),
    cacheSet: jest.fn(),
    cacheDelete: jest.fn(),
    cacheScan: jest.fn(),
  }
}

type MockRedis = ReturnType<typeof mockRedis>

describe("CacheService", () => {
  afterEach(() => {
    if (originalRedisUrl === undefined) {
      delete process.env.REDIS_URL
    } else {
      process.env.REDIS_URL = originalRedisUrl
    }
  })

  describe("without REDIS_URL (in-process fallback)", () => {
    let service: CacheService

    beforeEach(() => {
      delete process.env.REDIS_URL
      service = new CacheService(new RedisService())
    })

    it("round-trips values including Dates", async () => {
      const value = { at: new Date("2026-01-02T03:04:05.000Z"), n: 1 }
      await service.set("k", value, 60_000)
      expect(await service.get("k")).toEqual(value)
    })

    it("returns undefined for missing keys", async () => {
      await expect(service.get("nope")).resolves.toBeUndefined()
    })

    it("invalidates by prefix", async () => {
      await service.set("doctors:approved:a", { n: 1 }, 60_000)
      await service.set("doctors:approved:b", { n: 2 }, 60_000)
      await service.set("admin:dashboard", { n: 3 }, 60_000)
      await service.invalidatePrefix("doctors:approved")
      await expect(service.get("doctors:approved:a")).resolves.toBeUndefined()
      await expect(service.get("doctors:approved:b")).resolves.toBeUndefined()
      await expect(service.get("admin:dashboard")).resolves.toEqual({ n: 3 })
    })
  })

  describe("with Redis configured", () => {
    let redis: MockRedis
    let service: CacheService

    beforeEach(() => {
      redis = mockRedis()
      service = new CacheService(redis as unknown as RedisService)
    })

    it("namespaces keys and revives Dates on read", async () => {
      redis.cacheGet.mockResolvedValue(
        JSON.stringify({
          at: { "$telehealth.date": "2026-01-02T03:04:05.000Z" },
        }),
      )
      const result = await service.get<{ at: Date }>("doctors:approved:{}")
      expect(redis.cacheGet).toHaveBeenCalledWith(
        "telehealth:cache:doctors:approved:{}",
      )
      expect(result?.at).toBeInstanceOf(Date)
    })

    it("treats null, corrupt payloads, and errors as a miss", async () => {
      redis.cacheGet.mockResolvedValue(null)
      await expect(service.get("a")).resolves.toBeUndefined()

      redis.cacheGet.mockResolvedValue("not-json{{{")
      await expect(service.get("b")).resolves.toBeUndefined()

      redis.cacheGet.mockRejectedValue(new Error("boom"))
      await expect(service.get("c")).resolves.toBeUndefined()
    })

    it("serializes Dates and converts TTL to seconds on write", async () => {
      await service.set(
        "k",
        { at: new Date("2026-01-02T03:04:05.000Z") },
        120_000,
      )
      expect(redis.cacheSet).toHaveBeenCalledWith(
        "telehealth:cache:k",
        JSON.stringify({
          at: { "$telehealth.date": "2026-01-02T03:04:05.000Z" },
        }),
        120,
      )
    })

    it("never rejects on write failure (fail-open)", async () => {
      redis.cacheSet.mockRejectedValue(new Error("boom"))
      await expect(service.set("k", { n: 1 })).resolves.toBeUndefined()
    })

    it("deletes the namespaced key on invalidate", async () => {
      await service.invalidate("admin:dashboard")
      expect(redis.cacheDelete).toHaveBeenCalledWith([
        "telehealth:cache:admin:dashboard",
      ])
    })

    it("scans and deletes a prefix without touching other namespaces", async () => {
      redis.cacheScan.mockResolvedValue([
        "telehealth:cache:doctors:approved:a",
        "telehealth:cache:doctors:approved:b",
      ])
      await service.invalidatePrefix("doctors:approved")
      expect(redis.cacheScan).toHaveBeenCalledWith(
        "telehealth:cache:doctors:approved*",
      )
      expect(redis.cacheDelete).toHaveBeenCalledWith([
        "telehealth:cache:doctors:approved:a",
        "telehealth:cache:doctors:approved:b",
      ])
    })

    it("clear() only scans its own namespace", async () => {
      redis.cacheScan.mockResolvedValue([])
      await service.clear()
      expect(redis.cacheScan).toHaveBeenCalledWith("telehealth:cache:*")
      expect(redis.cacheDelete).toHaveBeenCalledWith([])
    })
  })
})
