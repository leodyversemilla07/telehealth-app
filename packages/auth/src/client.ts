import { twoFactorClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

type TwoFactorPlugin = ReturnType<typeof twoFactorClient>

/**
 * Concrete client type including the 2FA plugin methods
 * (enable/disable/verifyTotp/verifyBackupCode). Declared explicitly so the
 * emitted .d.ts is portable (no private better-auth/zod types).
 */
export type TelehealthAuthClient = ReturnType<
  typeof createAuthClient<{
    baseURL: string
    plugins: [TwoFactorPlugin]
  }>
>

/**
 * Create the Better Auth client used by the web app (and any future clients).
 *
 * The host application supplies its public API origin, e.g.
 * `env.NEXT_PUBLIC_API_URL` in the Next.js app.
 */
export function createTelehealthAuthClient(
  baseURL: string,
): TelehealthAuthClient {
  return createAuthClient({
    baseURL,
    plugins: [twoFactorClient()],
  })
}
