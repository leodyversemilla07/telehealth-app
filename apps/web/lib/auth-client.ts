import { twoFactorClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import { env } from "@/lib/env"

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_API_URL,
  plugins: [twoFactorClient()],
})
