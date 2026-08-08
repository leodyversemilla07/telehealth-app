import { Logger } from "@nestjs/common"
import {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express"

// ── Module-level doubles (mock-prefixed so jest.mock factories close over them) ──
const mockRouteHandlers: Array<(req: Request, res: Response) => void> = []
const mockMiddleware: unknown[][] = []
const mockSocketHandlers: Record<string, (socket: unknown) => void> = {}
const mockHelmetOpts: unknown[] = []
const mockCorsOrigins: Array<
  (
    origin: string | undefined,
    cb: (e: Error | null, ok?: boolean) => void,
  ) => void
> = []

const mockHttpServer = { __mockServer: true }
const mockGetSession = jest.fn()
const mockStorageRead = jest.fn()
const mockSocketSetServer = jest.fn()

const mockExpress = {
  get: ((path: string, handler: (req: Request, res: Response) => void) => {
    if (path === "/") {
      mockRouteHandlers.push(handler)
    }
    return mockExpress
  }) as unknown as Express["get"],
  use: jest.fn() as unknown as Express["use"],
} as Express

const mockApp = {
  getHttpAdapter: () => ({ getInstance: () => mockExpress }),
  setGlobalPrefix: jest.fn(),
  enableShutdownHooks: jest.fn(),
  getHttpServer: () => mockHttpServer,
  use: jest.fn((...args: unknown[]) => {
    mockMiddleware.push(args)
  }),
  useGlobalFilters: jest.fn(),
  useGlobalInterceptors: jest.fn(),
  enableCors: jest.fn(
    (opts: {
      origin: (
        o: string | undefined,
        cb: (e: Error | null, ok?: boolean) => void,
      ) => void
    }) => {
      mockCorsOrigins.push(opts.origin)
    },
  ),
  useGlobalPipes: jest.fn(),
  get: jest.fn((token: unknown) => {
    const name = (token as { name?: string } | undefined)?.name
    if (name === "SocketService") return { setServer: mockSocketSetServer }
    if (name === "StorageService") return { read: mockStorageRead }
    return undefined
  }),
  listen: jest.fn().mockResolvedValue(undefined),
}

const mockCreate = jest.fn().mockResolvedValue(mockApp)

// ── jest.mock factories (hoisted above all imports by babel-plugin-jest) ──
jest.mock("@nestjs/core", () => ({
  NestFactory: { create: mockCreate },
}))
jest.mock("@telehealth/env/load", () => ({}))
jest.mock("./app.module", () => ({ AppModule: {} }))
jest.mock("./auth/auth", () => ({
  auth: { api: { getSession: mockGetSession } },
}))
jest.mock("./config/swagger.config", () => ({ setupSwagger: jest.fn() }))
jest.mock("./notifications/socket.service", () => ({
  SocketService: class {},
}))
jest.mock("./storage/storage.service", () => ({
  StorageService: class {},
}))
jest.mock("socket.io", () => ({
  Server: class {
    on(event: string, handler: (socket: unknown) => void) {
      mockSocketHandlers[event] = handler
    }
  },
}))
jest.mock("helmet", () => ({
  __esModule: true,
  default: (opts: unknown) => {
    mockHelmetOpts.push(opts)
    return jest.fn()
  },
}))

import { auth } from "./auth/auth"
import { setupSwagger } from "./config/swagger.config"
import "./main"

// ── helpers ────────────────────────────────────────────────────────────────

async function bootAndFlush() {
  jest.isolateModules(() => void require("./main"))
  // bootstrap() is async: let the create() promise chain settle
  await new Promise((resolve) => setTimeout(resolve, 0))
  await new Promise((resolve) => setImmediate(resolve))
}

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    setHeader: jest.fn(),
    send: jest.fn(),
    end: jest.fn(),
  }
}

function makeReq(overrides: Record<string, unknown> = {}) {
  return {
    params: {},
    headers: {},
    ...overrides,
  } as unknown as Request
}

function makeSocket(partial: { token?: string; cookie?: string } = {}) {
  const socket = {
    handshake: {
      auth: partial.token ? { token: partial.token } : {},
      headers: {},
    },
    data: {} as Record<string, unknown>,
    on: jest.fn(),
    join: jest.fn(),
    disconnect: jest.fn(),
  }
  if (partial.cookie) {
    socket.handshake.headers.cookie = partial.cookie
  }
  return socket
}

