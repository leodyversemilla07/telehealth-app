import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

/**
 * Server-side route guard (Next.js 16 renamed `middleware` -> `proxy`).
 *
 * The web app proxies /api/* and /socket.io to the NestJS backend via
 * next.config.mjs `rewrites()`, and the backend already enforces auth on
 * every API call with @Roles + Better Auth. So this proxy intentionally does
 * NOT match /api or /socket.io — it only guards the authenticated *page*
 * areas, closing the client-side-only gap (pages used to render briefly
 * unauthenticated before the layout redirect).
 *
 * Runs before rewrites, on the Node.js runtime (v16 default), so we can do a
 * real server-side session check via the backend's /api/auth/get-session.
 */
const PROTECTED_PREFIXES = ["/admin", "/doctor", "/patient", "/settings"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
  if (!isProtected) return NextResponse.next()

  // Validate the Better Auth session server-side. We call the backend through
  // the same-origin /api rewrite (works in every environment) and forward the
  // request cookies so the session cookie is read by Better Auth.
  let authenticated = false
  try {
    const sessionRes = await fetch(
      new URL("/api/auth/get-session", request.nextUrl.origin),
      {
        headers: { cookie: request.headers.get("cookie") ?? "" },
      },
    )
    if (sessionRes.ok) {
      const data = (await sessionRes.json()) as { user?: unknown } | null
      authenticated = Boolean(data?.user)
    }
  } catch {
    // Network/auth failure -> treat as unauthenticated and redirect.
    authenticated = false
  }

  if (!authenticated) {
    const signInUrl = new URL("/sign-in", request.nextUrl.origin)
    // SignInForm reads `callbackUrl` and redirects back after login.
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/doctor/:path*",
    "/patient/:path*",
    "/settings/:path*",
  ],
}
