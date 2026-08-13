import type { Metadata } from "next"
import { Fraunces, Geist_Mono, Inter } from "next/font/google"

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

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontDisplay = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
})

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
