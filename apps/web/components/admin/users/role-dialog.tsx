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
import {
  Field,
  FieldLabel,
} from "@workspace/ui/components/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Crown, HeartPulse, Shield } from "lucide-react"

interface RoleDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedUserForRole: {
    user: UserDto
    role: "PATIENT" | "DOCTOR" | "ADMIN"
  } | null
  onChangeSelectedRole: (role: "PATIENT" | "DOCTOR" | "ADMIN") => void
  onConfirm: () => void
  isPending: boolean
}

export function RoleDialog({
  isOpen,
  onClose,
  selectedUserForRole,
  onChangeSelectedRole,
  onConfirm,
  isPending,
}: RoleDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Change User Role
          </DialogTitle>
          <DialogDescription>
            Select a new role for{" "}
            <strong>
              {selectedUserForRole?.user.name ||
                selectedUserForRole?.user.email}
            </strong>
            . Current role: <strong>{selectedUserForRole?.user.role}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Field>
            <FieldLabel className="text-xs font-semibold">New Role</FieldLabel>
            <Select
              value={selectedUserForRole?.role ?? "PATIENT"}
              onValueChange={(value: "PATIENT" | "DOCTOR" | "ADMIN" | null) => {
                if (value) {
                  onChangeSelectedRole(value)
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a role">
                  {selectedUserForRole?.role === "PATIENT"
                    ? "Patient"
                    : selectedUserForRole?.role === "DOCTOR"
                      ? "Provider"
                      : selectedUserForRole?.role === "ADMIN"
                        ? "Admin"
                        : ""}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="PATIENT">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Patient
                    </div>
                  </SelectItem>
                  <SelectItem value="DOCTOR">
                    <div className="flex items-center gap-2">
                      <HeartPulse className="h-4 w-4" />
                      Provider
                    </div>
                  </SelectItem>
                  <SelectItem value="ADMIN">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      Admin
                    </div>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-8 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            className="h-8 text-xs gap-1.5"
            disabled={
              isPending ||
              !selectedUserForRole ||
              selectedUserForRole.role === selectedUserForRole.user.role
            }
            onClick={onConfirm}
          >
            {isPending ? "Updating..." : "Confirm Role Change"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
