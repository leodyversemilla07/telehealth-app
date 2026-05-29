"use client"

import { useMutation } from "@tanstack/react-query"
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
  AlertTriangle,
  Brain,
  CheckCircle,
  Clock,
  Stethoscope,
  Users,
} from "lucide-react"
import { Spinner } from "@workspace/ui/components/spinner"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

interface SymptomResult {
  possibleConditions: Array<{ name: string; likelihood: string }>
  severity: string
  recommendedAction: string
  specialties: string[]
  doctors: Array<{
    id: string
    specialty: string
    user: { name: string | null; image: string | null }
  }>
}

const SEVERITY_CONFIG: Record<
  string,
  { color: string; icon: typeof Clock; bg: string }
> = {
  low: {
    color: "text-success",
    icon: CheckCircle,
    bg: "bg-success/10 border-success/30",
  },
  moderate: {
    color: "text-warning",
    icon: Clock,
    bg: "bg-warning/10 border-warning/30",
  },
  high: {
    color: "text-orange-600 dark:text-orange-400",
    icon: AlertTriangle,
    bg: "bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800",
  },
  urgent: {
    color: "text-destructive",
    icon: AlertCircle,
    bg: "bg-destructive/10 border-destructive/30",
  },
}

export default function SymptomCheckerPage() {
  const [symptoms, setSymptoms] = useState("")
  const [result, setResult] = useState<SymptomResult | null>(null)

  const analyzeMutation = useMutation({
    mutationFn: (data: { symptoms: string }) =>
      apiClient.post<SymptomResult>("/recommendations/symptoms", data),
    onSuccess: (data) => {
      setResult(data)
      toast.success("Symptoms analyzed successfully!")
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to analyze symptoms")
    },
  })

  const handleAnalyze = () => {
    if (!symptoms.trim()) {
      toast.error("Please describe your symptoms")
      return
    }
    analyzeMutation.mutate({ symptoms: symptoms.trim() })
  }

  const severityConfig = result
    ? SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG.moderate
    : null

  return (
    <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
            AI Symptom Checker
          </CardTitle>
          <CardDescription className="text-sm">
            Describe your symptoms and get AI-powered health insights and doctor
            recommendations.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Input Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Describe Your Symptoms</CardTitle>
          <CardDescription className="text-xs">
            Be as detailed as possible for better analysis. Include duration,
            severity, and any relevant medical history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="symptoms">Symptoms</Label>
            <Textarea
              id="symptoms"
              className="min-h-30"
              placeholder="e.g., I've been experiencing a persistent headache for 3 days, along with mild fever and sensitivity to light. I also feel nauseous occasionally..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {symptoms.length}/1000
            </p>
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending || !symptoms.trim()}
            className="w-full sm:w-auto"
          >
            {analyzeMutation.isPending ? (
              <>
                <Spinner className="mr-2 size-4" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Analyze Symptoms
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Severity Badge */}
          <div
            className={`flex items-center gap-3 p-4 rounded-xl border ${severityConfig?.bg || "bg-muted"}`}
          >
            {severityConfig && (
              <severityConfig.icon
                className={`h-6 w-6 ${severityConfig.color}`}
              />
            )}
            <div>
              <p className="text-sm font-semibold">Severity Assessment</p>
              <p
                className={`text-lg font-bold capitalize ${severityConfig?.color || ""}`}
              >
                {result.severity}
              </p>
            </div>
          </div>

          {/* Possible Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                Possible Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {result.possibleConditions?.map((condition, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <span className="text-sm font-medium">
                      {condition.name}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs font-bold ${
                        condition.likelihood === "high"
                          ? "text-red-600 border-red-200 bg-red-50"
                          : condition.likelihood === "medium"
                            ? "text-amber-600 border-amber-200 bg-amber-50"
                            : "text-muted-foreground border-border"
                      }`}
                    >
                      {condition.likelihood}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommended Action */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Recommended Action
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {result.recommendedAction}
              </p>
            </CardContent>
          </Card>

          {/* Recommended Doctors */}
          {result.doctors && result.doctors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Recommended Specialists
                </CardTitle>
                <CardDescription className="text-xs">
                  Based on your symptoms, consider consulting with:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.doctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                            {doctor.user.name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {doctor.user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {doctor.specialty}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        nativeButton={false}
                        render={<Link href="/patient/appointments/book" />}
                      >
                        Book
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
            <p className="font-semibold mb-1">Medical Disclaimer</p>
            <p>
              This AI symptom checker is for informational purposes only and
              should not replace professional medical advice. Always consult
              with a qualified healthcare provider for diagnosis and treatment.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
