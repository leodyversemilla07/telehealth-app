/**
 * Web-app environment variable validation.
 *
 * NEXT_PUBLIC_API_URL: Client-side API base URL.
 *   - Empty string (default) = same-origin, uses Next.js rewrites to proxy to API
 *   - Set explicitly only if the API is on a different domain (CORS needed)
 *
 * API_URL: Server-only (no NEXT_PUBLIC_ prefix).
 *   - Used by next.config.mjs rewrites to proxy /api/* to the NestJS backend
 *   - Not exposed to the browser
 *   - In Docker: http://api:3001 (internal network)
 *   - Local dev: http://localhost:3001
 */

const apiWebUrl = process.env.NEXT_PUBLIC_API_URL
const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY

if (typeof window === "undefined") {
  if (apiWebUrl === undefined) {
    console.warn('⚠️ NEXT_PUBLIC_API_URL is not set, using "" (dev default)')
  }
  if (vapidKey === undefined) {
    console.warn('⚠️ NEXT_PUBLIC_VAPID_KEY is not set, using "" (dev default)')
  }
}

export const env = {
  /**
   * Base URL of the NestJS API.
   * Empty string = same-origin proxy (Next.js rewrites handle it).
   * The trailing slash is stripped.
   */
  NEXT_PUBLIC_API_URL: (apiWebUrl || "").replace(/\/$/, ""),
  /**
   * VAPID public key for Web Push subscriptions.
   * Must match the VAPID_PUBLIC_KEY set in the API .env.
   */
  NEXT_PUBLIC_VAPID_KEY: vapidKey || "",
} as const

export type Env = typeof env
