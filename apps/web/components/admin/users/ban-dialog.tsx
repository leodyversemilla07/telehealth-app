"use client"

import type { UserDto } from "@workspace/shared"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { UserX } from "lucide-react"

interface BanDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedUserForBan: UserDto | null
  banReason: string
  onBanReasonChange: (reason: string) => void
  onConfirm: (e: React.FormEvent) => void
  isPending: boolean
}

export function BanDialog({
  isOpen,
  onClose,
  selectedUserForBan,
  banReason,
  onBanReasonChange,
  onConfirm,
  isPending,
}: BanDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <form onSubmit={onConfirm} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <UserX className="h-5 w-5" />
              Ban User Account
            </DialogTitle>
            <DialogDescription>
              You are about to ban{" "}
              <strong>
                {selectedUserForBan?.name || selectedUserForBan?.email}
              </strong>
              . Banning prevents the user from logging in.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="ban-reason" className="text-xs font-semibold">
              Reason for Ban (Optional)
            </Label>
            <Input
              id="ban-reason"
              placeholder="Violation of terms, spamming..."
              value={banReason}
              onChange={(e) => onBanReasonChange(e.target.value)}
              autoComplete="off"
              className="bg-muted/10 text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              className="h-8 text-xs gap-1.5"
              disabled={isPending}
            >
              {isPending ? "Banning..." : "Confirm Ban"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
