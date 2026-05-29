"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
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
import { Separator } from "@workspace/ui/components/separator"
import { Textarea } from "@workspace/ui/components/textarea"
import { DatePicker } from "@workspace/ui/components/date-picker"
import { Loader2, ShieldAlert, Stethoscope } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

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

export default function DoctorRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    specialty: "",
    prcLicenseNumber: "",
    prcLicenseExpiry: "",
    philhealthAccreditation: "",
    pdeaS2License: "",
    pdeaS2Expiry: "",
    bio: "",
    clinicAddress: "",
    pricePerVisit: "",
  })

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await apiClient.post("/doctors/register", form)
      toast.success("Doctor profile created successfully!")
      router.push("/doctor/dashboard")
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again."
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
      <div className="max-w-2xl mx-auto w-full">
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto mb-3">
              <Stethoscope className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Complete Your Doctor Profile
            </CardTitle>
            <CardDescription className="text-sm">
              Provide your professional details to complete registration. Your
              profile will be reviewed by our admin team for verification.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Professional Information */}
              <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Professional Information
                </p>

                <Field>
                  <FieldLabel htmlFor="specialty">Specialty *</FieldLabel>
                  <Select
                    value={form.specialty}
                    onValueChange={(v) => update("specialty", v ?? "")}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prcLicenseNumber">
                      PRC License Number *
                    </Label>
                    <Input
                      id="prcLicenseNumber"
                      placeholder="e.g. 123456"
                      value={form.prcLicenseNumber}
                      onChange={(e) =>
                        update("prcLicenseNumber", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prcLicenseExpiry">
                      PRC License Expiry *
                    </Label>
                    <DatePicker
                      id="prcLicenseExpiry"
                      value={form.prcLicenseExpiry}
                      onChange={(val) => update("prcLicenseExpiry", val)}
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
                      placeholder="e.g. PHIC-123456"
                      value={form.philhealthAccreditation}
                      onChange={(e) =>
                        update("philhealthAccreditation", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pdeaS2License">PDEA S2 License</Label>
                    <Input
                      id="pdeaS2License"
                      placeholder="e.g. PDEA-S2-123456"
                      value={form.pdeaS2License}
                      onChange={(e) => update("pdeaS2License", e.target.value)}
                    />
                  </div>
                </div>

                {form.pdeaS2License && (
                  <div className="space-y-2">
                    <Label htmlFor="pdeaS2Expiry">PDEA S2 Expiry</Label>
                    <DatePicker
                      id="pdeaS2Expiry"
                      value={form.pdeaS2Expiry}
                      onChange={(val) => update("pdeaS2Expiry", val)}
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* Practice Details */}
              <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Practice Details
                </p>

                <div className="space-y-2">
                  <Label htmlFor="clinicAddress">Clinic Address</Label>
                  <Input
                    id="clinicAddress"
                    placeholder="e.g. 123 Medical Plaza, Makati City"
                    value={form.clinicAddress}
                    onChange={(e) => update("clinicAddress", e.target.value)}
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
                    value={form.pricePerVisit}
                    onChange={(e) => update("pricePerVisit", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    className="min-h-[100px]"
                    placeholder="Tell patients about yourself, your experience, and your approach to care..."
                    value={form.bio}
                    onChange={(e) => update("bio", e.target.value)}
                    maxLength={500}
                  />
                  <p className="text-[10px] text-muted-foreground text-right">
                    {form.bio.length}/500
                  </p>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 p-3 rounded-xl">
                  <ShieldAlert className="size-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push("/patient/dashboard")}
                >
                  Skip for now
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={
                    loading ||
                    !form.specialty ||
                    !form.prcLicenseNumber ||
                    !form.prcLicenseExpiry
                  }
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
