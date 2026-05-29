import { Logger } from "@nestjs/common"
import { z } from "zod"

const logger = new Logger("Config")

export const envSchema = z.object({
  // ── Database ──────────────────────────────────────────────────────────────
  DATABASE_URL: z
    .string({
      required_error: "DATABASE_URL is required",
    })
    .min(1, "DATABASE_URL must not be empty"),

  // ── Server ────────────────────────────────────────────────────────────────
  PORT: z.coerce.number().min(1).max(65535).default(3001),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // ── Better Auth ───────────────────────────────────────────────────────────
  BETTER_AUTH_SECRET: z
    .string({
      required_error: "BETTER_AUTH_SECRET is required",
    })
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.string().optional().default("http://localhost:3001"),

  // ── OAuth ─────────────────────────────────────────────────────────────────
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

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
  S3_PUBLIC_URL: z.string().url().optional(),

  // ── Email (required in production) ─────────────────────────────────────────
  SMTP_USER: z
    .string()
    .min(1, "SMTP_USER is required for password resets and email verification")
    .optional(),
  SMTP_PASS: z
    .string()
    .min(1, "SMTP_PASS is required for password resets and email verification")
    .optional(),

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
    if (!env.SMTP_USER) missing.push("SMTP_USER")
    if (!env.SMTP_PASS) missing.push("SMTP_PASS")
    if (!env.LIVEKIT_API_KEY) missing.push("LIVEKIT_API_KEY")
    if (!env.LIVEKIT_API_SECRET) missing.push("LIVEKIT_API_SECRET")
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables in production: ${missing.join(", ")}`,
      )
    }
  }

  return env
}
