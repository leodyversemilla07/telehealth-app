import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import "@workspace/ui/globals.css"
import { Toaster } from "@workspace/ui/components/sonner"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"
import { QueryProvider } from "@/components/query-provider"
import { ThemeProvider } from "@/components/theme-provider"

// Force dynamic rendering so the per-request CSP nonce (generated in
// apps/web/proxy.ts) is injected into Next.js's framework/inline scripts.
// Nonce-based CSP only works during dynamic rendering; without this, statically
// prerendered pages would ship scripts without the nonce and break in prod.
export const dynamic = "force-dynamic"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
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
        "font-sans",
        inter.variable,
      )}
    >
      <body>
        <ThemeProvider>
          <QueryProvider>
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
