"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Download,
  Heart,
  Key,
  Lock,
  Mail,
  Save,
  Shield,
  ShieldCheck,
  XCircle,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { authClient } from "@/lib/auth-client"

const AVATAR_PRESETS = [
  {
    name: "Sophia",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia",
  },
  {
    name: "Felix",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  },
  {
    name: "Aneka",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  },
  { name: "Robo", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Robo" },
  { name: "Geo", url: "https://api.dicebear.com/7.x/identicon/svg?seed=Geo" },
  {
    name: "Emoji",
    url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Happy",
  },
]

function SectionHeading({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
    </div>
  )
}

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const {
    data: session,
    isPending: sessionLoading,
    refetch,
  } = authClient.useSession()

  const [name, setName] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [currentPassword, setCurrentPassword] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [weight, setWeight] = useState("")
  const [height, setHeight] = useState("")
  const [allergies, setAllergies] = useState("")
  const [conditions, setConditions] = useState("")
  const [medications, setMedications] = useState("")

  const [twoFactorPassword, setTwoFactorPassword] = useState("")
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [totpUri, setTotpUri] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showTwoFactorWizard, setShowTwoFactorWizard] = useState(false)
  const [twoFactorStep, setTwoFactorStep] = useState<
    "password" | "verify" | "backup"
  >("password")
  const [showDisable2FAConfirm, setShowDisable2FAConfirm] = useState(false)
  const [disablePassword, setDisablePassword] = useState("")

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    if (session?.user) {
      const u = session.user as { name?: string; image?: string }
      setName(u.name ?? "")
      setImageUrl(u.image ?? "")
    }
  }, [session])

  const profileMutation = useMutation({
    mutationFn: (data: { name: string; image?: string }) =>
      apiClient.patch("/users/me", data),
    onSuccess: () => {
      toast.success("Profile updated!")
      refetch()
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to update profile")
    },
  })

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      return apiClient.post<{ image?: string }>("/users/me/avatar", formData)
    },
    onSuccess: (data) => {
      setImageUrl(data.image ?? "")
      setPreviewUrl(null)
      toast.success("Avatar uploaded!")
      refetch()
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Upload failed")
    },
  })

  const passwordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authClient.changePassword(data),
    onSuccess: () => {
      toast.success("Password changed!")
      setCurrentPassword("")
      setPassword("")
      setConfirmPassword("")
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to change password")
    },
  })

  const { data: patientProfile } = useQuery({
    queryKey: ["patient-profile"],
    queryFn: () =>
      apiClient.get<{
        weight: number | null
        height: number | null
        medicalHistory: Record<string, unknown> | null
      }>("/patients/me"),
    enabled:
      !!session && (session.user as { role?: string }).role === "PATIENT",
  })

  useEffect(() => {
    if (patientProfile) {
      setWeight(
        patientProfile.weight != null ? String(patientProfile.weight) : "",
      )
      setHeight(
        patientProfile.height != null ? String(patientProfile.height) : "",
      )
      const mh = patientProfile.medicalHistory as {
        allergies?: string[]
        conditions?: string[]
        medications?: string[]
      } | null
      if (mh) {
        setAllergies((mh.allergies ?? []).join(", "))
        setConditions((mh.conditions ?? []).join(", "))
        setMedications((mh.medications ?? []).join(", "))
      }
    }
  }, [patientProfile])

  const patientProfileMutation = useMutation({
    mutationFn: (data: {
      weight?: number
      height?: number
      medicalHistory?: Record<string, unknown>
    }) => apiClient.patch("/patients/me", data),
    onSuccess: () => {
      toast.success("Health details saved!")
      queryClient.invalidateQueries({ queryKey: ["patient-profile"] })
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to update")
    },
  })

  const enable2FAMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await authClient.twoFactor.enable({
        password: twoFactorPassword,
      })
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (data) => {
      setTotpUri(data?.totpURI ?? "")
      setTwoFactorStep("verify")
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed")
    },
  })

  const verify2FAMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await authClient.twoFactor.verifyTotp({
        code: twoFactorCode,
      })
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (data: unknown) => {
      const d = data as { backupCodes?: string[] } | null
      toast.success("2FA enabled!")
      refetch()
      setBackupCodes(d?.backupCodes ?? [])
      setTwoFactorStep("backup")
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Invalid code")
    },
  })

  const disable2FAMutation = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.twoFactor.disable({
        password: disablePassword,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      toast.success("2FA disabled")
      refetch()
      setShowDisable2FAConfirm(false)
      setDisablePassword("")
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed")
    },
  })

  function validateAndUploadFile(file: File) {
    const allowed = ["image/jpeg", "image/png", "image/webp"]
    if (!allowed.includes(file.type)) {
      toast.error("Only JPEG, PNG, WEBP allowed")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Max 2MB")
      return
    }
    setPreviewUrl(URL.createObjectURL(file))
    uploadAvatarMutation.mutate(file)
  }

  function handlePasswordChange(e: React.FormEvent) {
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
    passwordMutation.mutate({ currentPassword, newPassword: password })
  }

  function downloadBackupCodes() {
    const blob = new Blob([backupCodes.join("\n")], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "telehealth-2fa-backup-codes.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (sessionLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8 text-muted-foreground" />
      </div>
    )
  }

  if (!session?.user) return null

  const user = session.user as {
    id: string
    role?: string
    name?: string
    email: string
    image?: string
    twoFactorEnabled?: boolean
  }
  const is2FAEnabled = user.twoFactorEnabled === true

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* ── Profile Section ────────────────────────────────── */}
      <section className="space-y-6">
        <SectionHeading
          title="Profile"
          description="Update your name and profile photo"
        />

        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              type="button"
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                setDragOver(false)
              }}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                const f = e.dataTransfer.files[0]
                if (f) validateAndUploadFile(f)
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 p-0 transition-all ${
                dragOver
                  ? "border-primary scale-105"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) validateAndUploadFile(f)
                }}
                accept="image/jpeg,image/png,image/webp"
              />
              {previewUrl || imageUrl ? (
                // biome-ignore lint/performance/noImgElement: Avatar previews can be blob URLs, which next/image does not optimize.
                <img
                  src={previewUrl || imageUrl}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-muted-foreground uppercase">
                  {name?.[0] || user.email[0]}
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="h-4 w-4 text-white" />
              </div>
              {uploadAvatarMutation.isPending && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Spinner className="h-4 w-4 text-white" />
                </div>
              )}
            </Button>
            <div className="text-sm">
              <p className="font-medium">{user.email}</p>
              <p className="text-muted-foreground text-xs">
                Click or drag to upload a photo
              </p>
            </div>
          </div>

          {/* Avatar Presets */}
          <div className="flex gap-2">
            {AVATAR_PRESETS.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="icon"
                type="button"
                onClick={() => {
                  setImageUrl(preset.url)
                  profileMutation.mutate({
                    name: name || user.name || "",
                    image: preset.url,
                  })
                }}
                className={`h-10 w-10 overflow-hidden rounded-full border-2 p-0 hover:scale-110 ${
                  imageUrl === preset.url
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border"
                }`}
              >
                {/* biome-ignore lint/performance/noImgElement: Preset avatar assets are tiny fixed-size images. */}
                <img
                  src={preset.url}
                  alt={preset.name}
                  className="h-full w-full object-contain"
                />
              </Button>
            ))}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          {/* Account Info (read-only) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                {user.email}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Badge
                  variant={user.role === "ADMIN" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {user.role ?? "PATIENT"}
                </Badge>
              </div>
            </div>
          </div>

          <Button
            onClick={() =>
              profileMutation.mutate({ name, image: imageUrl || undefined })
            }
            disabled={profileMutation.isPending}
          >
            {profileMutation.isPending ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>
        </div>

        <Separator />
      </section>

      {/* ── Patient Profile Section ────────────────────────── */}
      {user.role === "PATIENT" && (
        <section className="space-y-6">
          <SectionHeading
            title="Health Details"
            description="Your health information helps doctors provide better care"
          />

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="0"
                  max="500"
                  placeholder="e.g. 65"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  min="0"
                  max="300"
                  placeholder="e.g. 170"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground">
                Medical History
              </p>

              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies</Label>
                <Input
                  id="allergies"
                  placeholder="e.g. Penicillin, Latex (comma-separated)"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conditions">Conditions</Label>
                <Input
                  id="conditions"
                  placeholder="e.g. Asthma, Hypertension (comma-separated)"
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medications">Current Medications</Label>
                <Input
                  id="medications"
                  placeholder="e.g. Albuterol, Amlodipine 5mg (comma-separated)"
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={() => {
                const data: {
                  weight?: number
                  height?: number
                  medicalHistory?: Record<string, unknown>
                } = {}
                if (weight) data.weight = Number.parseFloat(weight)
                if (height) data.height = Number.parseFloat(height)
                data.medicalHistory = {
                  allergies: allergies
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                  conditions: conditions
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                  medications: medications
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                }
                patientProfileMutation.mutate(data)
              }}
              disabled={patientProfileMutation.isPending}
            >
              {patientProfileMutation.isPending ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <Heart className="mr-2 h-4 w-4" />
              )}
              Save Health Details
            </Button>
          </div>

          <Separator />
        </section>
      )}

      {/* ── Password Section ───────────────────────────────── */}
      <section className="space-y-6">
        <SectionHeading
          title="Update Password"
          description="Ensure your account is using a strong, unique password"
        />

        <form onSubmit={handlePasswordChange} className="space-y-4">
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
              passwordMutation.isPending ||
              !currentPassword ||
              !password ||
              password !== confirmPassword
            }
          >
            {passwordMutation.isPending ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : (
              <Key className="mr-2 h-4 w-4" />
            )}
            Update Password
          </Button>
        </form>

        <Separator />
      </section>

      {/* ── Two-Factor Authentication Section ──────────────── */}
      <section className="space-y-6">
        <SectionHeading
          title="Two-Factor Authentication"
          description="Add an extra layer of security to your account"
        />

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

            {showDisable2FAConfirm ? (
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
                      setShowDisable2FAConfirm(false)
                      setDisablePassword("")
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => disable2FAMutation.mutate()}
                    disabled={disable2FAMutation.isPending || !disablePassword}
                  >
                    {disable2FAMutation.isPending ? (
                      <Spinner className="mr-2 h-3 w-3" />
                    ) : null}
                    Disable 2FA
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowDisable2FAConfirm(true)}
              >
                Disable Two-Factor Authentication
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {showTwoFactorWizard ? (
              <div className="space-y-4 p-4 rounded-lg border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={() => {
                    setShowTwoFactorWizard(false)
                    setTwoFactorStep("password")
                  }}
                >
                  <XCircle className="h-4 w-4" />
                </Button>

                {twoFactorStep === "password" && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">
                      Step 1: Enter your password
                    </p>
                    <Input
                      type="password"
                      placeholder="Current password"
                      value={twoFactorPassword}
                      onChange={(e) => setTwoFactorPassword(e.target.value)}
                    />
                    <Button
                      onClick={() => enable2FAMutation.mutate()}
                      disabled={
                        enable2FAMutation.isPending || !twoFactorPassword
                      }
                    >
                      {enable2FAMutation.isPending ? (
                        <Spinner className="mr-2 h-4 w-4" />
                      ) : null}
                      Continue
                    </Button>
                  </div>
                )}

                {twoFactorStep === "verify" && (
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
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      maxLength={6}
                      className="text-center font-mono text-lg tracking-widest"
                    />
                    <Button
                      onClick={() => verify2FAMutation.mutate()}
                      disabled={
                        verify2FAMutation.isPending || twoFactorCode.length < 6
                      }
                    >
                      {verify2FAMutation.isPending ? (
                        <Spinner className="mr-2 h-4 w-4" />
                      ) : null}
                      Verify & Enable
                    </Button>
                  </div>
                )}

                {twoFactorStep === "backup" && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" /> Step 3: Save your
                      backup codes
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Store these codes somewhere safe. Each code can only be
                      used once.
                    </p>
                    <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
                      {backupCodes.map((code) => (
                        <div key={code}>{code}</div>
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
                          setShowTwoFactorWizard(false)
                          setTwoFactorStep("password")
                        }}
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button onClick={() => setShowTwoFactorWizard(true)}>
                <Lock className="mr-2 h-4 w-4" />
                Enable Two-Factor Authentication
              </Button>
            )}
          </div>
        )}

        <Separator />
      </section>

      {/* ── Sessions Section ───────────────────────────────── */}
      <SessionsSection />

      <Separator />

      {/* ── Security Alerts Section ────────────────────────── */}
      <SecurityAlertsSection />
    </div>
  )
}

function SessionsSection() {
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

  const queryClient = useQueryClient()

  return (
    <section className="space-y-6">
      <SectionHeading
        title="Browser Sessions"
        description="Manage your active sessions on other devices"
      />

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
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="text-sm">
                <p className="font-medium">
                  {session.userAgent?.split(" ")[0] ?? "Unknown device"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session.ipAddress ?? "Unknown IP"} ·{" "}
                  {new Date(session.createdAt).toLocaleDateString()}
                </p>
              </div>
              {session.isCurrent ? (
                <Badge variant="secondary" className="text-xs">
                  Current
                </Badge>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revokeMutation.mutate(session.id)}
                  disabled={revokeMutation.isPending}
                >
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function SecurityAlertsSection() {
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
    <section className="space-y-6">
      <SectionHeading
        title="Security Alerts"
        description="Recent security events on your account"
      />

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
          {alerts.slice(0, 5).map((alert) => (
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
    </section>
  )
}
