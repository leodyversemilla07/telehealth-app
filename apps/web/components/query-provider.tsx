"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { type ReactNode, useEffect, useState } from "react"
import { getQueryClient } from "@/lib/get-query-client"

function LazyDevtools(props: {
  initialIsOpen: boolean
  buttonPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right"
}) {
  const [Mod, setMod] = useState<
    typeof import("@tanstack/react-query-devtools") | null
  >(null)
  useEffect(() => {
    import("@tanstack/react-query-devtools").then(setMod)
  }, [])
  if (!Mod) return null
  return <Mod.ReactQueryDevtools {...props} />
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV !== "production" && (
        <LazyDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  )
}
