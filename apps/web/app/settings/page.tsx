"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { SecurityAlertDto, UserSessionDto } from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Separator } from "@workspace/ui/components/separator"
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  CheckSquare,
  Download,
  Globe,
  Heart,
  Inbox,
  Key,
  Laptop,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Ruler,
  Save,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  UploadCloud,
  User,
  XCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { authClient } from "@/lib/auth-client"

// Beautiful, curated avatar presets using stable DiceBear API seeds
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

// Parse user agent to read browser, OS, and device category
function getSessionDisplayDetails(userAgent: string | null) {
  if (!userAgent) {
    return {
      browser: "Unknown Browser",
      os: "Unknown OS",
      deviceType: "desktop",
    }
  }

  const ua = userAgent.toLowerCase()
  let browser = "Unknown Browser"
  let os = "Unknown OS"

  if (ua.includes("chrome") || ua.includes("crios")) {
    browser = "Google Chrome"
  } else if (
    ua.includes("safari") &&
    !ua.includes("chrome") &&
    !ua.includes("android")
  ) {
    browser = "Apple Safari"
  } else if (ua.includes("firefox")) {
    browser = "Mozilla Firefox"
  } else if (ua.includes("edge") || ua.includes("edg")) {
    browser = "Microsoft Edge"
  } else if (ua.includes("opera") || ua.includes("opr")) {
    browser = "Opera"
  }

  if (ua.includes("windows")) {
    os = "Windows"
  } else if (ua.includes("macintosh") || ua.includes("mac os")) {
    os = "macOS"
  } else if (ua.includes("iphone") || ua.includes("ipad")) {
    os = "iOS"
  } else if (ua.includes("android")) {
    os = "Android"
  } else if (ua.includes("linux")) {
    os = "Linux"
  }

  let deviceType = "desktop"
  if (
    ua.includes("mobile") ||
    ua.includes("iphone") ||
    ua.includes("android")
  ) {
    deviceType = "mobile"
  }

  return { browser, os, deviceType }
}

