"use client"

import { useMutation } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ShieldCheck,
  XCircle,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"

export function TwoFactorContent() {
  const { data: session, refetch } = authClient.useSession()
  const is2FAEnabled =
    (session?.user as { twoFactorEnabled?: boolean })?.twoFactorEnabled === true

  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [totpUri, setTotpUri] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [step, setStep] = useState<"password" | "verify" | "backup">("password")
  const [showWizard, setShowWizard] = useState(false)
  const [showDisable, setShowDisable] = useState(false)
  const [disablePassword, setDisablePassword] = useState("")

  const enableMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await authClient.twoFactor.enable({ password })
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (data: unknown) => {
      const d = data as { totpURI?: string } | null
      setTotpUri(d?.totpURI ?? "")
      setStep("verify")
    },
    onError: (err: { message?: string }) =>
      toast.error(err.message || "Failed"),
  })

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await authClient.twoFactor.verifyTotp({ code })
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (data: unknown) => {
      const d = data as { backupCodes?: string[] } | null
      toast.success("2FA enabled!")
      refetch()
      setBackupCodes(d?.backupCodes ?? [])
      setStep("backup")
    },
    onError: (err: { message?: string }) =>
      toast.error(err.message || "Invalid code"),
  })

  const disableMutation = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.twoFactor.disable({
        password: disablePassword,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      toast.success("2FA disabled")
      refetch()
      setShowDisable(false)
      setDisablePassword("")
    },
    onError: (err: { message?: string }) =>
      toast.error(err.message || "Failed"),
  })

  function downloadBackupCodes() {
    const blob = new Blob([backupCodes.join("\n")], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "telehealth-2fa-backup-codes.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
        <p className="text-sm text-muted-foreground">
          Add an extra layer of security to your account
        </p>
      </div>

      {is2FAEnabled ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
            <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-sm font-medium">
                Two-factor authentication is enabled
              </p>
              <p className="text-xs text-muted-foreground">
                Your account is protected with TOTP verification.
              </p>
            </div>
          </div>

          {showDisable ? (
            <div className="space-y-3 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
              <p className="text-sm text-destructive font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Confirm disabling 2FA
              </p>
              <Input
                type="password"
                placeholder="Enter password to confirm"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDisable(false)
                    setDisablePassword("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => disableMutation.mutate()}
                  disabled={disableMutation.isPending || !disablePassword}
                >
                  {disableMutation.isPending ? (
                    <Spinner className="mr-2 h-3 w-3" />
                  ) : null}
                  Disable 2FA
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setShowDisable(true)}>
              Disable Two-Factor Authentication
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {showWizard ? (
            <div className="space-y-4 p-4 rounded-lg border relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2"
                onClick={() => {
                  setShowWizard(false)
                  setStep("password")
                }}
              >
                <XCircle className="h-4 w-4" />
              </Button>

              {step === "password" && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">
                    Step 1: Enter your password
                  </p>
                  <Input
                    type="password"
                    placeholder="Current password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    onClick={() => enableMutation.mutate()}
                    disabled={enableMutation.isPending || !password}
                  >
                    {enableMutation.isPending ? (
                      <Spinner className="mr-2 h-4 w-4" />
                    ) : null}
                    Continue
                  </Button>
                </div>
              )}

              {step === "verify" && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">
                    Step 2: Scan QR code with your authenticator app
                  </p>
                  {totpUri && (
                    <div className="flex justify-center p-4 bg-white rounded-lg border">
                      {/* biome-ignore lint/performance/noImgElement: External QR image URL is generated dynamically for the TOTP URI. */}
                      <img
                        src={`https://chart.googleapis.com/chart?chs=180x180&chld=M|0&cht=qr&chl=${encodeURIComponent(totpUri)}`}
                        alt="2FA QR Code"
                        className="h-[180px] w-[180px]"
                      />
                    </div>
                  )}
                  <Input
                    placeholder="Enter 6-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={6}
                    className="text-center font-mono text-lg tracking-widest"
                  />
                  <Button
                    onClick={() => verifyMutation.mutate()}
                    disabled={verifyMutation.isPending || code.length < 6}
                  >
                    {verifyMutation.isPending ? (
                      <Spinner className="mr-2 h-4 w-4" />
                    ) : null}
                    Verify & Enable
                  </Button>
                </div>
              )}

              {step === "backup" && (
                <div className="space-y-3">
                  <p className="text-sm font-medium flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" /> Step 3: Save your
                    backup codes
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Store these codes somewhere safe. Each code can only be used
                    once.
                  </p>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
                    {backupCodes.map((c) => (
                      <div key={c}>{c}</div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadBackupCodes}
                    >
                      <Download className="mr-2 h-3 w-3" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setShowWizard(false)
                        setStep("password")
                      }}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button onClick={() => setShowWizard(true)}>
              Enable Two-Factor Authentication
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
