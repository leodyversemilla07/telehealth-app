"use client"

import { useMutation } from "@tanstack/react-query"
import type { DoctorProfileDto } from "@workspace/shared"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  MapPin,
  Sparkles,
  Stethoscope,
} from "lucide-react"
import { Spinner } from "@workspace/ui/components/spinner"
import { useState } from "react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

interface RecommendationResponse {
  specialties: string[]
  doctors: DoctorProfileDto[]
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(price)
}

export default function RecommendationsPage() {
  const [symptoms, setSymptoms] = useState("")
  const [result, setResult] = useState<RecommendationResponse | null>(null)

  const mutation = useMutation({
    mutationFn: (data: { symptoms: string }) =>
      apiClient.post<RecommendationResponse, { symptoms: string }>(
        "/recommendations",
        data,
      ),
    onSuccess: (data) => {
      setResult(data)
      toast.success(`Found ${data.doctors.length} matching specialists`)
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to get recommendations")
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!symptoms.trim()) {
      toast.error("Please describe your symptoms")
      return
    }
    mutation.mutate({ symptoms })
  }

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
            AI Doctor Recommendations
          </CardTitle>
          <CardDescription className="text-sm">
            Describe your symptoms and our AI will find the right specialists for
            you.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Symptom Input */}
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" />
            Describe Your Symptoms
          </CardTitle>
          <CardDescription className="text-xs">
            Our NVIDIA NIM-powered AI will analyze your symptoms and recommend
            the most appropriate medical specialists.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="symptoms">How are you feeling?</Label>
              <Textarea
                id="symptoms"
                placeholder="e.g. I have had a severe throbbing headache behind my eyes for 2 days, accompanied by light sensitivity and mild nausea..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={4}
                className="text-sm leading-relaxed"
                disabled={mutation.isPending}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={mutation.isPending || !symptoms.trim()}
                className="gap-2"
              >
                {mutation.isPending ? (
                  <>
                    <Spinner className="size-4" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Analyze Symptoms
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Error State */}
      {mutation.isError && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">
                Failed to analyze symptoms
              </p>
              <p className="text-xs text-destructive/70">
                {mutation.error?.message || "Please try again later"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Identified Specialties */}
          {result.specialties.length > 0 && (
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                  <Sparkles className="h-4 w-4" />
                  AI Identified Specialties
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.specialties.map((spec) => (
                    <Badge
                      key={spec}
                      className="bg-amber-500/10 text-amber-700 border-amber-500/20"
                    >
                      {spec}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Matching Doctors */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Recommended Specialists ({result.doctors.length})
            </h3>

            {result.doctors.length === 0 ? (
              <Card className="border-border/70">
                <CardContent className="py-8 text-center">
                  <Stethoscope className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No approved doctors found for the identified specialties.
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Try describing your symptoms differently or browse all
                    doctors.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {result.doctors.map((doctor) => (
                  <Card
                    key={doctor.id}
                    className="border-border/70 hover:border-primary/30 transition-colors"
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3 items-start">
                          <Avatar className="border border-primary/20 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                              {doctor.user.name?.[0] || doctor.user.email[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <p className="font-semibold text-sm">
                              {doctor.user.name || "Doctor"}
                            </p>
                            <Badge
                              variant="secondary"
                              className="text-xs font-medium"
                            >
                              {doctor.specialty}
                            </Badge>
                            {doctor.bio && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {doctor.bio}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatPrice(Number(doctor.pricePerVisit) || 0)}
                              </span>
                              {doctor.clinicAddress && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {doctor.clinicAddress}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 gap-1"
                          onClick={() =>
                            (window.location.href =
                              "/patient/appointments/book")
                          }
                        >
                          Book
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
