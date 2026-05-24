import { PrismaClient } from "@generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { createAuthMiddleware, getSessionFromCtx } from "better-auth/api"
import { twoFactor } from "better-auth/plugins"
import pg from "pg"

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export const auth = betterAuth({
  appName: "Next Monorepo",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder_google_id",
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET || "placeholder_google_secret",
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "placeholder_github_id",
      clientSecret:
        process.env.GITHUB_CLIENT_SECRET || "placeholder_github_secret",
    },
  },
  plugins: [twoFactor()],
  basePath: "/api/auth",
  /**
   * Session configuration:
   * - Sessions expire after 7 days.
   * - A new session token is issued on every request (session rotation)
   *   to mitigate session fixation attacks.
   * - Fresh tokens are issued if more than 1 day has elapsed since last update.
   */
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh token every 24h
    freshAge: 60 * 5, // treat sessions <5 min old as "fresh"
  },
  /**
   * Account linking: do not auto-link OAuth accounts by default;
   * prevents accidental account merging.
   */
  account: {
    accountLinking: {
      enabled: false,
      trustedProviders: ["github", "google"],
    },
  },
  /**
   * Rate-limiting for auth endpoints (better-auth built-in).
   */
  rateLimit: {
    window: 60, // 60-second window
    max: 20, // max 20 auth requests per window
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Record a SecurityAlert when the user's password changes successfully
      if (
        ctx.path === "/change-password" &&
        !(ctx.context.returned instanceof Error)
      ) {
        const session = await getSessionFromCtx(ctx)
        if (session) {
          await prisma.securityAlert.create({
            data: {
              userId: session.user.id,
              title: "Security Update",
              message: "Your account password was successfully updated.",
              ipAddress:
                ctx.request?.headers.get("x-forwarded-for") ||
                ctx.request?.headers.get("cf-connecting-ip") ||
                null,
              userAgent: ctx.request?.headers.get("user-agent") || null,
            },
          })
          console.log(
            `\x1b[33m[Security SMTP Send]\x1b[0m To: \x1b[36m${session.user.email}\x1b[0m | Subject: \x1b[1m[Next Monorepo] Security Alert: Password Changed\x1b[0m | Message: Your password has been changed. If this wasn't you, please contact support immediately.`,
          )
        }
      }
      return ctx
    }),
  },
})
