import { Logger } from "@nestjs/common"
import { z } from "zod"

const logger = new Logger("Config")

export const envSchema = z.object({
  // ── Database ──────────────────────────────────────────────────────────────
  DATABASE_URL: z
    .string({
      error: "DATABASE_URL is required",
    })
    .min(1, "DATABASE_URL must not be empty"),

  // ── Server ────────────────────────────────────────────────────────────────
  PORT: z.coerce.number().min(1).max(65535).default(3001),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // ── Raw overrides (read directly via process.env, validated here for
  //    fail-fast on bad values; the consumers apply their own defaults) ──────
  THROTTLE_LIMIT: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .describe("optional override; throttler.config.ts defaults to 30"),
  CANCELLATION_WINDOW_HOURS: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .describe("optional override; appointments.service.ts defaults to 24"),

  // ── Better Auth ───────────────────────────────────────────────────────────
  BETTER_AUTH_SECRET: z
    .string({
      error: "BETTER_AUTH_SECRET is required",
    })
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.string().optional().default("http://localhost:3001"),

  // ── Session cookie domain (production, cross-subdomain) ───────────────────
  COOKIE_DOMAIN: z
    .string()
    .optional()
    .describe("session cookie domain in production (e.g. .tele-health.app)"),

  // ── Social / OAuth login (optional; each provider only enabled when both
  //    credentials are present — see coherence check in validate()) ──────────
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_CLIENT_SECRET: z.string().optional(),
  APPLE_REDIRECT_URI: z.string().url().optional(),

  // ── CORS ──────────────────────────────────────────────────────────────────
  CORS_ORIGIN: z
    .string()
    .optional()
    .default("http://localhost:3000,http://localhost:3001"),

  // ── Object Storage (S3-compatible, optional) ───────────────────────────────
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),

  // ── Email (Resend SDK — required in production) ──────────────────────────
  RESEND_API_KEY: z
    .string()
    .min(
      1,
      "RESEND_API_KEY is required for password resets and email verification",
    )
    .optional(),
  EMAIL_FROM: z.string().optional(),

  // ── LiveKit (required in production) ───────────────────────────────────────
  LIVEKIT_URL: z
    .string()
    .url("LIVEKIT_URL must be a valid URL")
    .optional()
    .default("wss://localhost:7881"),
  LIVEKIT_API_KEY: z
    .string()
    .min(1, "LIVEKIT_API_KEY is required for video consultations")
    .optional(),
  LIVEKIT_API_SECRET: z
    .string()
    .min(1, "LIVEKIT_API_SECRET is required for video consultations")
    .optional(),

  // ── AI Recommendations (optional; endpoint returns 503 when absent) ───────
  NIM_API_KEY: z.string().optional(),

  // ── Web Push (VAPID) ─────────────────────────────────────────────────────
  // Generate once: node -e "const wp=require('web-push');const k=wp.generateVAPIDKeys();console.log(JSON.stringify(k))"
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional().default("mailto:admin@telehealth.app"),

  // ── Session ──────────────────────────────────────────────────────────────
  SESSION_EXPIRY_SECONDS: z.coerce
    .number()
    .min(300)
    .max(2592000)
    .default(604800),

  // ── Data Retention (optional; defaults below) ──────────────────────────────
  RETENTION_NOTIFICATIONS_DAYS: z.coerce.number().min(1).default(90),
  RETENTION_SECURITY_ALERTS_DAYS: z.coerce.number().min(1).default(730),
  RETENTION_AUDIT_LOGS_DAYS: z.coerce.number().min(1).default(2555),
})

export type Env = z.infer<typeof envSchema>

export function validate(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config)
  if (!result.success) {
    logger.error("Invalid API Environment Configuration:")
    logger.error(JSON.stringify(result.error.format(), null, 2))
    throw new Error("Invalid API Environment Configuration")
  }

  const env = result.data

  // Enforce production-required vars
  if (env.NODE_ENV === "production") {
    const missing: string[] = []
    if (!env.RESEND_API_KEY) missing.push("RESEND_API_KEY")
    if (!env.LIVEKIT_API_KEY) missing.push("LIVEKIT_API_KEY")
    if (!env.LIVEKIT_API_SECRET) missing.push("LIVEKIT_API_SECRET")
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables in production: ${missing.join(", ")}`,
      )
    }
  }

  // OAuth coherence: a partially-configured provider is silently ignored by
  // the auth config (both keys must be present), so fail fast on a bad setup
  // rather than shipping a provider that never activates.
  const brokenOAuth: string[] = []
  if (!!env.GOOGLE_CLIENT_ID !== !!env.GOOGLE_CLIENT_SECRET) {
    brokenOAuth.push("GOOGLE_CLIENT_ID/SECRET must be set together")
  }
  if (!!env.APPLE_CLIENT_ID !== !!env.APPLE_CLIENT_SECRET) {
    brokenOAuth.push("APPLE_CLIENT_ID/SECRET must be set together")
  }
  if (
    env.GOOGLE_REDIRECT_URI &&
    (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET)
  ) {
    brokenOAuth.push("GOOGLE_REDIRECT_URI set without full Google credentials")
  }
  if (
    env.APPLE_REDIRECT_URI &&
    (!env.APPLE_CLIENT_ID || !env.APPLE_CLIENT_SECRET)
  ) {
    brokenOAuth.push("APPLE_REDIRECT_URI set without full Apple credentials")
  }
  if (brokenOAuth.length > 0) {
    throw new Error(`Invalid OAuth configuration: ${brokenOAuth.join("; ")}`)
  }

  return env
}
