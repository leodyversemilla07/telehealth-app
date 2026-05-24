import { z } from "zod"

export const envSchema = z.object({
  // ── Database ──────────────────────────────────────────────────────────────
  DATABASE_URL: z
    .string({
      required_error: "DATABASE_URL is required",
    })
    .url("DATABASE_URL must be a valid connection URL"),

  // ── Server ────────────────────────────────────────────────────────────────
  PORT: z.coerce.number().min(1).max(65535).default(3000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // ── Better Auth ───────────────────────────────────────────────────────────
  BETTER_AUTH_SECRET: z
    .string({
      required_error: "BETTER_AUTH_SECRET is required",
    })
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z
    .string({
      required_error: "BETTER_AUTH_URL is required",
    })
    .url("BETTER_AUTH_URL must be a valid URL"),

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
})

export type Env = z.infer<typeof envSchema>

export function validate(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config)
  if (!result.success) {
    console.error("❌ Invalid API Environment Configuration:")
    console.error(JSON.stringify(result.error.format(), null, 2))
    throw new Error("Invalid API Environment Configuration")
  }
  return result.data
}
