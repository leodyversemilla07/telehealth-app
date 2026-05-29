"use client"

import { useMutation } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Spinner } from "@workspace/ui/components/spinner"
import { Key } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"

export function PasswordContent() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const mutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authClient.changePassword(data),
    onSuccess: () => {
      toast.success("Password changed!")
      setCurrentPassword("")
      setPassword("")
      setConfirmPassword("")
    },
    onError: (err: { message?: string }) =>
      toast.error(err.message || "Failed"),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!currentPassword) {
      toast.error("Enter current password")
      return
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match")
      return
    }
    mutation.mutate({ currentPassword, newPassword: password })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Update Password</h2>
        <p className="text-sm text-muted-foreground">
          Ensure your account is using a strong, unique password
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current-password">Current Password</Label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">New Password</Label>
          <Input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {password && password !== confirmPassword && (
          <p className="text-sm text-destructive">Passwords do not match</p>
        )}

        <Button
          type="submit"
          disabled={
            mutation.isPending ||
            !currentPassword ||
            !password ||
            password !== confirmPassword
          }
        >
          {mutation.isPending ? (
            <Spinner className="mr-2 h-4 w-4" />
          ) : (
            <Key className="mr-2 h-4 w-4" />
          )}
          Update Password
        </Button>
      </form>
    </div>
  )
}
