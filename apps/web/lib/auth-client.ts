import { createTelehealthAuthClient } from "@telehealth/auth/client"
import { env } from "@/lib/env"

export const authClient = createTelehealthAuthClient(env.NEXT_PUBLIC_API_URL)

/**
 * Sign in with a social OAuth provider.
 * Redirects the browser to the provider's OAuth consent page.
 */
export async function signInWithSocial(provider: "apple" | "google") {
  await authClient.signIn.social({ provider })
}
