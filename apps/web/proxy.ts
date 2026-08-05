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
const PROTECTED_PREFIXES = ["/admin", "/doctor", "/patient"]

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

function buildCsp(nonce: string, isDev: boolean, pageOrigin: string): string {
  // Wildcard-free connect-src — every destination is listed explicitly:
  //  - 'self'       same-origin API via the /api rewrites
  //  - wsOrigin     Socket.io rides the same-origin rewrites; browsers don't
  //                 reliably treat same-host ws/wss as covered by 'self', so
  //                 list the page origin's ws/wss form explicitly
  //  - apiOrigin    only when NEXT_PUBLIC_API_URL is set (cross-origin API)
  //  - livekit      the LiveKit server the client SDK connects to directly
  //  - dev-only     Turbopack HMR + dev tooling; wildcards never ship to prod
  const livekitOrigin = extractOrigin(process.env.LIVEKIT_URL ?? "")
  const apiOrigin = extractOrigin(process.env.NEXT_PUBLIC_API_URL ?? "")
  const wsOrigin = pageOrigin
    .replace(/^https:/, "wss:")
    .replace(/^http:/, "ws:")

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Keep 'unsafe-inline' for styles: shadcn/ui and many client components
    // inject inline styles/style attributes that can't carry the nonce.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https://api.dicebear.com",
    `connect-src 'self' ${wsOrigin}${apiOrigin ? ` ${apiOrigin}` : ""}${livekitOrigin ? ` ${livekitOrigin}` : ""}${isDev ? " ws: wss:" : ""}`,
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
  const csp = buildCsp(nonce, isDev, request.nextUrl.origin)

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

  // Validate the Better Auth session server-side. Use API_URL when available
  // instead of request.nextUrl.origin: behind nginx, Next sees the public HTTPS
  // scheme but its own internal HTTP port (3000), which made it request
  // https://tele-health.app:3000 and fail TLS validation. Forward the browser
  // cookie so Better Auth can read the session on the API process.
  const apiOrigin = process.env.API_URL || request.nextUrl.origin
  let authenticated = false
  try {
    const sessionRes = await fetch(
      new URL("/api/auth/get-session", apiOrigin),
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
