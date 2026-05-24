/**
 * Web-app environment variable validation.
 *
 * Only `NEXT_PUBLIC_*` variables are available client-side.
 * Server-side envs are validated at build time.
 */

function getEnv(name: string, fallback: string): string {
  const value = process.env[name]
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Missing required environment variable: ${name}`)
    }
    console.warn(`⚠️  ${name} is not set, using "${fallback}" (dev default)`)
    return fallback
  }
  return value
}

export const env = {
  /** Base URL of the NestJS API (must end without trailing slash) */
  NEXT_PUBLIC_API_URL: getEnv(
    "NEXT_PUBLIC_API_URL",
    "http://localhost:3001",
  ).replace(/\/$/, ""),
} as const

export type Env = typeof env
