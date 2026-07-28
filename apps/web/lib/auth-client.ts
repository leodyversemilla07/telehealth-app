import { twoFactorClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import { env } from "@/lib/env"

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_API_URL,
  plugins: [twoFactorClient()],
})

/**
 * Sign in with a social OAuth provider.
 * Redirects the browser to the provider's OAuth consent page.
 */
export async function signInWithSocial(provider: "apple" | "google") {
  await authClient.signIn.social({ provider })
}
