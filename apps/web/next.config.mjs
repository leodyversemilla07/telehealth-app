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
 *   Should be empty or "/api" so the browser sends relative requests
 *   that hit Vercel's rewrites → proxied to the API.
 */
const apiBaseUrl =
  process.env.API_URL || "http://localhost:3001"

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  output: process.env.NEXT_OUTPUT ?? undefined,
  turbopack: {
    root: workspaceRoot,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiBaseUrl}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
