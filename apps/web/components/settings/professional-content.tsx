"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { DatePicker } from "@workspace/ui/components/date-picker"
import { Field, FieldLabel } from "@workspace/ui/components/field"
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
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"
import { Save, Stethoscope } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

interface DoctorProfile {
  id: string
  specialty: string
  prcLicenseNumber: string
  prcLicenseExpiry: string
  philhealthAccreditation: string | null
  pdeaS2License: string | null
  pdeaS2Expiry: string | null
  bio: string | null
  clinicAddress: string | null
  pricePerVisit: number | string
  isApproved: boolean
}

const SPECIALTIES = [
  "General Practitioner",
  "Internal Medicine",
  "Pediatrics",
  "Obstetrics & Gynecology",
  "Cardiology",
  "Dermatology",
  "Orthopedics",
  "Neurology",
  "Psychiatry",
  "Ophthalmology",
  "ENT",
  "Pulmonology",
  "Gastroenterology",
  "Urology",
  "Endocrinology",
  "Radiology",
  "Anesthesiology",
  "Pathology",
  "Emergency Medicine",
  "Family Medicine",
  "Surgery",
  "Other",
]

export function ProfessionalContent() {
  const queryClient = useQueryClient()

  const [specialty, setSpecialty] = useState("")
  const [bio, setBio] = useState("")
  const [clinicAddress, setClinicAddress] = useState("")
  const [pricePerVisit, setPricePerVisit] = useState("")
  const [prcLicenseNumber, setPrcLicenseNumber] = useState("")
  const [prcLicenseExpiry, setPrcLicenseExpiry] = useState("")
  const [philhealthAccreditation, setPhilhealthAccreditation] = useState("")
  const [pdeaS2License, setPdeaS2License] = useState("")
  const [_pdeaS2Expiry, setPdeaS2Expiry] = useState("")
  const [isApproved, setIsApproved] = useState(false)

  const { data: profile, error: profileError } = useQuery({
    queryKey: ["doctor-profile"],
    queryFn: () => apiClient.get<DoctorProfile>("/doctors/profile"),
  })

  const needsRegistration =
    profileError &&
    ((profileError as { statusCode?: number }).statusCode === 404 ||
      (profileError as { message?: string }).message?.includes("not found"))

  useEffect(() => {
    if (profile) {
      setSpecialty(profile.specialty ?? "")
      setBio(profile.bio ?? "")
      setClinicAddress(profile.clinicAddress ?? "")
      setPricePerVisit(
        profile.pricePerVisit != null ? String(profile.pricePerVisit) : "",
      )
      setPrcLicenseNumber(profile.prcLicenseNumber ?? "")
      setPrcLicenseExpiry(
        profile.prcLicenseExpiry
          ? (new Date(profile.prcLicenseExpiry).toISOString().split("T")[0] ??
              "")
          : "",
      )
      setPhilhealthAccreditation(profile.philhealthAccreditation ?? "")
      setPdeaS2License(profile.pdeaS2License ?? "")
      setPdeaS2Expiry(
        profile.pdeaS2Expiry
          ? (new Date(profile.pdeaS2Expiry).toISOString().split("T")[0] ?? "")
          : "",
      )
      setIsApproved(profile.isApproved)
    }
  }, [profile])

  const mutation = useMutation({
    mutationFn: (data: {
      specialty?: string
      bio?: string
      clinicAddress?: string
      pricePerVisit?: string
    }) => apiClient.patch("/doctors/profile", data),
    onSuccess: () => {
      toast.success("Professional info saved!")
      queryClient.invalidateQueries({ queryKey: ["doctor-profile"] })
    },
    onError: (err: { message?: string }) =>
      toast.error(err.message || "Failed to save"),
  })

  function handleSubmit() {
    const data: Record<string, string> = {}
    if (specialty) data.specialty = specialty
    if (bio) data.bio = bio
    if (clinicAddress) data.clinicAddress = clinicAddress
    if (pricePerVisit) data.pricePerVisit = pricePerVisit
    mutation.mutate(
      data as {
        specialty?: string
        bio?: string
        clinicAddress?: string
        pricePerVisit?: string
      },
    )
  }

  if (needsRegistration) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Professional Information</h2>
          <p className="text-sm text-muted-foreground">
            Manage your professional details and practice information
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <Stethoscope className="h-12 w-12 text-muted-foreground" />
          <div className="space-y-2">
            <p className="text-lg font-medium">
              Complete your doctor registration
            </p>
            <p className="text-sm text-muted-foreground max-w-sm">
              You need to register as a doctor before you can manage your
              professional information.
            </p>
          </div>
          <Button
            render={<Link href="/doctor/register" />}
            nativeButton={false}
          >
            Complete Registration
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Professional Information</h2>
        <p className="text-sm text-muted-foreground">
          Manage your professional details and practice information
        </p>
      </div>

      <div className="space-y-4">
        {!isApproved && (
          <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-3 rounded-xl">
            <Stethoscope className="size-4 shrink-0" />
            <p>
              Your profile is pending admin verification. Some fields may not be
              visible to patients until approved.
            </p>
          </div>
        )}

        {/* Licensing */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">
            Licensing & Credentials
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prcLicenseNumber">PRC License Number</Label>
              <Input
                id="prcLicenseNumber"
                value={prcLicenseNumber}
                disabled
                className="bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">
                Contact admin to update your license information
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prcLicenseExpiry">PRC License Expiry</Label>
              <DatePicker
                id="prcLicenseExpiry"
                value={prcLicenseExpiry}
                disabled
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="philhealthAccreditation">
                PhilHealth Accreditation
              </Label>
              <Input
                id="philhealthAccreditation"
                value={philhealthAccreditation}
                disabled
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pdeaS2License">PDEA S2 License</Label>
              <Input
                id="pdeaS2License"
                value={pdeaS2License}
                disabled
                className="bg-muted/50"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Editable Professional Details */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">
            Practice Details
          </p>

          <Field>
            <FieldLabel htmlFor="specialty">Specialty</FieldLabel>
            <Select
              value={specialty}
              onValueChange={(v) => setSpecialty(v ?? "")}
            >
              <SelectTrigger id="specialty">
                <SelectValue placeholder="Select your specialty" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {SPECIALTIES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <div className="space-y-2">
            <Label htmlFor="clinicAddress">Clinic Address</Label>
            <Input
              id="clinicAddress"
              placeholder="e.g. 123 Medical Plaza, Makati City"
              value={clinicAddress}
              onChange={(e) => setClinicAddress(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pricePerVisit">Price per Visit (PHP)</Label>
            <Input
              id="pricePerVisit"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 500.00"
              value={pricePerVisit}
              onChange={(e) => setPricePerVisit(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              className="min-h-[100px]"
              placeholder="Tell patients about your experience and approach to care..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/500
            </p>
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={mutation.isPending}>
          {mutation.isPending ? (
            <Spinner className="mr-2 h-4 w-4" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Professional Info
        </Button>
      </div>
    </div>
  )
}
