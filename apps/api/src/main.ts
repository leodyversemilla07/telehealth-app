import { existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { ValidationPipe } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import express from "express"
import { AppModule } from "@/app.module"
import { PhtDateInterceptor } from "@/common/interceptors/pht-date.interceptor"
import { setupSwagger } from "@/config/swagger.config"

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  })

  // Ensure uploads directory exists
  const uploadsDir = join(process.cwd(), "uploads")
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true })
  }
  app.use("/uploads", express.static(uploadsDir))

  // ── PHT Date Interceptor ─────────────────────────────────────────────
  // SRS §5.1 & Appendix D: "All times displayed in Philippine Standard Time (UTC+8)"
  // Converts all Date fields in API responses to PHT-formatted strings.
  app.useGlobalInterceptors(new PhtDateInterceptor())

  // Restrict CORS origins with secure credential handshakes
  const rawCorsOrigins =
    process.env.CORS_ORIGIN ?? "http://localhost:3000,http://localhost:3001"
  const allowedOrigins = rawCorsOrigins.split(",")

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (like mobile apps, curl, or internal server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
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
    }),
  )

  // Swagger / OpenAPI docs
  if (process.env.NODE_ENV !== "production") {
    setupSwagger(app)
  }

  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
