"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { DatePicker } from "@workspace/ui/components/date-picker"
import {
  Field,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Separator } from "@workspace/ui/components/separator"
import { Camera, Loader2, Save } from "lucide-react"
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

interface PatientProfile {
  dob: string | null
  sex: string | null
  phone: string | null
  address: string | null
  philhealthNumber: string | null
}

export function ProfileContent() {
  const queryClient = useQueryClient()
  const { data: session, refetch } = authClient.useSession()
  const [name, setName] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dob, setDob] = useState("")
  const [sex, setSex] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [philhealthNumber, setPhilhealthNumber] = useState("")

  const { data: profile } = useQuery({
    queryKey: ["patient-profile"],
    queryFn: () => apiClient.get<PatientProfile>("/patients/me"),
  })

  useEffect(() => {
    if (profile) {
      if (profile.dob) {
        const d = new Date(profile.dob)
        setDob(d.toISOString().split("T")[0] ?? "")
      }
      setSex(profile.sex ?? "")
      setPhone(profile.phone ?? "")
      setAddress(profile.address ?? "")
      setPhilhealthNumber(profile.philhealthNumber ?? "")
    }
  }, [profile])

  useEffect(() => {
    if (session?.user) {
      const u = session.user as { name?: string; image?: string }
      setName(u.name ?? "")
      setImageUrl(u.image ?? "")
    }
  }, [session])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const profileMutation = useMutation({
    mutationFn: (data: { name: string; image?: string }) =>
      apiClient.patch("/users/me", data),
    onSuccess: () => {
      toast.success("Profile updated!")
      refetch()
    },
    onError: (err: { message?: string }) =>
      toast.error(err.message || "Failed"),
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("avatar", file)
      return apiClient.post<{ url: string }>("/users/me/avatar", formData)
    },
    onSuccess: (data) => {
      setImageUrl(data.url)
      setPreviewUrl(null)
      toast.success("Avatar uploaded!")
      refetch()
    },
    onError: (err: { message?: string }) =>
      toast.error(err.message || "Upload failed"),
  })

  const patientMutation = useMutation({
    mutationFn: (data: {
      dob?: string
      sex?: string
      phone?: string
      address?: string
      philhealthNumber?: string
    }) => apiClient.patch("/patients/me", data),
    onSuccess: () => {
      toast.success("Personal details saved!")
      queryClient.invalidateQueries({ queryKey: ["patient-profile"] })
    },
    onError: (err: { message?: string }) =>
      toast.error(err.message || "Failed"),
  })

  function handleUpload(file: File) {
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
    uploadMutation.mutate(file)
  }

  const user = session?.user as { email: string; role?: string } | undefined

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="text-sm text-muted-foreground">
          Update your name, photo, and personal details
        </p>
      </div>

      <div className="space-y-4">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative h-16 w-16 rounded-full border-2 border-border hover:border-primary/50 flex items-center justify-center overflow-hidden transition-all"
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleUpload(f)
              }}
              accept="image/jpeg,image/png,image/webp"
            />
            {previewUrl || imageUrl ? (
              <img
                src={previewUrl || imageUrl}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-lg font-bold text-muted-foreground uppercase">
                {name?.[0] || user?.email?.[0] || "?"}
              </span>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera className="h-4 w-4 text-white" />
            </div>
            {uploadMutation.isPending && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="h-4 w-4 text-white animate-spin" />
              </div>
            )}
          </button>
          <div className="text-sm">
            <p className="font-medium">{user?.email}</p>
            <p className="text-muted-foreground text-xs">
              Click to upload a photo
            </p>
          </div>
        </div>

        {/* Presets */}
        <div className="flex gap-2">
          {AVATAR_PRESETS.map((preset) => (
            <Button
              key={preset.name}
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                setImageUrl(preset.url)
                profileMutation.mutate({ name: name || "", image: preset.url })
              }}
              className={`h-10 w-10 rounded-full border-2 overflow-hidden hover:scale-110 transition-transform ${
                imageUrl === preset.url
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border"
              }`}
            >
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

        <Button
          onClick={() =>
            profileMutation.mutate({ name, image: imageUrl || undefined })
          }
          disabled={profileMutation.isPending}
        >
          {profileMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save
        </Button>
      </div>

      <Separator />

      {/* Personal Details */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground">
          Personal Details
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dob">Birthday</Label>
            <DatePicker
              id="dob"
              value={dob}
              onChange={(val) => setDob(val)}
              max={new Date().toISOString().split("T")[0]}
              placeholder="Select birthday"
            />
          </div>
          <Field>
            <FieldLabel htmlFor="sex">Sex</FieldLabel>
            <Select value={sex} onValueChange={(v) => setSex(v ?? "")}>
              <SelectTrigger id="sex">
                <SelectValue placeholder="Select">
                  {sex
                    ? sex === "male"
                      ? "Male"
                      : sex === "female"
                        ? "Female"
                        : "Other"
                    : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>

      <Separator />

      {/* Contact Details */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground">
          Contact Details
        </p>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="e.g. +63 917 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            placeholder="e.g. 123 Medical Plaza, Makati City"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="philhealth">PhilHealth Number</Label>
          <Input
            id="philhealth"
            placeholder="e.g. 12-3456789012"
            value={philhealthNumber}
            onChange={(e) => setPhilhealthNumber(e.target.value)}
          />
        </div>

        <Button
          onClick={() =>
            patientMutation.mutate({
              dob: dob || undefined,
              sex: sex || undefined,
              phone: phone || undefined,
              address: address || undefined,
              philhealthNumber: philhealthNumber || undefined,
            })
          }
          disabled={patientMutation.isPending}
        >
          {patientMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Personal Details
        </Button>
      </div>
    </div>
  )
}
