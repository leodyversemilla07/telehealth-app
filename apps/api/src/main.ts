// Load the workspace-root .env before ANY other module: AppModule (via
// @thallesp/nestjs-better-auth) pulls better-auth's module graph in first,
// which caches NODE_ENV at module scope — if env isn't loaded yet, isProduction
// is frozen false and the auth rate limiter silently stays disabled. The load
// entry walks up to the repo root and merges .env + .env.local into process.env
// at import time, so it must be the first import in this file.
import "@telehealth/env/load"
import { Logger } from "@nestjs/common"
import { createApp } from "./create-app"

async function bootstrap() {
  const logger = new Logger("Bootstrap")
  const { app } = await createApp()

  logger.log(`Server running on port ${process.env.PORT ?? 3001}`)
  await app.listen(process.env.PORT ?? 3001)
}
bootstrap()
