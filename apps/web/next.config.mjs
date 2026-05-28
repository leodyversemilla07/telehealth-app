import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Get workspace root (go up two levels from apps/web/next.config.mjs)
const workspaceRoot = path.resolve(__dirname, "..", "..")

/**
 * API_URL (server-only, no NEXT_PUBLIC_ prefix):
 *   Used by Vercel rewrites to proxy /api/* → the NestJS backend.
 *   Not exposed to the browser. Set this in Vercel env vars.
 *   Example: https://telehealth-env.eba-ncicpaui.us-east-1.elasticbeanstalk.com
 *
 * NEXT_PUBLIC_API_URL (client-side):
 *   - Empty string (recommended): same-origin mode via Next rewrites.
 *   - Absolute URL: direct API calls (e.g. local dev: http://localhost:3001).
 */
const apiBaseUrl = process.env.API_URL || "http://localhost:3001"

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  output: process.env.NEXT_OUTPUT ?? undefined,
  turbopack: {
    root: workspaceRoot,
  },
  async rewrites() {
    return [
      // Better Auth endpoints already live under /api/auth on the Nest app
      {
        source: "/api/auth/:path*",
        destination: `${apiBaseUrl}/api/auth/:path*`,
      },
      // App API endpoints are exposed at root on Nest (e.g. /appointments)
      {
        source: "/api/:path*",
        destination: `${apiBaseUrl}/:path*`,
      },
      // WebSocket / polling transport for notifications gateway
      {
        source: "/socket.io/:path*",
        destination: `${apiBaseUrl}/socket.io/:path*`,
      },
    ]
  },
}

export default nextConfig
