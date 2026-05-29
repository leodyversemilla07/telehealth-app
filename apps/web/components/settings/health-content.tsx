"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Separator } from "@workspace/ui/components/separator"
import { Loader2, Save } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

interface PatientProfile {
  dob: string | null
  sex: string | null
  phone: string | null
  address: string | null
  philhealthNumber: string | null
  weight: number | null
  height: number | null
  medicalHistory: Record<string, unknown> | null
}

export function HealthContent() {
  const queryClient = useQueryClient()

  const [dob, setDob] = useState("")
  const [sex, setSex] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [philhealthNumber, setPhilhealthNumber] = useState("")
  const [weight, setWeight] = useState("")
  const [height, setHeight] = useState("")
  const [allergies, setAllergies] = useState("")
  const [conditions, setConditions] = useState("")
  const [medications, setMedications] = useState("")

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
      setWeight(profile.weight != null ? String(profile.weight) : "")
      setHeight(profile.height != null ? String(profile.height) : "")
      const mh = profile.medicalHistory as {
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
  }, [profile])

  const mutation = useMutation({
    mutationFn: (data: {
      dob?: string
      sex?: string
      phone?: string
      address?: string
      philhealthNumber?: string
      weight?: number
      height?: number
      medicalHistory?: Record<string, unknown>
    }) => apiClient.patch("/patients/me", data),
    onSuccess: () => {
      toast.success("Profile saved!")
      queryClient.invalidateQueries({ queryKey: ["patient-profile"] })
    },
    onError: (err: { message?: string }) =>
      toast.error(err.message || "Failed"),
  })

  function handleSubmit() {
    const data: Record<string, unknown> = {}

    if (dob) data.dob = dob
    if (sex) data.sex = sex
    if (phone) data.phone = phone
    if (address) data.address = address
    if (philhealthNumber) data.philhealthNumber = philhealthNumber
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

    mutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Personal Information</h2>
        <p className="text-sm text-muted-foreground">
          Your details help doctors provide better care
        </p>
      </div>

      <div className="space-y-4">
        {/* Personal Details */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">
            Personal Details
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dob">Birthday</Label>
              <Input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sex">Sex</Label>
              <Select value={sex} onValueChange={(v) => setSex(v ?? "")}>
                <SelectTrigger id="sex">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
        </div>

        <Separator />

        {/* Physical Details */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">
            Physical Details
          </p>

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
        </div>

        <Separator />

        {/* Medical History */}
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

        <Button onClick={handleSubmit} disabled={mutation.isPending}>
          {mutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Profile
        </Button>
      </div>
    </div>
  )
}
