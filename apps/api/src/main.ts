// Load the workspace-root .env before ANY other module: AppModule (via
// @thallesp/nestjs-better-auth) pulls better-auth's module graph in first,
// which caches NODE_ENV at module scope — if env isn't loaded yet, isProduction
// is frozen false and the auth rate limiter silently stays disabled. The load
// entry walks up to the repo root and merges .env + .env.local into process.env
// at import time, so it must be the first import in this file.
import "@telehealth/env/load"
import { existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { Logger, ValidationPipe } from "@nestjs/common"
import { NestFactory, Reflector } from "@nestjs/core"
import type { NextFunction, Request, Response } from "express"
import express from "express"
import helmet from "helmet"
import { Server as SocketIOServer } from "socket.io"
import { AppModule } from "./app.module"
import { auth } from "./auth/auth"
import { HttpExceptionFilter } from "./common/filters/http-exception.filter"
import { PhtDateInterceptor } from "./common/interceptors/pht-date.interceptor"
import { RequestIdInterceptor } from "./common/interceptors/request-id.interceptor"
import { Require2FaInterceptor } from "./common/interceptors/require-2fa.interceptor"
import { authorizeUploadsKey } from "./common/middleware/uploads-gate"
import { setupSwagger } from "./config/swagger.config"
import { SocketService } from "./notifications/socket.service"
import { PrismaService } from "./prisma/prisma.service"
import { StorageService } from "./storage/storage.service"

async function bootstrap() {
  const logger = new Logger("Bootstrap")
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    bufferLogs: true,
  })

  // Root health check endpoint (ALB health check requires this at /, not /api)
  app
    .getHttpAdapter()
    .getInstance()
    .get("/", (_req: Request, res: Response) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() })
    })

  // Enforce API route namespacing
  app.setGlobalPrefix("api")

  // Enable shutdown hooks to prevent database pool leaks on SIGTERM/SIGINT
  app.enableShutdownHooks()

  // Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.)
  // The LiveKit client SDK connects straight to the LiveKit server, so its
  // explicit origin must appear in connect-src — no wildcard schemes.
  const livekitCspOrigin = (() => {
    try {
      return new URL(process.env.LIVEKIT_URL ?? "").origin
    } catch {
      return null
    }
  })()
  app.use(
    helmet({
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: [
            "'self'",
            ...(livekitCspOrigin ? [livekitCspOrigin] : []),
          ],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameSrc: ["'self'"],
        },
      },
    }),
  )

  // Apply standardized exception formatting globally
  app.useGlobalFilters(new HttpExceptionFilter())

  // Ensure uploads directory exists
  const uploadsDir = join(process.cwd(), "uploads")
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true })
  }

  // In production, uploaded files live in a PRIVATE S3 bucket. Stream them
  // through the API at the same /uploads/:key path so stored URLs stay stable
  // (DB values are unchanged) and objects never get a public URL.
  //
  // ORDER MATTERS: this middleware runs BEFORE express.static so the auth gate
  // applies to every non-avatar key in ALL storage modes. A public static
  // mount first would serve on-disk medical files (LocalStorage/dev) with no
  // authentication — the LocalStorage read below handles avatars fine, and
  // express.static remains mounted as a 404 fallback for legacy flat files.
  const storageService = app.get(StorageService)
  const prismaService = app.get(PrismaService)
  app.use(
    "/uploads/:key",
    async (req: Request, res: Response, next: NextFunction) => {
      const keyParam = req.params.key
      const key = Array.isArray(keyParam) ? keyParam[0] : keyParam
      // Keys are server-generated (avatar-<userId>-<timestamp>); block traversal anyway.
      if (!key || key.includes("..") || key.includes("/")) {
        res.status(400).end()
        return
      }
      // Avatar keys are public (served on public doctor cards). Anything else
      // requires a valid authenticated session AND ownership of the document:
      // the patient of the appointment, the assigned doctor, or an admin.
      // (Keys are unguessable, but a leaked URL must not grant any signed-in
      // user read access — mirror DocumentsService.assertAppointmentAccess.)
      let sessionUser: { id: string; role?: string | null } | undefined
      if (!key.startsWith("avatar-")) {
        const authHeader = req.headers.authorization
        const session = authHeader?.startsWith("Bearer ")
          ? await auth.api.getSession({
              headers: new Headers({ authorization: authHeader }),
            })
          : req.headers.cookie
            ? await auth.api.getSession({
                headers: new Headers({ cookie: req.headers.cookie }),
              })
            : null
        if (!session?.user) {
          res.status(401).end()
          return
        }
        sessionUser = session.user

        const decision = await authorizeUploadsKey(
          prismaService,
          sessionUser,
          key,
        )
        if (!decision.allow) {
          if (decision.reason === "not-found") {
            next() // unknown key → standard 404 handling
            return
          }
          res.status(403).end()
          return
        }
      }
      try {
        const file = await storageService.read(key)
        if (!file) {
          next() // not found → standard 404 handling
          return
        }
        res.setHeader("Content-Type", file.contentType)
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable")
        res.send(file.data)
      } catch (err) {
        next(err)
      }
    },
  )
  // Last-resort dev fallback for files that predate the key scheme (flat
  // files under /uploads never hit by the :key route).
  app.use("/uploads", express.static(uploadsDir))

  // ── Request ID Interceptor ────────────────────────────────────────────
  // Generates unique request IDs for end-to-end tracing and logging.
  app.useGlobalInterceptors(new RequestIdInterceptor())

  // ── REST 2FA Interceptor ─────────────────────────────────────────────
  // Mirrors the tRPC RolesMiddleware rule: privileged roles (DOCTOR/ADMIN)
  // must have 2FA enabled before hitting admin/privileged-only REST routes.
  app.useGlobalInterceptors(new Require2FaInterceptor(app.get(Reflector)))

  // ── PHT Date Interceptor ─────────────────────────────────────────────
  // SRS §5.1 & Appendix D: "All times displayed in Philippine Standard Time (UTC+8)"
  // Converts all Date fields in API responses to PHT-formatted strings.
  app.useGlobalInterceptors(new PhtDateInterceptor())

  // Restrict CORS origins with secure credential handshakes
  const rawCorsOrigins =
    process.env.CORS_ORIGIN ?? "http://localhost:3000,http://localhost:3001"
  const allowedOrigins = rawCorsOrigins.split(",").map((o) => o.trim())

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (like mobile apps, curl, or internal server-to-server)
      if (!origin) {
        callback(null, true)
        return
      }
      // Check exact match
      const isAllowed = allowedOrigins.some((allowed) => origin === allowed)
      if (isAllowed) {
        callback(null, true)
      } else {
        callback(new Error(`Origin "${origin}" not allowed by CORS`))
      }
    },
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  // Swagger / OpenAPI docs
  if (process.env.NODE_ENV !== "production") {
    setupSwagger(app)
  }

  const server = app.getHttpServer()

  // Set up socket.io directly on the Express HTTP server
  // This bypasses setGlobalPrefix("api") which would otherwise prefix /socket.io
  const socketCorsOrigins =
    process.env.CORS_ORIGIN ?? "http://localhost:3000,http://localhost:3001"
  const socketAllowedOrigins = socketCorsOrigins.split(",").map((o) => o.trim())

  const io = new SocketIOServer(server, {
    path: "/socket.io",
    cors: {
      origin: (origin, callback) => {
        if (!origin || socketAllowedOrigins.some((o) => origin === o)) {
          callback(null, true)
        } else {
          callback(new Error("Not allowed by CORS"))
        }
      },
      credentials: true,
    },
  })

  io.on("connection", async (socket) => {
    const token = socket.handshake.auth?.token as string | undefined
    const cookie = socket.handshake.headers.cookie

    let session: { user: { id: string } } | null = null
    if (token) {
      session = await auth.api.getSession({
        headers: new Headers({ authorization: `Bearer ${token}` }),
      })
    } else if (cookie) {
      session = await auth.api.getSession({
        headers: new Headers({ cookie }),
      })
    }

    if (!session?.user?.id) {
      socket.disconnect(true)
      return
    }

    socket.data.userId = session.user.id
    socket.join(session.user.id)
    logger.log(
      `[Socket] Client connected: ${socket.id} (user: ${session.user.id})`,
    )

    socket.on("disconnect", () => {
      logger.log(`[Socket] Client disconnected: ${socket.id}`)
    })

    socket.on("join", () => {
      socket.join(session?.user.id)
    })
  })

  // Make io accessible from other modules via SocketService
  const socketService = app.get(SocketService)
  socketService.setServer(io)

  logger.log(`Server running on port ${process.env.PORT ?? 3001}`)
  await app.listen(process.env.PORT ?? 3001)
}
bootstrap()
