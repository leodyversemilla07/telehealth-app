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
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
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

  // ── LiveKit (self-hosted on AWS EC2) ───────────────────────────────────────
  LIVEKIT_URL: z.string().optional().default("wss://localhost:7881"),
  LIVEKIT_API_KEY: z.string().optional().default("devkey"),
  LIVEKIT_API_SECRET: z.string().optional().default("devsecret"),

  // ── AI Recommendations (optional; endpoint returns 503 when absent) ───────
  NIM_API_KEY: z.string().optional(),

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
  return result.data
}
