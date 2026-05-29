"use client"

import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { Skeleton } from "@workspace/ui/components/skeleton"

export function AlertsContent() {
  const { data: alerts = [], isPending } = useQuery({
    queryKey: ["security-alerts"],
    queryFn: () =>
      apiClient.get<
        Array<{
          id: string
          title: string
          message: string
          ipAddress: string | null
          createdAt: string
          read: boolean
        }>
      >("/users/me/security-alerts"),
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Security Alerts</h2>
        <p className="text-sm text-muted-foreground">
          Recent security events on your account
        </p>
      </div>

      {isPending ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No security alerts.</p>
      ) : (
        <div className="space-y-2">
          {alerts.slice(0, 10).map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border ${alert.read ? "opacity-60" : ""}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{alert.title}</p>
                <span className="text-xs text-muted-foreground">
                  {new Date(alert.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {alert.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
