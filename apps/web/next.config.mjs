import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Get workspace root (go up two levels from apps/web/next.config.mjs)
const workspaceRoot = path.resolve(__dirname, "..", "..")

/**
 * API_URL (server-only):
 *   Used by Next.js rewrites to proxy /api/* → the NestJS backend.
 *   Local dev default: http://localhost:3001
 *
 * NEXT_PUBLIC_API_URL (client-side):
 *   Optional. Set this if the browser should call the API directly
 *   instead of going through Next's same-origin /api rewrites.
 *   Local default: empty (uses rewrites).
 */
const apiBaseUrl = process.env.API_URL || "http://localhost:3001"

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile workspace packages
  transpilePackages: ["@workspace/ui", "@workspace/shared"],

  // Optimize tree-shaking for icon libraries
  experimental: {
    optimizePackageImports: ["lucide-react", "@workspace/ui"],
  },

  // Turbopack configuration
  turbopack: {
    root: workspaceRoot,
  },

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
  },

  // API rewrites - proxy /api/* to NestJS backend
  async rewrites() {
    return [
      // Better Auth endpoints
      {
        source: "/api/auth/:path*",
        destination: `${apiBaseUrl}/api/auth/:path*`,
      },
      // All other API endpoints
      {
        source: "/api/:path*",
        destination: `${apiBaseUrl}/api/:path*`,
      },
      // WebSocket (Socket.io)
      {
        source: "/socket.io",
        destination: `${apiBaseUrl}/socket.io`,
      },
      {
        source: "/socket.io/:path*",
        destination: `${apiBaseUrl}/socket.io/:path*`,
      },
    ]
  },

  // Headers for security
  async headers() {
    const isProduction = process.env.NODE_ENV === "production"
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          // HSTS: only in production to avoid issues with localhost
          ...(isProduction
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://api.dicebear.com",
              "connect-src 'self' wss: ws:",
              "font-src 'self'",
              "object-src 'none'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ]
  },
}

export default nextConfig