function uploadsHandler(): (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void> {
  const found = mockMiddleware.find((args) => args[0] === "/uploads/:key")
  return found?.[1] as (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void>
}

const originalEnv: Record<string, string | undefined> = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  LIVEKIT_URL: process.env.LIVEKIT_URL,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
}

// ── spec ───────────────────────────────────────────────────────────────────

describe("main bootstrap", () => {
  beforeAll(() => {
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined)
  })

  afterAll(() => {
    jest.restoreAllMocks()
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  })

  beforeEach(async () => {
    process.env.NODE_ENV = "development"
    process.env.PORT = "3101"
    delete process.env.LIVEKIT_URL
    jest.clearAllMocks()
    mockMiddleware.length = 0
    mockRouteHandlers.length = 0
    mockHelmetOpts.length = 0
    mockCorsOrigins.length = 0
    delete mockSocketHandlers.connection
    await bootAndFlush()
  })

  it("creates the Nest app without a body parser but with buffered logs", () => {
    expect(mockCreate).toHaveBeenCalledWith(expect.anything(), {
      bodyParser: false,
      bufferLogs: true,
    })
  })

  it("registers the health route at / for ALB checks", () => {
    const res = makeRes()
    mockRouteHandlers[0]({} as Request, res as unknown as Response)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "ok" }),
    )
  })

  it("registers global prefix, shutdown hooks, filters, interceptors and pipes", () => {
    expect(mockApp.setGlobalPrefix).toHaveBeenCalledWith("api")
    expect(mockApp.enableShutdownHooks).toHaveBeenCalled()
    expect(mockApp.useGlobalFilters).toHaveBeenCalledTimes(1)
    expect(mockApp.useGlobalInterceptors).toHaveBeenCalledTimes(2)
    expect(mockApp.useGlobalPipes).toHaveBeenCalledTimes(1)
  })

  it("serves local uploads statically and mounts the streaming middleware", () => {
    expect(mockMiddleware.some((args) => args[0] === "/uploads")).toBe(true)
    expect(mockMiddleware.some((args) => args[0] === "/uploads/:key")).toBe(
      true,
    )
  })

  it("enables CORS for no-origin and allowed origins, rejects others", () => {
    const origin = mockCorsOrigins[0]
    const cb = jest.fn()
    origin(undefined, cb)
    expect(cb).toHaveBeenCalledWith(null, true)
    origin("http://localhost:3001", cb)
    expect(cb).toHaveBeenCalledWith(null, true)
    origin("http://evil.example.com", cb)
    expect(cb).toHaveBeenCalledWith(expect.any(Error))
  })

  it("applies helmet with HSTS preload and safe CSP defaults", () => {
    const opts = mockHelmetOpts[0] as {
      hsts: { preload: boolean; includeSubDomains: boolean }
      contentSecurityPolicy: { directives: { connectSrc: string[] } }
    }
    expect(opts.hsts.preload).toBe(true)
    expect(opts.hsts.includeSubDomains).toBe(true)
    expect(opts.contentSecurityPolicy.directives.connectSrc).toEqual(["'self'"])
  })

  it("adds the LiveKit origin to connect-src when LIVEKIT_URL is set", async () => {
    mockHelmetOpts.length = 0
    process.env.LIVEKIT_URL = "https://livekit.example.com"
    await bootAndFlush()
    const opts = mockHelmetOpts[0] as {
      contentSecurityPolicy: { directives: { connectSrc: string[] } }
    }
    expect(opts.contentSecurityPolicy.directives.connectSrc).toContain(
      "https://livekit.example.com",
    )
  })

  it("tolerates an invalid LIVEKIT_URL", async () => {
    mockHelmetOpts.length = 0
    process.env.LIVEKIT_URL = "not a valid url"
    await bootAndFlush()
    const opts = mockHelmetOpts[0] as {
      contentSecurityPolicy: { directives: { connectSrc: string[] } }
    }
    expect(opts.contentSecurityPolicy.directives.connectSrc).toEqual(["'self'"])
  })

  it("skips Swagger in production", async () => {
    jest.clearAllMocks()
    process.env.NODE_ENV = "production"
    await bootAndFlush()
    expect(setupSwagger).not.toHaveBeenCalled()
  })

  it("listens on the configured PORT", async () => {
    expect(mockApp.listen).toHaveBeenCalledWith("3101")
  })

  // ── /uploads/:key streaming middleware ───────────────────────────────────

  it("rejects keys with traversal", async () => {
    const res = makeRes()
    await uploadsHandler()(
      makeReq({ params: { key: "../etc/passwd" } }),
      res as unknown as Response,
      jest.fn() as never,
    )
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.end).toHaveBeenCalled()
  })

  it("rejects keys containing slashes", async () => {
    const res = makeRes()
    await uploadsHandler()(
      makeReq({ params: { key: "a/b" } }),
      res as unknown as Response,
      jest.fn() as never,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it("streams public avatar keys without a session", async () => {
    mockStorageRead.mockResolvedValue({
      data: Buffer.from("bytes"),
      contentType: "image/jpeg",
    })
    const res = makeRes()
    await uploadsHandler()(
      makeReq({ params: { key: "avatar-u-1.jpg" } }),
      res as unknown as Response,
      jest.fn() as never,
    )
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/jpeg")
    expect(res.send).toHaveBeenCalledWith(Buffer.from("bytes"))
  })

  it("401s non-avatar keys without credentials", async () => {
    ;(auth.api.getSession as jest.Mock).mockResolvedValue(null)
    const res = makeRes()
    await uploadsHandler()(
      makeReq({ params: { key: "report-1.pdf" } }),
      res as unknown as Response,
      jest.fn() as never,
    )
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.end).toHaveBeenCalled()
  })

  it("authenticates non-avatar keys via bearer token", async () => {
    ;(auth.api.getSession as jest.Mock).mockResolvedValue({
      user: { id: "u1" },
    })
    mockStorageRead.mockResolvedValue({
      data: Buffer.from("private"),
      contentType: "application/pdf",
    })
    const res = makeRes()
    await uploadsHandler()(
      makeReq({
        params: { key: "report-1.pdf" },
        headers: { authorization: "Bearer tok123" },
      }),
      res as unknown as Response,
      jest.fn() as never,
    )
    expect(res.send).toHaveBeenCalledWith(Buffer.from("private"))
  })

  it("authenticates non-avatar keys via session cookie", async () => {
    ;(auth.api.getSession as jest.Mock).mockResolvedValue({
      user: { id: "u1" },
    })
    mockStorageRead.mockResolvedValue({
      data: Buffer.from("private"),
      contentType: "application/pdf",
    })
    const res = makeRes()
    await uploadsHandler()(
      makeReq({
        params: { key: "report-1.pdf" },
        headers: { cookie: "session=abc; Path=/" },
      }),
      res as unknown as Response,
      jest.fn() as never,
    )
    expect(res.send).toHaveBeenCalledWith(Buffer.from("private"))
  })

  it("falls through to the 404 path when the object is missing", async () => {
    mockStorageRead.mockResolvedValue(null)
    const next = jest.fn()
    const res = makeRes()
    await uploadsHandler()(
      makeReq({ params: { key: "avatar-u-1.jpg" } }),
      res as unknown as Response,
      next as never,
    )
    expect(next).toHaveBeenCalled()
    expect(res.send).not.toHaveBeenCalled()
  })

  it("forwards storage errors to the error middleware", async () => {
    mockStorageRead.mockRejectedValue(new Error("s3 down"))
    const next = jest.fn()
    const res = makeRes()
    await uploadsHandler()(
      makeReq({ params: { key: "avatar-u-1.jpg" } }),
      res as unknown as Response,
      next as never,
    )
    expect(next).toHaveBeenCalledWith(new Error("s3 down"))
  })

  // ── socket.io wiring ─────────────────────────────────────────────────────

  it("wire socket.io and shares the server with SocketService", () => {
    expect(typeof mockSocketHandlers.connection).toBe("function")
    expect(mockSocketSetServer).toHaveBeenCalled()
  })

  it("disconnects sockets without a session", () => {
    ;(auth.api.getSession as jest.Mock).mockResolvedValue(null)
    mockSocketHandlers.connection(makeSocket())
    const socket = makeSocket()
    mockSocketHandlers.connection(socket)
    expect(socket.disconnect).toHaveBeenCalledWith(true)
  })

  it("joins sockets authenticated via bearer token", async () => {
    ;(auth.api.getSession as jest.Mock).mockResolvedValue({
      user: { id: "user-tok" },
    })
    const socket = makeSocket({ token: "tok123" })
    await mockSocketHandlers.connection(socket)
    expect(socket.data.userId).toBe("user-tok")
    expect(socket.join).toHaveBeenCalledWith("user-tok")
    expect(socket.on).toHaveBeenCalledWith("disconnect", expect.any(Function))
    expect(socket.on).toHaveBeenCalledWith("join", expect.any(Function))
  })

  it("authenticates via session cookie when no token is present", async () => {
    ;(auth.api.getSession as jest.Mock).mockResolvedValue({
      user: { id: "user-cookie" },
    })
    const socket = makeSocket({ cookie: "session=abc; Path=/" })
    await mockSocketHandlers.connection(socket)
    expect(socket.data.userId).toBe("user-cookie")
    expect(socket.join).toHaveBeenCalledWith("user-cookie")
  })
})
