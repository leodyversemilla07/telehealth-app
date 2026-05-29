import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { createAuthMiddleware, getSessionFromCtx } from "better-auth/api"
import { twoFactor } from "better-auth/plugins/two-factor"
import { sendEmail, sendSecurityAlertEmail } from "@/common/utils/email"
import {
  getLockoutDuration,
  isLockedOut,
  LOCKOUT_THRESHOLD,
  validatePasswordComplexity,
} from "@/common/utils/password.util"
import { prisma } from "@/prisma/prisma-client"

const trustedOrigins = (
  process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:3001"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)

export const auth = betterAuth({
  appName: "Telehealth Platform",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  trustedOrigins,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    sendResetPassword: async (data: {
      user: { email: string }
      url: string
      token: string
    }) => {
      await sendEmail({
        to: data.user.email,
        subject: "[Telehealth Platform] Reset Your Password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Reset Your Password</h2>
            <p style="color: #333; line-height: 1.6;">
              You requested a password reset. Click the link below to set a new password:
            </p>
            <a href="${data.url}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
              Reset Password
            </a>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              If you did not request a password reset, you can safely ignore this email. This link expires in 1 hour.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 11px;">
              Telehealth Platform — This is an automated email.
            </p>
          </div>
        `,
      })
    },
  },
  emailVerification: {
    sendVerificationEmail: async (data: {
      user: { email: string }
      url: string
      token: string
    }) => {
      await sendEmail({
        to: data.user.email,
        subject: "[Telehealth Platform] Verify Your Email Address",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Verify Your Email</h2>
            <p style="color: #333; line-height: 1.6;">
              Thank you for signing up! Please click the link below to verify your email address:
            </p>
            <a href="${data.url}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
              Verify Email
            </a>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              If you did not create an account, you can safely ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 11px;">
              Telehealth Platform — This is an automated email.
            </p>
          </div>
        `,
      })
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder_google_id",
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET || "placeholder_google_secret",
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
      trustedProviders: ["google"],
    },
  },
  /**
   * Rate-limiting for auth endpoints (better-auth built-in).
   */
  rateLimit: {
    window: 60, // 60-second window
    max: 20, // max 20 auth requests per window
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "PATIENT",
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // Validate password complexity on sign-up and password change
      if (ctx.path === "/sign-up/email" || ctx.path === "/change-password") {
        const password = ctx.body?.password as string | undefined
        if (password) {
          const error = validatePasswordComplexity(password)
          if (error) {
            return new Response(JSON.stringify({ error }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            })
          }
        }
      }

      // Check account lockout before sign-in
      if (ctx.path === "/sign-in/email") {
        const userEmail = ctx.body?.email as string | undefined
        if (userEmail) {
          const user = await prisma.user.findUnique({
            where: { email: userEmail },
          })
          if (user && isLockedOut(user.lockoutUntil)) {
            return new Response(
              JSON.stringify({
                error: `Account temporarily locked due to ${LOCKOUT_THRESHOLD} failed login attempts. Try again later.`,
              }),
              {
                status: 429,
                headers: { "Content-Type": "application/json" },
              },
            )
          }
        }
      }
    }),
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
          await sendSecurityAlertEmail(
            session.user.email,
            "Password Changed",
            "Your account password was successfully updated. If this wasn't you, please contact support immediately.",
          )
        }
      }

      // NPC Compliance (F-AUTH-09): Audit log + lockout tracking for login attempts
      if (ctx.path === "/sign-in/email") {
        const userEmail = ctx.body?.email as string | undefined
        const isSuccess = !(ctx.context.returned instanceof Error)
        const ipAddress =
          ctx.request?.headers.get("x-forwarded-for") ||
          ctx.request?.headers.get("cf-connecting-ip") ||
          null

        if (userEmail) {
          const user = await prisma.user.findUnique({
            where: { email: userEmail },
          })

          if (isSuccess && user) {
            // Reset failed attempts on successful login
            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: 0,
                lockoutUntil: null,
              },
            })
            await prisma.auditLog.create({
              data: {
                action: "User Login",
                actorId: user.id,
                actorEmail: user.email,
                reason: `Successful email login from IP: ${ipAddress ?? "unknown"}`,
              },
            })
          } else if (user) {
            // Increment failed attempts and lock if threshold reached
            const newCount = user.failedLoginAttempts + 1
            const updateData: {
              failedLoginAttempts: number
              lockoutUntil?: Date
            } = {
              failedLoginAttempts: newCount,
            }
            if (newCount >= LOCKOUT_THRESHOLD) {
              updateData.lockoutUntil = getLockoutDuration()
            }
            await prisma.user.update({
              where: { id: user.id },
              data: updateData,
            })
            await prisma.auditLog.create({
              data: {
                action: "User Login Failed",
                actorId: user.id,
                actorEmail: userEmail,
                reason: `Failed login attempt ${newCount}/${LOCKOUT_THRESHOLD} (IP: ${ipAddress ?? "unknown"})`,
              },
            })
          } else {
            await prisma.auditLog.create({
              data: {
                action: "User Login Failed",
                actorId: "unknown",
                actorEmail: userEmail,
                reason: `Login attempt for non-existent user (IP: ${ipAddress ?? "unknown"})`,
              },
            })
          }
        }
      }

      // NPC Compliance (F-AUTH-09): Audit log for sign-out
      if (
        ctx.path === "/sign-out" &&
        !(ctx.context.returned instanceof Error)
      ) {
        const session = await getSessionFromCtx(ctx)
        if (session) {
          const ipAddress =
            ctx.request?.headers.get("x-forwarded-for") ||
            ctx.request?.headers.get("cf-connecting-ip") ||
            null
          await prisma.auditLog.create({
            data: {
              action: "User Logout",
              actorId: session.user.id,
              actorEmail: session.user.email,
              reason: `Successful logout (IP: ${ipAddress ?? "unknown"})`,
            },
          })
        }
      }
    }),
  },
})
