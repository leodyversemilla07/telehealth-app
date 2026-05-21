"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { UserSessionDto } from "@workspace/shared"
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
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  Globe,
  Key,
  Laptop,
  Loader2,
  Lock,
  LogOut,
  Mail,
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
      // Sync local Better Auth session cache
      await refetch()
    },
    // biome-ignore lint/suspicious/noExplicitAny: React Query error payload structure can vary dynamically
    onError: (err: any) => {
      toast.error(err.message || "Failed to update profile")
    },
  })

  // Avatar upload mutation (Option 4)
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
    },
    // biome-ignore lint/suspicious/noExplicitAny: React Query errors can vary dynamically
    onError: (err: any) => {
      toast.error(err.message || "Failed to upload avatar")
      setPreviewUrl(null)
    },
  })

  // Password change mutation (Option 3)
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
    },
    // biome-ignore lint/suspicious/noExplicitAny: React Query errors can vary dynamically
    onError: (err: any) => {
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
    enabled: !!session, // only fetch if user is logged in
  })

  // Revoke a single active session
  const revokeSessionMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/users/me/sessions/${id}`),
    onSuccess: () => {
      toast.success("Device session revoked successfully")
      refetchSessions()
    },
    // biome-ignore lint/suspicious/noExplicitAny: React Query error payload structure can vary dynamically
    onError: (err: any) => {
      toast.error(err.message || "Failed to revoke session")
    },
  })

  // Revoke all other active sessions
  const revokeOthersMutation = useMutation({
    mutationFn: () => apiClient.delete("/users/me/sessions"),
    onSuccess: () => {
      toast.success("All other active device sessions revoked")
      refetchSessions()
    },
    // biome-ignore lint/suspicious/noExplicitAny: React Query error payload structure can vary dynamically
    onError: (err: any) => {
      toast.error(err.message || "Failed to revoke other sessions")
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
    role?: string
    name?: string
    email: string
    image?: string
  }
  const isAdmin = user.role === "ADMIN"

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

                    {/* Image Preview / Current Image */}
                    {previewUrl || imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      // biome-ignore lint/performance/noImgElement: dynamic and uploaded avatar photos require flexible rendering
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
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {/* biome-ignore lint/performance/noImgElement: dynamic external avatar seeds cannot be pre-whitelisted in NextImage */}
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

          {/* Option 3: Hardened Credential & Password Update Card */}
          <Card className="border-border/40 bg-card shadow-xl overflow-hidden relative">
            {/* Mesh decor element */}
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
                        {passwordRequirements.map((r, i) => (
                          <li
                            // biome-ignore lint/suspicious/noArrayIndexKey: Static checklist elements
                            key={i}
                            className="flex items-center gap-2"
                          >
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
