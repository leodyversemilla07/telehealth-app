import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Get workspace root (go up two levels from apps/web/next.config.mjs)
const workspaceRoot = path.resolve(__dirname, '..', '..')

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  output: process.env.NEXT_OUTPUT ?? undefined,
  turbopack: {
    root: workspaceRoot,
  },
}

export default nextConfig
