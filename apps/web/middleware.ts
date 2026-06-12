import { getSessionCookie } from "better-auth/cookies"
import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
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

// Ensure middleware only intercepts application pages (ignoring assets & api routes)
export const config = {
  matcher: [
    "/patient/:path*",
    "/doctor/:path*",
    "/admin/:path*",
    "/settings/:path*",
  ],
}
