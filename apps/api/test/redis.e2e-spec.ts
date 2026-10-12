import { randomUUID } from "node:crypto"
import { CacheService } from "../src/common/cache/cache.service"
import { RedisService } from "../src/redis/redis.service"

const redisUrl = process.env.TELEHEALTH_E2E_REDIS_URL
const describeWithRedis = redisUrl ? describe : describe.skip

describeWithRedis("Redis rate limiting (e2e)", () => {
  let first: RedisService
  let second: RedisService
  const originalRedisUrl = process.env.REDIS_URL

  beforeAll(() => {
    process.env.REDIS_URL = redisUrl
    first = new RedisService()
    second = new RedisService()
  })

  afterAll(async () => {
    await Promise.all([
      first.onApplicationShutdown(),
      second.onApplicationShutdown(),
    ])
    if (originalRedisUrl === undefined) {
      delete process.env.REDIS_URL
    } else {
      process.env.REDIS_URL = originalRedisUrl
    }
  })

  it("shares a rate-limit bucket across service instances", async () => {
    const key = `redis-e2e-${randomUUID()}`

    await expect(
      first.increment(key, 10_000, 2, 10_000, "integration"),
    ).resolves.toMatchObject({ totalHits: 1, isBlocked: false })
    await expect(
      second.increment(key, 10_000, 2, 10_000, "integration"),
    ).resolves.toMatchObject({ totalHits: 2, isBlocked: false })
    await expect(
      first.increment(key, 10_000, 2, 10_000, "integration"),
    ).resolves.toMatchObject({ totalHits: 3, isBlocked: true })
  })
})

describeWithRedis("Redis domain cache (e2e)", () => {
  let first: CacheService
  let second: CacheService
  const originalRedisUrl = process.env.REDIS_URL

  beforeAll(() => {
    process.env.REDIS_URL = redisUrl
    first = new CacheService(new RedisService())
    second = new CacheService(new RedisService())
  })

  afterAll(async () => {
    await first.clear()
    if (originalRedisUrl === undefined) {
      delete process.env.REDIS_URL
    } else {
      process.env.REDIS_URL = originalRedisUrl
    }
  })

  it("shares entries across instances and revives Dates", async () => {
    const key = `e2e-cache-${randomUUID()}`
    const value = { at: new Date("2026-03-04T05:06:07.000Z"), n: 1 }

    await first.set(key, value, 60_000)
    const seen = await second.get<{ at: Date; n: number }>(key)
    expect(seen).toEqual(value)
    expect(seen?.at).toBeInstanceOf(Date)
  })

  it("invalidates a prefix across instances", async () => {
    const prefix = `e2e-prefix-${randomUUID()}`
    await first.set(`${prefix}:a`, { n: 1 }, 60_000)
    await second.invalidatePrefix(prefix)
    await expect(first.get(`${prefix}:a`)).resolves.toBeUndefined()
  })
})
