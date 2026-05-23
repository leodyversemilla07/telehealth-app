import { PrismaPg } from "@prisma/adapter-pg"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { createAuthMiddleware, getSessionFromCtx } from "better-auth/api"
import { twoFactor } from "better-auth/plugins"
import pg from "pg"
import { PrismaClient } from "@generated/prisma/client.js"

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
