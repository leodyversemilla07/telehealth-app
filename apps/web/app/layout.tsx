import type { Metadata } from "next"
import localFont from "next/font/local"

import "@workspace/ui/globals.css"
import { Toaster } from "@workspace/ui/components/toast"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"
import { ThemeProvider } from "@/components/theme-provider"
import { TRPCReactProvider } from "@/lib/trpc/client"

// Force dynamic rendering so the per-request CSP nonce (generated in
// apps/web/proxy.ts) is injected into Next.js's framework/inline scripts.
// Nonce-based CSP only works during dynamic rendering; without this, statically
// prerendered pages would ship scripts without the nonce and break in prod.
export const dynamic = "force-dynamic"

// Fonts are vendored under app/fonts instead of loaded via `next/font/google`:
// the Google loader performs a live fetch to fonts.googleapis.com on EVERY
// `next build`, and Google intermittently answers with an extensionless font
// URL that crashes Turbopack ("next/font/google queries have exactly one
// entry" / vercel/next.js#99114). No upstream release fixes it, so local
// variable WOFF2 files keep the build hermetic. Latin subset only.
const inter = localFont({
  src: "./fonts/inter-latin-variable.woff2",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
})

const fontDisplay = localFont({
  src: [
    {
      path: "./fonts/fraunces-latin-variable.woff2",
      weight: "400 700",
      style: "normal",
    },
    {
      path: "./fonts/fraunces-latin-italic-variable.woff2",
      weight: "400 700",
      style: "italic",
    },
  ],
  variable: "--font-display",
  display: "swap",
})

const fontMono = localFont({
  src: "./fonts/geist-mono-latin-variable.woff2",
  variable: "--font-mono",
  weight: "100 900",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Telehealth - Virtual Healthcare Platform",
    template: "%s | Telehealth",
  },
  description:
    "Secure virtual healthcare platform connecting patients with licensed doctors for video consultations, health records management, and appointment scheduling.",
  keywords: [
    "telehealth",
    "virtual doctor",
    "online consultation",
    "healthcare",
    "telemedicine",
  ],
  authors: [{ name: "Telehealth App" }],
  icons: {
    icon: [{ url: "/icon.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        fontDisplay.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body>
        <ThemeProvider>
          <TRPCReactProvider>
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster />
          </TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
