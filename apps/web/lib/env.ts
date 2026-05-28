/**
 * Web-app environment variable validation.
 *
 * NEXT_PUBLIC_API_URL: Client-side API base URL.
 *   - Empty string (default) = same-origin, uses Vercel rewrites to proxy to API
 *   - Set explicitly only if the API is on a different domain (CORS needed)
 *
 * API_URL: Server-only (no NEXT_PUBLIC_ prefix).
 *   - Used by next.config.mjs rewrites to proxy /api/* to the NestJS backend
 *   - Not exposed to the browser
 *   - Set in Vercel: API_URL=https://telehealth-env.eba-ncicpaui.us-east-1.elasticbeanstalk.com
 */

function getEnv(name: string, fallback: string): string {
  const value = process.env[name]
  // Allow empty string as a valid value (e.g. NEXT_PUBLIC_API_URL="" for same-origin)
  if (value === undefined || value === null) {
    if (process.env.NODE_ENV === "production") {
      // In production build, use fallback instead of crashing
      // This lets `next build` succeed for static prerendering
      console.warn(
        `⚠️ ${name} is not set, using "${fallback}" (production fallback)`,
      )
      return fallback
    }
    console.warn(`⚠️ ${name} is not set, using "${fallback}" (dev default)`)
    return fallback
  }
  return value
}

export const env = {
  /**
   * Base URL of the NestJS API.
   * Empty string = same-origin proxy (Vercel rewrites handle it).
   * The trailing slash is stripped.
   */
  NEXT_PUBLIC_API_URL: getEnv("NEXT_PUBLIC_API_URL", "").replace(/\/$/, ""),
} as const

export type Env = typeof env
