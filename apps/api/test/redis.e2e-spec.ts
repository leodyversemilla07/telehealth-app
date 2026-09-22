import { randomUUID } from "node:crypto"
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
