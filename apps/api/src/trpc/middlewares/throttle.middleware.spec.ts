import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals"
import type { MiddlewareOptions, MiddlewareResponse } from "nestjs-trpc"
import { ThrottleMiddleware } from "./throttle.middleware"

function opts(
  ip?: string,
  headers?: Record<string, unknown>,
  path = "appointments.create",
): MiddlewareOptions {
  return {
    path,
    ctx: { req: { ip, headers } },
    next: async () => ({ ok: true }) as MiddlewareResponse,
  } as unknown as MiddlewareOptions
}

describe("ThrottleMiddleware", () => {
  let middleware: ThrottleMiddleware

  beforeEach(() => {
    delete process.env.THROTTLE_LIMIT
    middleware = new ThrottleMiddleware()
  })

  afterEach(() => {
    jest.useRealTimers()
    delete process.env.THROTTLE_LIMIT
  })

  it("allows requests under the limit", async () => {
    for (let i = 0; i < 29; i++) {
      await expect(
        middleware.use(opts("1.2.3.4", {}, "procedures.list")),
      ).resolves.toMatchObject({ ok: true })
    }
  })

  it("rejects the request over the per-window limit", async () => {
    for (let i = 0; i < 30; i++) {
      await middleware.use(opts("1.2.3.4", {}, "p.x"))
    }
    await expect(
      middleware.use(opts("1.2.3.4", {}, "p.x")),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" })
  })

  it("keys windows separately per procedure and per IP", async () => {
    for (let i = 0; i < 30; i++) {
      await middleware.use(opts("1.2.3.4", {}, "p.a"))
    }
    await expect(
      middleware.use(opts("1.2.3.4", {}, "p.b")),
    ).resolves.toMatchObject({ ok: true })
    await expect(
      middleware.use(opts("5.6.7.8", {}, "p.a")),
    ).resolves.toMatchObject({ ok: true })
  })

  it("resets the window after the TTL elapses", async () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date("2026-01-01T00:00:00Z"))
    for (let i = 0; i < 30; i++) {
      await middleware.use(opts("1.2.3.4", {}, "p.a"))
    }
    await expect(
      middleware.use(opts("1.2.3.4", {}, "p.a")),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" })

    // TTL (60s) expired and the 30s sweep also ran.
    jest.setSystemTime(new Date("2026-01-01T00:01:31Z"))
    await expect(
      middleware.use(opts("1.2.3.4", {}, "p.a")),
    ).resolves.toMatchObject({ ok: true })
  })

  it("honors THROTTLE_LIMIT from the environment", async () => {
    process.env.THROTTLE_LIMIT = "2"
    middleware = new ThrottleMiddleware()
    await middleware.use(opts("1.2.3.4", {}, "p.a"))
    await middleware.use(opts("1.2.3.4", {}, "p.a"))
    await expect(
      middleware.use(opts("1.2.3.4", {}, "p.a")),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" })
  })

  it("buckets by the LAST x-forwarded-for hop, not the spoofable first", async () => {
    const headers = {
      "x-forwarded-for": "203.0.113.99, 100.64.0.1",
      "x-real-ip": "100.64.0.1",
    }
    for (let i = 0; i < 30; i++) {
      await middleware.use(opts(undefined, headers, "p.a"))
    }
    await expect(
      middleware.use(opts(undefined, headers, "p.a")),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" })

    // The same spoofed first hop with a DIFFERENT trusted last hop is a
    // different bucket and still allowed.
    const other = { "x-forwarded-for": "203.0.113.99, 198.51.100.1" }
    await expect(
      middleware.use(opts(undefined, other, "p.a")),
    ).resolves.toMatchObject({ ok: true })
  })

  it("prefers cf-connecting-ip, then x-real-ip, then the socket address", async () => {
    const cf = new ThrottleMiddleware()
    for (let i = 0; i < 30; i++) {
      await cf.use(
        opts(
          "203.0.113.1",
          {
            "cf-connecting-ip": "198.51.100.7",
            "x-forwarded-for": "1.1.1.1,2.2.2.2",
          },
          "p.a",
        ),
      )
    }
    await expect(
      cf.use(
        opts("203.0.113.1", { "cf-connecting-ip": "198.51.100.7" }, "p.a"),
      ),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" })

    const real = new ThrottleMiddleware()
    for (let i = 0; i < 30; i++) {
      await real.use(opts(undefined, { "x-real-ip": "100.64.0.9" }, "p.b"))
    }
    await expect(
      real.use(opts(undefined, { "x-real-ip": "100.64.0.9" }, "p.b")),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" })

    const socket = new ThrottleMiddleware()
    for (let i = 0; i < 30; i++) {
      await socket.use(opts("172.17.0.2", undefined, "p.c"))
    }
    await expect(
      socket.use(opts("172.17.0.2", undefined, "p.c")),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" })
  })

  it("prunes expired entries so the map stays bounded", async () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date("2026-01-01T00:00:00Z"))
    const m = new ThrottleMiddleware()
    await m.use(opts("1.1.1.1", {}, "p.a"))
    await m.use(opts("2.2.2.2", {}, "p.b"))
    const windows = (m as unknown as { windows: Map<string, unknown> }).windows
    expect(windows.size).toBe(2)

    // 91s later: both entries expired, sweep ran during this call.
    jest.setSystemTime(new Date("2026-01-01T00:01:31Z"))
    await m.use(opts("3.3.3.3", {}, "p.c"))
    expect(windows.size).toBe(1)
  })
})
