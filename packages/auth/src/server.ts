import { type Auth, betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { createAuthMiddleware, getSessionFromCtx } from "better-auth/api"
import { twoFactor } from "better-auth/plugins/two-factor"
import {
  getLockoutDuration,
  isLockedOut,
  LOCKOUT_THRESHOLD,
  validatePasswordComplexity,
} from "./password.js"

/**
 * Minimal structural type for the subset of Prisma the auth hooks touch.
 * Keeps this package decoupled from the generated client (which lives in the
 * API app); the API's generated PrismaClient is structurally compatible.
 */
export interface AuthPrisma {
  user: {
    findUnique: (args: { where: { email: string } }) => Promise<{
      id: string
      email: string
      banned: boolean
      banExpires: Date | null
      lockoutUntil: Date | null
      failedLoginAttempts: number
    } | null>
    update: (args: {
      where: { id: string }
      data: { failedLoginAttempts?: number; lockoutUntil?: Date | null }
    }) => Promise<unknown>
  }
  securityAlert: {
    // create args are DB-specific generated types this package can't name;
    // keep the param loose (callers pass the exact data shape) while the
    // reads below stay strictly typed.
    // biome-ignore lint/suspicious/noExplicitAny: structural boundary for the generated Prisma client
    create: (args: { data: any }) => Promise<unknown>
  }
  auditLog: {
    // biome-ignore lint/suspicious/noExplicitAny: structural boundary for the generated Prisma client
    create: (args: { data: any }) => Promise<unknown>
  }
}

export interface AuthDependencies {
  /** The shared Prisma client (generated client from the API app). */
  prisma: AuthPrisma
  /** Sends a plain-text email (used for password reset + verification). */
  sendEmail: (options: {
    to: string
    subject: string
    text?: string
    html?: string
    critical?: boolean
  }) => Promise<void>
  /** Sends a plain-text security alert email. */
  sendSecurityAlertEmail: (
    email: string,
    title: string,
    message: string,
  ) => Promise<void>
}

/**
 * Build the Better Auth server instance.
 *
 * ENV TIMING: better-auth's module graph snapshots NODE_ENV and the auth
 * secret at import time, so the HOST app must load its .env (dotenv) BEFORE
 * anything transitively imports better-auth — see apps/api/src/main.ts which
 * does `import "dotenv/config"` as its first line. This factory reads
 * process.env at CALL time only, so it never depends on module load order.
 */
export function createAuth(deps: AuthDependencies): Auth {
  const trustedOrigins = (
    process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:3001"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)

  return betterAuth({
    appName: "Telehealth App",
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
    trustedOrigins,
    database: prismaAdapter(deps.prisma, {
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
        // critical: true — if the reset email fails to send we must NOT tell
        // the user it went through. The thrown error surfaces as an explicit
        // failure.
        await deps.sendEmail({
          to: data.user.email,
          subject: "[Telehealth App] Reset Your Password",
          text: `Hello,

We received a request to reset the password for your Telehealth App account.

Open this link to choose a new password:
${data.url}

This link expires in 1 hour. If you did not request a password reset, you can ignore this email.

Telehealth App`,
          critical: true,
        })
      },
    },
    emailVerification: {
      // Defining sendVerificationEmail is not enough: Better Auth only sends
      // at registration when this trigger is enabled.
      sendOnSignUp: true,
      sendVerificationEmail: async (data: {
        user: { email: string }
        url: string
        token: string
      }) => {
        await deps.sendEmail({
          to: data.user.email,
          subject: "[Telehealth App] Verify Your Email Address",
          text: `Hello,

Thank you for creating a Telehealth App account.

To verify your email address, open this link:
${data.url}

This link expires in 1 hour.

If you did not create this account, you can ignore this email.

Telehealth App`,
        })
      },
    },

    plugins: [twoFactor()],

    /** Social login providers */
    socialProviders: {
      ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
              redirectURI: process.env.GOOGLE_REDIRECT_URI,
            },
          }
        : {}),
      ...(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET
        ? {
            apple: {
              clientId: process.env.APPLE_CLIENT_ID,
              clientSecret: process.env.APPLE_CLIENT_SECRET,
              redirectURI: process.env.APPLE_REDIRECT_URI,
            },
          }
        : {}),
    },
    basePath: "/api/auth",
    /**
     * Session configuration:
     * - Sessions expire after 7 days.
     * - The session token is rotated every `updateAge` (1 day) to mitigate
     *   session fixation.
     * - `freshAge` is intentionally NOT set: it is no longer a documented
     *   option and its runtime default is exactly `updateAge` (3600*24).
     *   Any explicit override would diverge from the documented default.
     */
    session: {
      expiresIn: Number(process.env.SESSION_EXPIRY_SECONDS) || 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    advanced: {
      useSecureCookies: process.env.NODE_ENV === "production",
      disableCSRFCheck: false,
      defaultCookieAttributes: {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        // Only set domain in production with a real domain
        ...(process.env.NODE_ENV === "production" && process.env.COOKIE_DOMAIN
          ? { domain: process.env.COOKIE_DOMAIN }
          : {}),
      },
    },
    /**
     * Account linking: do not auto-link OAuth accounts by default;
     * prevents accidental account merging.
     */
    account: {
      accountLinking: {
        enabled: false,
        trustedProviders: [],
      },
    },
    /**
     * Rate-limiting for auth endpoints (better-auth built-in).
     */
    rateLimit: {
      // enabled:true is explicit and deterministic — it must not depend on
      // better-auth's module-scope NODE_ENV snapshot (which is frozen at
      // import order).
      enabled: true,
      window: 60, // 60-second window
      max: 20, // max 20 auth requests per window
      // Single fork process (pm2) → in-memory counters are shared and
      // accurate. Enabling explicit memory storage makes the per-IP auth
      // rules actually engage (previously the DB-backed default silently
      // no-oped without the rateLimit table, leaving only the account
      // lockout as brute-force guard).
      storage: "memory",
      customRules: {
        // get-session runs on EVERY guarded page load — both the Next.js
        // server-side proxy and the browser client call it. Throttling it
        // would spuriously sign users out. Brute-force / bot protection
        // stays on the auth mutations via the built-in special rules +
        // account lockout.
        "/get-session": false,
        "/get-session-info": false,
      },
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "PATIENT",
          // Server-only: clients must not be able to set their own role
          // (would allow self-registration as ADMIN / privilege escalation).
          // Role is promoted to DOCTOR server-side during doctor registration.
          input: false,
        },
        firstName: {
          type: "string",
          required: false,
        },
        middleName: {
          type: "string",
          required: false,
        },
        lastName: {
          type: "string",
          required: false,
        },
      },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        // Defense-in-depth: never trust a client-supplied role on sign-up,
        // regardless of the additionalFields `input: false` flag above.
        if (ctx.path === "/sign-up/email") {
          const role = (ctx.body?.role as string | undefined) ?? "PATIENT"
          if (role !== "PATIENT" && role !== "DOCTOR") {
            return new Response(JSON.stringify({ message: "Invalid role" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            })
          }
        }

        // Validate password complexity on sign-up and password change
        if (ctx.path === "/sign-up/email" || ctx.path === "/change-password") {
          const password = ctx.body?.password as string | undefined
          if (password) {
            const error = validatePasswordComplexity(password)
            if (error) {
              return new Response(JSON.stringify({ message: error }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
              })
            }
          }
        }

        // Auto-compute name from first/middle/last name fields on sign-up
        if (ctx.path === "/sign-up/email") {
          const body = ctx.body as Record<string, unknown> | undefined
          if (body) {
            const firstName = (body.firstName as string) ?? ""
            const middleName = (body.middleName as string) ?? ""
            const lastName = (body.lastName as string) ?? ""
            // If name is not explicitly provided, build it from the three
            // parts
            if (!body.name && (firstName || lastName)) {
              body.name = [firstName, middleName, lastName]
                .filter(Boolean)
                .join(" ")
            }
          }
        }

        // Capture session before sign-out so we can audit-log it in the
        // after hook
        if (ctx.path === "/sign-out") {
          const session = await getSessionFromCtx(ctx)
          if (session) {
            ;(ctx as Record<string, unknown>).__auditSession = session
          }
        }

        // Check account lockout before sign-in
        if (ctx.path === "/sign-in/email") {
          const userEmail = ctx.body?.email as string | undefined
          if (userEmail) {
            const user = await deps.prisma.user.findUnique({
              where: { email: userEmail },
            })
            if (
              user?.banned &&
              (!user.banExpires || user.banExpires > new Date())
            ) {
              return new Response(
                JSON.stringify({
                  message: "This account is not allowed to sign in.",
                }),
                {
                  status: 403,
                  headers: { "Content-Type": "application/json" },
                },
              )
            }
            if (user && isLockedOut(user.lockoutUntil)) {
              return new Response(
                JSON.stringify({
                  message: `Account temporarily locked due to ${LOCKOUT_THRESHOLD} failed login attempts. Try again later.`,
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
        // Record a SecurityAlert when the user's password changes
        // successfully
        if (
          ctx.path === "/change-password" &&
          !(ctx.context.returned instanceof Error)
        ) {
          const session = await getSessionFromCtx(ctx)
          if (session) {
            await deps.prisma.securityAlert.create({
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
            await deps.sendSecurityAlertEmail(
              session.user.email,
              "Password Changed",
              "Your account password was successfully updated. If this wasn't you, please contact support immediately.",
            )
          }
        }

        // NPC Compliance (F-AUTH-09): Audit log + lockout tracking for
        // login attempts
        if (ctx.path === "/sign-in/email") {
          const userEmail = ctx.body?.email as string | undefined
          const isSuccess = !(ctx.context.returned instanceof Error)
          const ipAddress =
            ctx.request?.headers.get("x-forwarded-for") ||
            ctx.request?.headers.get("cf-connecting-ip") ||
            null

          if (userEmail) {
            const user = await deps.prisma.user.findUnique({
              where: { email: userEmail },
            })

            if (isSuccess && user) {
              // Reset failed attempts on successful login
              await deps.prisma.user.update({
                where: { id: user.id },
                data: {
                  failedLoginAttempts: 0,
                  lockoutUntil: null,
                },
              })
              await deps.prisma.auditLog.create({
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
              await deps.prisma.user.update({
                where: { id: user.id },
                data: updateData,
              })
              await deps.prisma.auditLog.create({
                data: {
                  action: "User Login Failed",
                  actorId: user.id,
                  actorEmail: userEmail,
                  reason: `Failed login attempt ${newCount}/${LOCKOUT_THRESHOLD} (IP: ${ipAddress ?? "unknown"})`,
                },
              })
            } else {
              await deps.prisma.auditLog.create({
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
          const session =
            ((ctx as Record<string, unknown>).__auditSession as {
              user: { id: string; email: string }
            } | null) ?? (await getSessionFromCtx(ctx))
          if (session) {
            const ipAddress =
              ctx.request?.headers.get("x-forwarded-for") ||
              ctx.request?.headers.get("cf-connecting-ip") ||
              null
            await deps.prisma.auditLog.create({
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
  }) as unknown as Auth
}
