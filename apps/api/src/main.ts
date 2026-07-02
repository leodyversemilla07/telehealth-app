import { existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { Logger, ValidationPipe, VersioningType } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import type { Request, Response } from "express"
import express from "express"
import helmet from "helmet"
import { Server as SocketIOServer } from "socket.io"
import { AppModule } from "./app.module"
import { auth } from "./auth/auth"
import { HttpExceptionFilter } from "./common/filters/http-exception.filter"
import { PhtDateInterceptor } from "./common/interceptors/pht-date.interceptor"
import { RequestIdInterceptor } from "./common/interceptors/request-id.interceptor"
import { setupSwagger } from "./config/swagger.config"
import { SocketService } from "./notifications/socket.service"

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

  // API versioning — enables /api/v1/* routes for future breaking changes
  // Current endpoints remain at /api/* for backwards compatibility
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
    prefix: "v",
  })

  // Enable shutdown hooks to prevent database pool leaks on SIGTERM/SIGINT
  app.enableShutdownHooks()

  // Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.)
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
          connectSrc: ["'self'", "wss:", "https:"],
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
  app.use("/uploads", express.static(uploadsDir))

  // ── Request ID Interceptor ────────────────────────────────────────────
  // Generates unique request IDs for end-to-end tracing and logging.
  app.useGlobalInterceptors(new RequestIdInterceptor())

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
