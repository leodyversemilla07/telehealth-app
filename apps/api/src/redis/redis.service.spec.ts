import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals"
import { RedisService } from "./redis.service"

const originalRedisUrl = process.env.REDIS_URL

describe("RedisService in-memory fallback", () => {
  let service: RedisService

  beforeEach(() => {
    delete process.env.REDIS_URL
    service = new RedisService()
  })

  afterEach(async () => {
    jest.useRealTimers()
    await service.onApplicationShutdown()
    if (originalRedisUrl === undefined) {
      delete process.env.REDIS_URL
    } else {
      process.env.REDIS_URL = originalRedisUrl
    }
  })

  it("uses the local fallback only when Redis is not configured", () => {
    expect(service.configured).toBe(false)
  })

  it("blocks requests over the limit and reports a retry window", async () => {
    await expect(
      service.increment("client", 60_000, 2, 60_000, "rest"),
    ).resolves.toMatchObject({ totalHits: 1, isBlocked: false })
    await expect(
      service.increment("client", 60_000, 2, 60_000, "rest"),
    ).resolves.toMatchObject({ totalHits: 2, isBlocked: false })

    const blocked = await service.increment("client", 60_000, 2, 60_000, "rest")
    expect(blocked).toMatchObject({ totalHits: 3, isBlocked: true })
    expect(blocked.timeToBlockExpire).toBeGreaterThan(0)
  })

  it("separates throttler namespaces and hashes raw client keys", async () => {
    await service.increment("patient-ip:records.list", 60_000, 1, 60_000, "a")
    await expect(
      service.increment("patient-ip:records.list", 60_000, 1, 60_000, "b"),
    ).resolves.toMatchObject({ totalHits: 1, isBlocked: false })

    const windows = (
      service as unknown as { memoryWindows: Map<string, unknown> }
    ).memoryWindows
    expect(windows.size).toBe(2)
    expect(
      [...windows.keys()].every((key) => !key.includes("patient-ip")),
    ).toBe(true)
  })

  it("allows a fresh window after expiry", async () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date("2026-01-01T00:00:00Z"))
    await service.increment("client", 1_000, 1, 1_000, "rest")
    await expect(
      service.increment("client", 1_000, 1, 1_000, "rest"),
    ).resolves.toMatchObject({ isBlocked: true })

    jest.setSystemTime(new Date("2026-01-01T00:00:02Z"))
    await expect(
      service.increment("client", 1_000, 1, 1_000, "rest"),
    ).resolves.toMatchObject({ totalHits: 1, isBlocked: false })
  })

  it("does not attach a distributed socket adapter without REDIS_URL", async () => {
    const server = { adapter: jest.fn() }
    await expect(service.configureSocketIo(server as never)).resolves.toBe(
      false,
    )
    expect(server.adapter).not.toHaveBeenCalled()
  })
})
