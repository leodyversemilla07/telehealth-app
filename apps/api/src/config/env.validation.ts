import { z } from "zod"

export const envSchema = z.object({
  DATABASE_URL: z
    .string({
      required_error: "DATABASE_URL is required",
    })
    .url("DATABASE_URL must be a valid connection URL"),
  PORT: z.coerce.number().min(1).max(65535).default(3000),
  BETTER_AUTH_SECRET: z
    .string({
      required_error: "BETTER_AUTH_SECRET is required",
    })
    .min(1, "BETTER_AUTH_SECRET cannot be empty"),
  BETTER_AUTH_URL: z
    .string({
      required_error: "BETTER_AUTH_URL is required",
    })
    .url("BETTER_AUTH_URL must be a valid URL"),
  CORS_ORIGIN: z
    .string()
    .optional()
    .default("http://localhost:3000,http://localhost:3001"),
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
