import { getSessionCookie } from "better-auth/cookies"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Middleware proxy for protected routes.
 *
 * NOTE: This only checks for the *presence* of a session cookie, not its validity.
 * An expired/invalid cookie will pass this check, and the API will return 401.
 * The role-based redirects in each layout (patient/doctor/admin) handle the
 * case where the session is invalid or the user has the wrong role.
 *
 * For stricter protection, consider validating the session server-side here
 * by calling `auth.api.getSession()` — but this adds latency to every request.
 */
export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request)
  const { pathname } = request.nextUrl

  // Protected route checking
  const isProtectedPath =
    pathname.startsWith("/patient") ||
    pathname.startsWith("/doctor") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/settings")

  if (isProtectedPath && !sessionCookie) {
    // Save original destination to support post-auth redirects
    const loginUrl = new URL("/sign-in", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// Ensure proxy only intercepts application pages (ignoring assets & api routes)
export const config = {
  matcher: [
    "/patient/:path*",
    "/doctor/:path*",
    "/admin/:path*",
    "/settings/:path*",
  ],
}