export default function SettingsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const {
    data: session,
    isPending: sessionLoading,
    refetch,
  } = authClient.useSession()

  // Input states
  const [name, setName] = useState("")
  const [imageUrl, setImageUrl] = useState("")

  // Avatar Upload States
  const [dragOver, setDragOver] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Password Hardening States
  const [currentPassword, setCurrentPassword] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [revokeOtherDevices, setRevokeOtherDevices] = useState(false)

  // Patient Profile States
  const [weight, setWeight] = useState("")
  const [height, setHeight] = useState("")
  const [allergies, setAllergies] = useState("")
  const [conditions, setConditions] = useState("")
  const [medications, setMedications] = useState("")

  // 2FA States
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

  // Clean up preview object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // Secure client-side redirect
  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace("/sign-in")
    } else if (session) {
      setName(session.user.name ?? "")
      setImageUrl(session.user.image ?? "")
    }
  }, [session, sessionLoading, router])

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: (data: { name: string; image?: string }) =>
      apiClient.patch("/users/me", data),
    onSuccess: async () => {
      toast.success("Profile updated successfully!")
      await refetch()
      queryClient.invalidateQueries({ queryKey: ["security-alerts"] })
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to update profile")
    },
  })

  // Avatar upload mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      return apiClient.post<{ image: string }>("/users/me/avatar", formData)
    },
    onSuccess: async (data) => {
      toast.success("Avatar uploaded and updated successfully!")
      setImageUrl(data.image)
      setPreviewUrl(null)
      await refetch()
      queryClient.invalidateQueries({ queryKey: ["users"] })
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] })
      queryClient.invalidateQueries({ queryKey: ["security-alerts"] })
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to upload avatar")
      setPreviewUrl(null)
    },
  })

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: {
      currentPassword: string
      newPassword: string
      revokeOtherSessions?: boolean
    }) => {
      const { error } = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: data.revokeOtherSessions,
      })
      if (error) {
        throw new Error(error.message || "Failed to change password")
      }
    },
    onSuccess: () => {
      toast.success("Password changed successfully!")
      setCurrentPassword("")
      setPassword("")
      setConfirmPassword("")
      setRevokeOtherDevices(false)
      refetchSessions()
      queryClient.invalidateQueries({ queryKey: ["security-alerts"] })
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to update password")
    },
  })

  // Fetch active sessions
  const {
    data: sessions,
    isPending: sessionsLoading,
    refetch: refetchSessions,
  } = useQuery<UserSessionDto[]>({
    queryKey: ["user-sessions"],
    queryFn: () => apiClient.get<UserSessionDto[]>("/users/me/sessions"),
    enabled: !!session,
  })

  // Fetch security alerts
  const {
    data: alerts,
    isPending: alertsLoading,
    refetch: refetchAlerts,
  } = useQuery<SecurityAlertDto[]>({
    queryKey: ["security-alerts"],
    queryFn: () =>
      apiClient.get<SecurityAlertDto[]>("/users/me/security-alerts"),
    enabled: !!session,
  })

  // Revoke a single active session
  const revokeSessionMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/users/me/sessions/${id}`),
    onSuccess: () => {
      toast.success("Device session revoked successfully")
      refetchSessions()
      queryClient.invalidateQueries({ queryKey: ["security-alerts"] })
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to revoke session")
    },
  })

  // Revoke all other active sessions
  const revokeOthersMutation = useMutation({
    mutationFn: () => apiClient.delete("/users/me/sessions"),
    onSuccess: () => {
      toast.success("All other active device sessions revoked")
      refetchSessions()
      queryClient.invalidateQueries({ queryKey: ["security-alerts"] })
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to revoke other sessions")
    },
  })

  // 2FA Enable Mutation
  const enable2FAMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await authClient.twoFactor.enable({
        password: twoFactorPassword,
      })
      if (error) {
        throw new Error(error.message || "Failed to enable 2FA")
      }
      return data
    },
    onSuccess: (data) => {
      if (data?.totpURI) {
        setTotpUri(data.totpURI)
        if (data.backupCodes) {
          setBackupCodes(data.backupCodes)
        }
        setTwoFactorStep("verify")
      } else {
        toast.success("Two-factor authentication enabled successfully!")
        refetch()
        setShowTwoFactorWizard(false)
        setTwoFactorPassword("")
      }
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to initiate 2FA setup")
    },
  })

  // 2FA Verify Mutation
  const verify2FAMutation = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.twoFactor.verifyTotp({
        code: twoFactorCode,
      })
      if (error) {
        throw new Error(error.message || "Invalid verification code")
      }
    },
    onSuccess: () => {
      toast.success("Two-factor authentication verified and enabled!")
      refetch()
      if (backupCodes && backupCodes.length > 0) {
        setTwoFactorStep("backup")
      } else {
        setShowTwoFactorWizard(false)
        setTwoFactorPassword("")
        setTwoFactorCode("")
      }
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Invalid authenticator code")
    },
  })

  // 2FA Disable Mutation
  const disable2FAMutation = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.twoFactor.disable({
        password: disablePassword,
      })
      if (error) {
        throw new Error(error.message || "Failed to disable 2FA")
      }
    },
    onSuccess: () => {
      toast.success("Two-factor authentication disabled successfully")
      refetch()
      setShowDisable2FAConfirm(false)
      setDisablePassword("")
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to disable 2FA. Verify password.")
    },
  })

  // Fetch patient profile
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

  // Pre-fill patient profile fields when loaded
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

  // Patient profile update mutation
  const patientProfileMutation = useMutation({
    mutationFn: (data: {
      weight?: number
      height?: number
      medicalHistory?: Record<string, unknown>
    }) => apiClient.patch("/patients/me", data),
    onSuccess: () => {
      toast.success("Patient profile updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["patient-profile"] })
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to update patient profile")
    },
  })

  function handlePatientProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    const w = weight.trim()
    const h = height.trim()
    patientProfileMutation.mutate({
      ...(w ? { weight: Number.parseFloat(w) } : {}),
      ...(h ? { height: Number.parseFloat(h) } : {}),
      medicalHistory: {
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
      },
    })
  }

  // Read all alerts mutation
  const readAlertsMutation = useMutation({
    mutationFn: () => apiClient.post("/users/me/security-alerts/read", {}),
    onSuccess: () => {
      toast.success("All security alerts marked as read")
      refetchAlerts()
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to mark alerts as read")
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error("Display name cannot be empty")
      return
    }

    if (trimmedName.length > 100) {
      toast.error("Display name must be less than 100 characters")
      return
    }

    profileMutation.mutate({
      name: trimmedName,
      image: imageUrl || undefined,
    })
  }

  // Pre-fill fields with preset avatar URLs
  function handleSelectPreset(url: string) {
    setImageUrl(url)
    toast.success("Avatar preset selected!")
  }

  // Event handlers for drag & drop file upload
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file) {
        validateAndUploadFile(file)
      }
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file) {
        validateAndUploadFile(file)
      }
    }
  }

  function validateAndUploadFile(file: File) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Only JPEG, PNG, and WEBP are allowed.")
      return
    }

    const maxBytes = 2 * 1024 * 1024 // 2MB
    if (file.size > maxBytes) {
      toast.error("File is too large. Maximum size is 2MB.")
      return
    }

    // Set preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    // Upload
    uploadAvatarMutation.mutate(file)
  }

  function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()

    if (!currentPassword) {
      toast.error("Please enter your current password")
      return
    }

    if (metCount < 5) {
      toast.error(
        "New password does not meet all security complexity requirements",
      )
      return
    }

    if (password !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword: password,
      revokeOtherSessions: revokeOtherDevices,
    })
  }

  // Real-time password strength rules
  const passwordRequirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter (A-Z)", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter (a-z)", met: /[a-z]/.test(password) },
    { label: "One number (0-9)", met: /[0-9]/.test(password) },
    {
      label: "One special character (e.g. !, @, #, $, %)",
      met: /[^A-Za-z0-9]/.test(password),
    },
  ]

  const metCount = passwordRequirements.filter((r) => r.met).length

  let strengthLabel = "None"
  let strengthColor = "bg-muted"
  let strengthPercent = 0

  if (password.length > 0) {
    if (metCount <= 2) {
      strengthLabel = "Weak"
      strengthColor = "bg-red-500"
      strengthPercent = 33
    } else if (metCount <= 4) {
      strengthLabel = "Medium"
      strengthColor = "bg-amber-500"
      strengthPercent = 66
    } else {
      strengthLabel = "Strong"
      strengthColor = "bg-emerald-500"
      strengthPercent = 100
    }
  }

  const downloadBackupCodes = () => {
    const element = document.createElement("a")
    const file = new Blob([backupCodes.join("\n")], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = "telehealth-app-backup-codes.txt"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    toast.success("Backup codes downloaded!")
  }

  // Loading skeleton
  if (sessionLoading || !session) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm font-medium animate-pulse">
            Loading profile settings...
          </p>
        </div>
      </div>
    )
  }

  const user = session.user as {
    id: string
    role?: string
    name?: string
    email: string
    image?: string
    twoFactorEnabled?: boolean
  }
  const isAdmin = user.role === "ADMIN"
  const is2FAEnabled = user.twoFactorEnabled === true

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/85 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <span className="font-bold tracking-tight text-sm text-foreground flex items-center gap-1.5">
                Profile Settings
              </span>
              <p className="text-[10px] text-muted-foreground">
                Manage your credentials and details
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 bg-muted/20 py-8 px-4">
        <div className="max-w-xl mx-auto space-y-6">
          <Card className="border-border/40 bg-card shadow-xl overflow-hidden relative">
            {/* Mesh decor element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Edit Profile
              </CardTitle>
              <CardDescription>
                Customize how you appear across the workspace system.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {/* Drag and Drop Circular Avatar Dropzone */}
                <div className="flex flex-col items-center sm:flex-row gap-6 bg-muted/30 border border-border/20 rounded-xl p-5">
                  <button
                    type="button"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`h-28 w-28 rounded-full border-2 flex items-center justify-center relative overflow-hidden shadow-inner shrink-0 cursor-pointer transition-all duration-300 group ${
                      dragOver
                        ? "border-primary bg-primary/10 scale-105 ring-4 ring-primary/20"
                        : "border-border/60 bg-primary/5 hover:border-primary/50 hover:shadow-md"
                    }`}
                    title="Drag & drop or click to upload avatar"
                  >
                    {/* Hidden Native File Input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileChange}
                      accept="image/jpeg,image/png,image/webp"
                    />

                    {previewUrl || imageUrl ? (
                      // biome-ignore lint/performance/noImgElement: External avatar preview element
                      <img
                        src={previewUrl || imageUrl}
                        alt="Avatar Preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                    ) : (
                      <span className="text-primary text-3xl font-extrabold uppercase select-none">
                        {name?.[0] || user.name?.[0] || user.email[0]}
                      </span>
                    )}

                    {/* standard hover overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200">
                      <Camera className="h-5 w-5 mb-1" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Upload
                      </span>
                    </div>

                    {/* dragover active overlay */}
                    {dragOver && (
                      <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex flex-col items-center justify-center text-primary transition-all duration-200">
                        <UploadCloud className="h-7 w-7 animate-pulse" />
                        <span className="text-[9px] font-bold uppercase tracking-widest mt-1">
                          Drop It!
                        </span>
                      </div>
                    )}

                    {/* uploading loader overlay */}
                    {uploadAvatarMutation.isPending && (
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px] flex flex-col items-center justify-center text-white">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="text-[9px] font-medium tracking-wide mt-1 animate-pulse">
                          Uploading...
                        </span>
                      </div>
                    )}
                  </button>

                  <div className="space-y-1.5 text-center sm:text-left flex-1">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 justify-center sm:justify-start">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Profile Photo
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto sm:mx-0">
                      Drag and drop your image directly onto the circle, or
                      click to browse.
                    </p>
                    <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start pt-1">
                      <Badge
                        variant="secondary"
                        className="text-[9px] font-medium tracking-wide py-0.5 px-2"
                      >
                        JPG, PNG, WEBP
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="text-[9px] font-medium tracking-wide py-0.5 px-2"
                      >
                        Max 2MB
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Name Input */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="display-name"
                      className="text-xs font-bold uppercase tracking-wider text-muted-foreground/90"
                    >
                      Display Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="display-name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-9 bg-muted/10 border-border/60 focus:border-primary"
                        autoComplete="off"
                        required
                      />
                    </div>
                  </div>

                  {/* Curated Presets Carousel / Grid */}
                  <div className="space-y-2 pt-1">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/90">
                      Or Select A Premium Preset
                    </Label>
                    <div className="grid grid-cols-6 gap-2 bg-muted/20 border border-border/30 rounded-xl p-3">
                      {AVATAR_PRESETS.map((preset) => {
                        const isSelected = imageUrl === preset.url
                        return (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => handleSelectPreset(preset.url)}
                            className={`aspect-square rounded-lg border flex items-center justify-center p-1 relative hover:scale-105 transition-all duration-200 ${
                              isSelected
                                ? "border-primary bg-primary/10 shadow-sm"
                                : "border-border/60 bg-card hover:border-primary/40"
                            }`}
                            title={`Select preset: ${preset.name}`}
                          >
                            {/* biome-ignore lint/performance/noImgElement: DiceBear stable avatar presets */}
                            <img
                              src={preset.url}
                              alt={preset.name}
                              className="h-full w-full object-contain"
                            />
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow">
                                <Check className="h-2 w-2" />
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Account Security Meta (Read-only fields) */}
                <div className="space-y-3.5 bg-muted/10 border border-border/20 rounded-xl p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Account Metadata
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase">
                        Email Address
                      </Label>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground overflow-hidden">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground/75" />
                        <span className="truncate">{session.user.email}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase">
                        Role Permission
                      </Label>
                      <div className="flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-muted-foreground/75" />
                        <Badge
                          variant={isAdmin ? "default" : "secondary"}
                          className="text-[9px] h-4.5 px-2 font-bold uppercase"
                        >
                          {isAdmin ? "ADMINISTRATOR" : "STANDARD USER"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2 pb-6 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="flex-1 h-10 font-semibold"
                  disabled={profileMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  className="flex-1 h-10 gap-2 font-semibold shadow-md shadow-primary/10"
                  disabled={profileMutation.isPending}
                >
                  {profileMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Patient Profile Card — only shown for PATIENT role */}
          {user.role === "PATIENT" && (
            <Card className="border-border/40 bg-card shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <Heart className="h-5 w-5 text-emerald-500" />
                  Patient Profile
                </CardTitle>
                <CardDescription>
                  Your health details help doctors provide better care.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handlePatientProfileSubmit}>
                <CardContent className="space-y-4">
                  {/* Weight & Height */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="weight"
                        className="text-xs font-medium flex items-center gap-1.5"
                      >
                        <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                        Weight (kg)
                      </Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        min="0"
                        max="500"
                        placeholder="e.g. 65"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="height"
                        className="text-xs font-medium flex items-center gap-1.5"
                      >
                        <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                        Height (cm)
                      </Label>
                      <Input
                        id="height"
                        type="number"
                        step="0.1"
                        min="0"
                        max="300"
                        placeholder="e.g. 170"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Medical History */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Basic Medical History
                    </p>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="allergies"
                        className="text-xs font-medium"
                      >
                        Allergies
                      </Label>
                      <Input
                        id="allergies"
                        type="text"
                        placeholder="e.g. Penicillin, Latex (comma-separated)"
                        value={allergies}
                        onChange={(e) => setAllergies(e.target.value)}
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="conditions"
                        className="text-xs font-medium"
                      >
                        Conditions
                      </Label>
                      <Input
                        id="conditions"
                        type="text"
                        placeholder="e.g. Asthma, Hypertension (comma-separated)"
                        value={conditions}
                        onChange={(e) => setConditions(e.target.value)}
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="medications"
                        className="text-xs font-medium"
                      >
                        Current Medications
                      </Label>
                      <Input
                        id="medications"
                        type="text"
                        placeholder="e.g. Albuterol, Amlodipine 5mg (comma-separated)"
                        value={medications}
                        onChange={(e) => setMedications(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 pb-6 flex gap-3">
                  <Button
                    type="submit"
                    size="sm"
                    className="h-9 gap-1.5"
                    disabled={patientProfileMutation.isPending}
                  >
                    {patientProfileMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Save Health Details
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          {/* Option A: Two-Factor Authentication (2FA) Card */}
          <Card className="border-border/40 bg-card shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Two-Factor Authentication (2FA)
              </CardTitle>
              <CardDescription>
                Add a strong extra layer of defense to secure your workspace
                account.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {is2FAEnabled ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 border border-emerald-500/20 rounded-xl bg-emerald-500/5">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                        Two-Factor Authentication is Active
                        <Badge
                          variant="default"
                          className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[9px] uppercase font-bold py-0.5 px-1.5 h-4.5"
                        >
                          Secure
                        </Badge>
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Your account is fully hardened. Every login will require
                        a 6-digit TOTP code generated in your mobile
                        authenticator app.
                      </p>
                    </div>
                  </div>

                  {showDisable2FAConfirm ? (
                    <div className="p-4 border border-red-500/20 rounded-xl bg-red-500/5 space-y-4">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-red-500 flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4" /> Confirm Disabling
                        2FA
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Disabling 2FA reduces your account security. Please
                        verify your current password to proceed.
                      </p>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="disable-password"
                            className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                          >
                            Account Password
                          </Label>
                          <Input
                            id="disable-password"
                            type="password"
                            placeholder="••••••••"
                            value={disablePassword}
                            onChange={(e) => setDisablePassword(e.target.value)}
                            className="bg-background border-border/60"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => {
                              setShowDisable2FAConfirm(false)
                              setDisablePassword("")
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="flex-1 text-xs font-semibold"
                            onClick={() => disable2FAMutation.mutate()}
                            disabled={disable2FAMutation.isPending}
                          >
                            {disable2FAMutation.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Disable Security"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full text-xs font-semibold border-border hover:bg-red-500/5 hover:text-red-500 hover:border-red-500/30"
                      onClick={() => setShowDisable2FAConfirm(true)}
                    >
                      Disable Two-Factor Authentication
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 border border-border/20 rounded-xl bg-muted/10">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm text-foreground">
                        Protect Your Account
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Time-based One-Time Passwords (TOTP) protect your
                        account even if your email and password credentials are
                        leaked in third-party database breaches.
                      </p>
                    </div>
                  </div>

                  {showTwoFactorWizard ? (
                    <div className="p-4 border border-border/40 rounded-xl bg-muted/5 space-y-4 relative">
                      <div className="absolute top-2 right-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setShowTwoFactorWizard(false)
                            setTwoFactorStep("password")
                            setTwoFactorPassword("")
                            setTwoFactorCode("")
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>

                      {twoFactorStep === "password" && (
                        <div className="space-y-4">
                          <h5 className="font-semibold text-xs uppercase tracking-wider text-primary">
                            Step 1: Verify Password
                          </h5>
                          <p className="text-xs text-muted-foreground">
                            Please confirm your account password to generate a
                            secure 2FA activation token.
                          </p>
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <Label
                                htmlFor="2fa-password"
                                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                              >
                                Account Password
                              </Label>
                              <Input
                                id="2fa-password"
                                type="password"
                                placeholder="••••••••"
                                value={twoFactorPassword}
                                onChange={(e) =>
                                  setTwoFactorPassword(e.target.value)
                                }
                                className="bg-background border-border/60"
                              />
                            </div>
                            <Button
                              type="button"
                              className="w-full text-xs font-bold"
                              onClick={() => enable2FAMutation.mutate()}
                              disabled={
                                enable2FAMutation.isPending ||
                                !twoFactorPassword
                              }
                            >
                              {enable2FAMutation.isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                "Generate TOTP Key"
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {twoFactorStep === "verify" && (
                        <div className="space-y-4">
                          <h5 className="font-semibold text-xs uppercase tracking-wider text-primary">
                            Step 2: Scan QR & Verify
                          </h5>
                          <p className="text-xs text-muted-foreground">
                            Scan this QR code with Google Authenticator,
                            1Password, or Authy, then enter the 6-digit code.
                          </p>
                          <div className="flex flex-col items-center justify-center bg-white p-3 rounded-xl border border-border/40 max-w-[200px] mx-auto shadow-inner">
                            {/* biome-ignore lint/performance/noImgElement: Google Charts API TOTP QR code generator */}
                            <img
                              src={`https://chart.googleapis.com/chart?chs=180x180&chld=M|0&cht=qr&chl=${encodeURIComponent(totpUri)}`}
                              alt="Scan QR code to enable 2FA"
                              className="h-[180px] w-[180px] object-contain"
                            />
                          </div>
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <Label
                                htmlFor="2fa-code"
                                className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center block"
                              >
                                Authenticator App 6-Digit Code
                              </Label>
                              <Input
                                id="2fa-code"
                                type="text"
                                maxLength={6}
                                placeholder="000 000"
                                value={twoFactorCode}
                                onChange={(e) =>
                                  setTwoFactorCode(e.target.value)
                                }
                                className="text-center font-mono tracking-widest text-lg font-bold bg-background border-border/60 h-11"
                              />
                            </div>
                            <Button
                              type="button"
                              className="w-full text-xs font-bold"
                              onClick={() => verify2FAMutation.mutate()}
                              disabled={
                                verify2FAMutation.isPending ||
                                twoFactorCode.length < 6
                              }
                            >
                              {verify2FAMutation.isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                "Complete Activation"
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {twoFactorStep === "backup" && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-1.5 text-emerald-500">
                            <CheckCircle2 className="h-4.5 w-4.5" />
                            <h5 className="font-semibold text-xs uppercase tracking-wider">
                              Step 3: Save Backup Codes
                            </h5>
                          </div>
                          <p className="text-xs text-muted-foreground leading-normal">
                            Keep these backup codes somewhere highly secure. You
                            can use them to recover access if you lose your
                            phone or authenticator app.
                          </p>
                          <div className="bg-muted/30 border border-border/30 rounded-xl p-3.5 font-mono text-xs select-all text-foreground grid grid-cols-2 gap-x-4 gap-y-1 shadow-inner">
                            {backupCodes.map((code) => (
                              <div
                                key={code}
                                className="flex items-center gap-1.5"
                              >
                                <span className="text-[10px] text-muted-foreground select-none">
                                  •
                                </span>
                                <span className="tracking-wider">{code}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="flex-1 text-xs gap-1.5 h-9"
                              onClick={downloadBackupCodes}
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="flex-1 text-xs font-semibold h-9"
                              onClick={() => {
                                setShowTwoFactorWizard(false)
                                setTwoFactorStep("password")
                                setTwoFactorPassword("")
                                setTwoFactorCode("")
                                setBackupCodes([])
                              }}
                            >
                              Done
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="default"
                      className="w-full text-xs font-semibold shadow-md shadow-primary/10 h-10"
                      onClick={() => setShowTwoFactorWizard(true)}
                    >
                      Enable Two-Factor Authentication
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Option 3: Hardened Credential & Password Update Card */}
          <Card className="border-border/40 bg-card shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Change Password
              </CardTitle>
              <CardDescription>
                Ensure your account is secure by using a strong, complex
                credential.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handlePasswordChange}>
              <CardContent className="space-y-5">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="current-password"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground/90"
                  >
                    Current Password
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pl-9 bg-muted/10 border-border/60 focus:border-primary"
                      required
                    />
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="new-password"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground/90"
                  >
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 bg-muted/10 border-border/60 focus:border-primary"
                      required
                    />
                  </div>

                  {/* Password Strength Meter */}
                  {password.length > 0 && (
                    <div className="space-y-2 pt-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">Strength:</span>
                        <span
                          className={
                            metCount <= 2
                              ? "text-red-500"
                              : metCount <= 4
                                ? "text-amber-500"
                                : "text-emerald-500"
                          }
                        >
                          {strengthLabel}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${strengthColor}`}
                          style={{ width: `${strengthPercent}%` }}
                        />
                      </div>

                      {/* Checklist */}
                      <ul className="space-y-1.5 pt-1 text-[11px] text-muted-foreground">
                        {passwordRequirements.map((r) => (
                          <li key={r.label} className="flex items-center gap-2">
                            {r.met ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                            )}
                            <span
                              className={
                                r.met
                                  ? "text-foreground font-medium"
                                  : "text-muted-foreground/70"
                              }
                            >
                              {r.label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="confirm-password"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground/90"
                  >
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-9 bg-muted/10 border-border/60 focus:border-primary"
                      required
                    />
                  </div>
                  {confirmPassword.length > 0 && (
                    <div className="text-[10px] pt-0.5">
                      {password === confirmPassword ? (
                        <span className="text-emerald-500 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Passwords match
                        </span>
                      ) : (
                        <span className="text-red-500 font-semibold flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> Passwords do not match
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Revoke other active sessions checkbox */}
                <div className="flex items-center space-x-2 pt-2 bg-muted/15 border border-border/20 rounded-xl p-3">
                  <input
                    id="revoke-other-devices"
                    type="checkbox"
                    checked={revokeOtherDevices}
                    onChange={(e) => setRevokeOtherDevices(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="revoke-other-devices"
                      className="text-xs font-bold uppercase tracking-wide text-foreground cursor-pointer"
                    >
                      Revoke Other Device Sessions
                    </Label>
                    <p className="text-[10px] text-muted-foreground leading-normal">
                      Instantly log out of all other browsers, laptops, and
                      mobile sessions upon changing your password.
                    </p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2 pb-6 flex gap-3">
                <Button
                  type="submit"
                  variant="default"
                  className="w-full h-10 gap-2 font-semibold shadow-md shadow-primary/10"
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Update Password
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Option B: Security Logs & Alerts Inbox Card */}
          <Card className="border-border/40 bg-card shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <CardHeader className="space-y-1 pb-4 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <Inbox className="h-5 w-5 text-primary" />
                  Security Logs & Alerts
                </CardTitle>
                <CardDescription>
                  Audit logs and system security alerts triggered for your
                  account.
                </CardDescription>
              </div>
              {alerts && alerts.filter((a) => !a.read).length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs font-bold text-primary gap-1"
                  onClick={() => readAlertsMutation.mutate()}
                  disabled={readAlertsMutation.isPending}
                >
                  {readAlertsMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckSquare className="h-3.5 w-3.5" />
                  )}
                  Mark all read
                </Button>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {alertsLoading ? (
                <div className="space-y-3">
                  <div className="h-14 w-full rounded-xl bg-muted/10 border border-border/20 animate-pulse" />
                  <div className="h-14 w-full rounded-xl bg-muted/10 border border-border/20 animate-pulse" />
                </div>
              ) : alerts && alerts.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {alerts.map((alert) => {
                    const isUnread = !alert.read
                    const isSessionRevoked = alert.title.includes("Session")
                    const is2FA =
                      alert.title.includes("2FA") ||
                      alert.title.includes("Factor")
                    const isPassword =
                      alert.title.includes("Password") ||
                      alert.title.includes("Credential")

                    return (
                      <div
                        key={alert.id}
                        className={`flex gap-3 p-3.5 rounded-xl border transition-all duration-300 ${
                          isUnread
                            ? "bg-primary/5 border-primary/20 shadow-sm"
                            : "bg-muted/5 border-border/20"
                        }`}
                      >
                        <div
                          className={`h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 shadow-sm mt-0.5 ${
                            isUnread
                              ? "bg-primary/10 border-primary/20 text-primary"
                              : "bg-muted border-border/30 text-muted-foreground"
                          }`}
                        >
                          {isPassword ? (
                            <Lock className="h-4 w-4" />
                          ) : isSessionRevoked ? (
                            <Laptop className="h-4 w-4" />
                          ) : is2FA ? (
                            <ShieldCheck className="h-4 w-4" />
                          ) : (
                            <Shield className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-xs text-foreground truncate">
                              {alert.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                              {new Date(alert.createdAt).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {alert.message}
                          </p>
                          {(alert.ipAddress || alert.userAgent) && (
                            <div className="flex items-center gap-2 pt-1 font-mono text-[9px] text-muted-foreground/60 flex-wrap">
                              {alert.ipAddress && (
                                <span className="bg-muted px-1 rounded border border-border/5">
                                  IP: {alert.ipAddress}
                                </span>
                              )}
                              {alert.userAgent && (
                                <span className="truncate max-w-[180px]">
                                  UA:{" "}
                                  {
                                    getSessionDisplayDetails(alert.userAgent)
                                      .browser
                                  }
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-border/60 rounded-xl bg-muted/10 space-y-2">
                  <Inbox className="h-8 w-8 text-muted-foreground/60 animate-pulse" />
                  <h4 className="font-semibold text-sm text-foreground">
                    Your Inbox is Clean
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-xs leading-normal">
                    There are no recent security alerts or changes detected on
                    your account.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Devices & Sessions Card */}
          <Card className="border-border/40 bg-card shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                <Laptop className="h-5 w-5 text-primary" />
                Active Devices & Sessions
              </CardTitle>
              <CardDescription>
                View and manage other browsers and devices currently logged into
                your account.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {sessionsLoading ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-4 border border-border/20 rounded-xl bg-muted/10 animate-pulse">
                    <div className="h-10 w-10 rounded-lg bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-muted rounded" />
                      <div className="h-3 w-48 bg-muted rounded" />
                    </div>
                    <div className="h-8 w-20 bg-muted rounded-md" />
                  </div>
                  <div className="flex items-center gap-4 p-4 border border-border/20 rounded-xl bg-muted/10 animate-pulse">
                    <div className="h-10 w-10 rounded-lg bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-muted rounded" />
                      <div className="h-3 w-48 bg-muted rounded" />
                    </div>
                    <div className="h-8 w-20 bg-muted rounded-md" />
                  </div>
                </div>
              ) : sessions && sessions.length > 0 ? (
                <div className="divide-y divide-border/30 border border-border/20 bg-muted/5 rounded-xl overflow-hidden">
                  {sessions.map((s) => {
                    const { browser, os, deviceType } =
                      getSessionDisplayDetails(s.userAgent)
                    return (
                      <div
                        key={s.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-muted/15 transition-all"
                      >
                        <div className="flex items-start gap-4 overflow-hidden">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-sm mt-0.5">
                            {deviceType === "mobile" ? (
                              <Smartphone className="h-5 w-5" />
                            ) : (
                              <Laptop className="h-5 w-5" />
                            )}
                          </div>
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-foreground truncate">
                                {browser} on {os}
                              </span>
                              {s.isCurrent ? (
                                <Badge
                                  variant="default"
                                  className="text-[9px] h-4.5 px-2 font-bold uppercase tracking-wide bg-primary/15 border border-primary/30 text-primary"
                                >
                                  This Device
                                </Badge>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] h-4.5 px-2 font-bold uppercase tracking-wide"
                                >
                                  Active
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-normal flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border/10 shrink-0">
                                {s.ipAddress ?? "Unknown IP"}
                              </span>
                              <span className="shrink-0">•</span>
                              <span className="truncate">
                                Created{" "}
                                {new Date(s.createdAt).toLocaleString(
                                  undefined,
                                  {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  },
                                )}
                              </span>
                            </p>
                          </div>
                        </div>

                        {!s.isCurrent && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs font-semibold shrink-0 border-border/60 hover:text-destructive hover:bg-destructive/5 hover:border-destructive/20"
                            onClick={() => revokeSessionMutation.mutate(s.id)}
                            disabled={revokeSessionMutation.isPending}
                          >
                            {revokeSessionMutation.isPending &&
                            revokeSessionMutation.variables === s.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            Revoke
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-border/60 rounded-xl bg-muted/10 space-y-2">
                  <Globe className="h-8 w-8 text-muted-foreground/60 animate-pulse" />
                  <h4 className="font-semibold text-sm text-foreground">
                    No active sessions
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    You don't have any other active sessions. Only this device
                    is currently logged in.
                  </p>
                </div>
              )}
            </CardContent>

            {sessions && sessions.filter((s) => !s.isCurrent).length > 0 && (
              <CardFooter className="pt-2 pb-6 border-t border-border/20 bg-muted/5 flex justify-end">
                <Button
                  type="button"
                  variant="destructive"
                  className="h-9 gap-1.5 text-xs font-semibold shadow-md shadow-destructive/10"
                  onClick={() => revokeOthersMutation.mutate()}
                  disabled={revokeOthersMutation.isPending}
                >
                  {revokeOthersMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LogOut className="h-3.5 w-3.5" />
                  )}
                  Sign Out Other Devices
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
