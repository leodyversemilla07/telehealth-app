import { envSchema, validate } from "./env.validation"

const baseDev = {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  BETTER_AUTH_SECRET: "s".repeat(40),
  NODE_ENV: "development",
}

describe("env.validation", () => {
  it("accepts COOKIE_DOMAIN and leaves it optional", () => {
    const ok = envSchema.safeParse(baseDev)
    expect(ok.success).toBe(true)
    expect(ok.success && ok.data.COOKIE_DOMAIN).toBeUndefined()

    const withDomain = envSchema.safeParse({
      ...baseDev,
      COOKIE_DOMAIN: ".tele-health.app",
    })
    expect(withDomain.success).toBe(true)
  })

  it("accepts a fully-configured OAuth provider", () => {
    const ok = envSchema.safeParse({
      ...baseDev,
      COOKIE_DOMAIN: ".tele-health.app",
      GOOGLE_CLIENT_ID: "google-id",
      GOOGLE_CLIENT_SECRET: "google-secret",
      GOOGLE_REDIRECT_URI:
        "https://api.tele-health.app/api/auth/callback/google",
      APPLE_CLIENT_ID: "com.app",
      APPLE_CLIENT_SECRET: "apple-secret",
    })
    expect(ok.success).toBe(true)
  })

  it("rejects a provider with only a client id (coherence)", () => {
    expect(() =>
      validate({ ...baseDev, GOOGLE_CLIENT_ID: "google-id" }),
    ).toThrow(/Invalid OAuth configuration/)
  })

  it("rejects a redirect URI set without full provider credentials", () => {
    expect(() =>
      validate({
        ...baseDev,
        GOOGLE_REDIRECT_URI:
          "https://api.tele-health.app/api/auth/callback/google",
      }),
    ).toThrow(/GOOGLE_REDIRECT_URI set without full Google credentials/)
  })

  it("still enforces production-required vars", () => {
    expect(() => validate({ ...baseDev, NODE_ENV: "production" })).toThrow(
      /Missing required environment variables in production/,
    )
  })
})
