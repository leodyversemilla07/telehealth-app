import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

/**
 * Server-side route guard + strict Content-Security-Policy.
 *
 * Next.js 16 renamed `middleware` -> `proxy`. The CSP here uses a per-request
 * nonce (generated below) which Next.js automatically applies to its own
 * framework/inline scripts during rendering — that is what stops the
 * "Refused to execute inline script" violations you get from a static
 * `script-src 'self'`. `'unsafe-eval'` is allowed only in development because
 * React/Turbopack use eval for HMR and dev error stacks.
 *
 * Because nonces are only injected during dynamic rendering, the root layout
 * forces `dynamic = 'force-dynamic'`. (See app/layout.tsx.)
 *
 * The web app proxies /api/* and /socket.io to the NestJS backend via
 * next.config.mjs `rewrites()`; the backend already enforces auth on every API
 * call, so this proxy only guards authenticated *page* areas (closing the
 * client-side-only gap where pages used to flash unauthenticated before the
 * layout redirect).
 *
 * Runs before rewrites, on the Node.js runtime, so we can do a real server-side
 * session check via the backend's /api/auth/get-session.
 */
const PROTECTED_PREFIXES = ["/admin", "/doctor", "/patient", "/settings"]

/**
 * Extract the origin from a URL (handles ws:// and wss:// schemes too).
 */
function extractOrigin(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl)
    return u.origin
  } catch {
    return null
  }
}

function buildCsp(nonce: string, isDev: boolean): string {
  // If LIVEKIT_URL is configured, explicitly allow its origin for WebSocket
  // connections (the LiveKit client SDK connects directly to that server).
  // Without this, only 'self' WebSocket connections (Socket.io via rewrites)
  // would be allowed, and the video call would fail in the browser.
  const livekitOrigin = extractOrigin(process.env.LIVEKIT_URL ?? "")

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Keep 'unsafe-inline' for styles: shadcn/ui and many client components
    // inject inline styles/style attributes that can't carry the nonce.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https://api.dicebear.com",
    `connect-src 'self'${livekitOrigin ? ` ${livekitOrigin}` : ""} wss: ws:`,
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // upgrade-insecure-requests would rewrite the local http:// /api proxy to
    // https in dev and break it; only enable it in production.
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ")
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64")
  const isDev = process.env.NODE_ENV === "development"
  const csp = buildCsp(nonce, isDev)

  // Forward the CSP on the *request* headers so Next.js reads the nonce during
  // rendering and auto-applies it to its framework/inline scripts.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("Content-Security-Policy", csp)

  const withCsp = (res: NextResponse) => {
    res.headers.set("Content-Security-Policy", csp)
    return res
  }

  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
  if (!isProtected) {
    return withCsp(NextResponse.next({ request: { headers: requestHeaders } }))
  }

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
  } catch (err) {
    console.warn("Session check failed, treating as unauthenticated:", err)
    authenticated = false
  }

  if (!authenticated) {
    const signInUrl = new URL("/sign-in", request.nextUrl.origin)
    // SignInForm reads `callbackUrl` and redirects back after login.
    signInUrl.searchParams.set("callbackUrl", pathname)
    return withCsp(NextResponse.redirect(signInUrl))
  }

  return withCsp(NextResponse.next({ request: { headers: requestHeaders } }))
}

export const config = {
  matcher: [
    /*
     * Run on all document routes. Exclude API routes, Next static/image assets,
     * the favicon, and prefetches (so we don't waste a session check / nonce on
     * them). The CSP header is only meaningful on HTML documents, and excluding
     * prefetches keeps navigation snappy.
     */
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
}
