"use client"

import { useMutation } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
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

export function ProfileContent() {
  const { data: session, refetch } = authClient.useSession()
  const [name, setName] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
          Update your name and profile photo
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
            <button
              key={preset.name}
              type="button"
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
            </button>
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
    </div>
  )
}
