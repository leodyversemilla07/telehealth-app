"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Separator } from "@workspace/ui/components/separator"
import { Spinner } from "@workspace/ui/components/spinner"
import { Switch } from "@workspace/ui/components/switch"
import {
  AlertTriangle,
  ClipboardList,
  FileText,
  History,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { SettingsLayout } from "@/components/settings-layout"
import type { ConsentType } from "@/hooks/use-consent"
import {
  CONSENT_TYPES,
  useConsentLogs,
  useConsentStatus,
  useRecordConsent,
} from "@/hooks/use-consent"
import { apiClient } from "@/lib/api-client"
import { authClient } from "@/lib/auth-client"

export default function PrivacyConsentPage() {
  const { data: logs = [], isPending } = useConsentLogs()
  const consentStatus = useConsentStatus()
  const recordConsent = useRecordConsent()
  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set())

  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirmed, setDeleteConfirmed] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    if (!deleteConfirmed) return
    setIsDeleting(true)
    try {
      await apiClient.delete("/users/me")
      toast.success("Your account has been permanently deleted.")
      try {
        await authClient.signOut()
      } catch {
        // Session is already gone after deletion; ignore.
      }
      router.push("/")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete account.",
      )
    } finally {
      setIsDeleting(false)
      setDeleteOpen(false)
      setDeleteConfirmed(false)
    }
  }

  const handleToggle = (consentType: string, granted: boolean) => {
    setPendingChanges((prev) => new Set(prev).add(consentType))

    recordConsent.mutate(
      { consentType: consentType as ConsentType, granted },
      {
        onSuccess: () => {
          toast.success(
            granted
              ? "Consent granted successfully"
              : "Consent revoked successfully",
          )
        },
        onError: (err: Error) => {
          toast.error(err.message || "Failed to update consent preference")
        },
        onSettled: () => {
          setPendingChanges((prev) => {
            const next = new Set(prev)
            next.delete(consentType)
            return next
          })
        },
      },
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Manila",
    })
  }

  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Privacy &amp; Data Consent
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your data sharing preferences in compliance with the Data
            Privacy Act of 2012 (RA 10173). All consent actions are logged for
            audit purposes.
          </p>
        </div>

        <Separator />

        {/* Consent Toggles */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Consent Preferences
          </h3>

          {CONSENT_TYPES.map((consent) => {
            const isPendingChange = pendingChanges.has(consent.id)
            const isGranted = consentStatus[consent.id] ?? false

            return (
              <Card key={consent.id} className="border-border/60">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">
                      {consent.label}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {isPendingChange && (
                        <Spinner className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Switch
                        checked={isGranted}
                        onCheckedChange={(checked) =>
                          handleToggle(consent.id, checked)
                        }
                        disabled={isPendingChange || recordConsent.isPending}
                        aria-label={`Toggle ${consent.label}`}
                      />
                    </div>
                  </div>
                  <CardDescription className="text-xs">
                    {consent.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>

        <Separator />

        {/* Consent History */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <History className="h-4 w-4" />
            Consent History
          </h3>

          {isPending ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-6 w-6 text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <Empty className="py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ClipboardList className="h-4 w-4" />
                </EmptyMedia>
                <EmptyTitle className="text-sm">
                  No consent records yet
                </EmptyTitle>
                <EmptyDescription className="text-xs">
                  Your consent preferences will appear here once you make a
                  selection.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-2">
              {logs.slice(0, 20).map((log) => {
                const consentLabel =
                  CONSENT_TYPES.find((c) => c.id === log.consentType)?.label ??
                  log.consentType

                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/20 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                          log.granted
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {consentLabel}
                        </p>
                        <p className="text-muted-foreground">
                          {log.granted ? "Granted" : "Revoked"} &middot;{" "}
                          {formatDate(log.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold uppercase ${
                        log.granted ? "text-success" : "text-destructive"
                      }`}
                    >
                      {log.granted ? "Active" : "Inactive"}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* NPC Compliance Notice */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-xs text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Data Privacy Act Compliance (RA 10173)
          </p>
          <p>
            You have the right to access, modify, and revoke your consent at any
            time. All consent transactions are logged with timestamps and IP
            addresses for audit trail purposes as required by NPC guidelines.
          </p>
          <p>
            For concerns regarding your data privacy, please contact our Data
            Protection Officer at{" "}
            <span className="font-medium text-foreground">
              dpo@tele-health.app
            </span>
            .
          </p>
        </div>

        <Separator />

        {/* Delete Account — RA 10173 right to erasure */}
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-destructive" />
                  Delete Account
                </CardTitle>
                <CardDescription className="text-xs">
                  Permanently remove your account and all associated personal
                  data. This action cannot be undone.
                </CardDescription>
              </div>
              <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogTrigger
                  render={
                    <Button variant="destructive" size="sm">
                      Delete Account
                    </Button>
                  }
                />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      Delete your account?
                    </DialogTitle>
                    <DialogDescription>
                      This permanently deletes your account, profile, and
                      personal data, including appointment and medical-record
                      history. This cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <label className="flex items-start gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={deleteConfirmed}
                      onChange={(e) => setDeleteConfirmed(e.target.checked)}
                      className="mt-0.5"
                    />
                    I understand this action is permanent and cannot be undone.
                  </label>
                  <DialogFooter>
                    <DialogClose
                      render={
                        <Button variant="outline" disabled={isDeleting}>
                          Cancel
                        </Button>
                      }
                    />
                    <Button
                      variant="destructive"
                      disabled={!deleteConfirmed || isDeleting}
                      onClick={handleDeleteAccount}
                    >
                      {isDeleting ? "Deleting..." : "Delete Account"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
        </Card>
      </div>
    </SettingsLayout>
  )
}
