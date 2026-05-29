"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { Skeleton } from "@workspace/ui/components/skeleton"

export function SessionsContent() {
  const queryClient = useQueryClient()

  const { data: sessions = [], isPending } = useQuery({
    queryKey: ["sessions"],
    queryFn: () =>
      apiClient.get<
        Array<{
          id: string
          ipAddress: string | null
          userAgent: string | null
          createdAt: string
          isCurrent?: boolean
        }>
      >("/users/me/sessions"),
  })

  const revokeMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/users/me/sessions/${id}`),
    onSuccess: () => {
      toast.success("Session revoked")
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Browser Sessions</h2>
        <p className="text-sm text-muted-foreground">
          Manage your active sessions on other devices
        </p>
      </div>

      {isPending ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active sessions.</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="text-sm">
                <p className="font-medium">
                  {s.userAgent?.split(" ")[0] ?? "Unknown device"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {s.ipAddress ?? "Unknown IP"} ·{" "}
                  {new Date(s.createdAt).toLocaleDateString()}
                </p>
              </div>
              {s.isCurrent ? (
                <Badge variant="secondary" className="text-xs">
                  Current
                </Badge>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revokeMutation.mutate(s.id)}
                  disabled={revokeMutation.isPending}
                >
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
