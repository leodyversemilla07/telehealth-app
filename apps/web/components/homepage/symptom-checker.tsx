"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Label } from "@workspace/ui/components/label"
import { Progress } from "@workspace/ui/components/progress"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
import { Slider } from "@workspace/ui/components/slider"
import { cn } from "@workspace/ui/lib/utils"
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  HeartPulse,
  Phone,
  RotateCcw,
  Scan,
  Sliders,
  Sparkles,
  Stethoscope,
  Video,
  Wind,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { authClient } from "@/lib/auth-client"

type SymptomCategory = {
  id: string
  label: string
  icon: typeof HeartPulse
  hint: string
  symptoms: { label: string; specialty: string; urgency: string }[]
}

const CATEGORIES: SymptomCategory[] = [
  {
    id: "heart",
    label: "Chest & heart",
    icon: HeartPulse,
    hint: "Chest discomfort, palpitations",
    symptoms: [
      {
        label: "Chest pain or tightness",
        specialty: "Cardiology",
        urgency: "See a doctor today",
      },
      {
        label: "Irregular heartbeat",
        specialty: "Cardiology",
        urgency: "Book within 24h",
      },
      {
        label: "Shortness of breath on exertion",
        specialty: "Cardiology",
        urgency: "Book within 24h",
      },
    ],
  },
  {
    id: "lungs",
    label: "Breathing & cough",
    icon: Wind,
    hint: "Cough, colds, flu-like symptoms",
    symptoms: [
      {
        label: "Persistent dry or wet cough",
        specialty: "General Practice",
        urgency: "Book within 48h",
      },
      {
        label: "Fever + severe body aches",
        specialty: "General Practice",
        urgency: "Book within 24h",
      },
      {
        label: "Wheezing or asthma flare",
        specialty: "Pulmonology",
        urgency: "See a doctor today",
      },
    ],
  },
  {
    id: "skin",
    label: "Skin & rashes",
    icon: Scan,
    hint: "Rashes, irritation, acne",
    symptoms: [
      {
        label: "New or rapidly changing rash",
        specialty: "Dermatology",
        urgency: "Book within 48h",
      },
      {
        label: "Severe itchy hives or eczema",
        specialty: "Dermatology",
        urgency: "Book within 48h",
      },
      {
        label: "Persistent acne breakouts",
        specialty: "Dermatology",
        urgency: "Book within 1 week",
      },
    ],
  },
  {
    id: "general",
    label: "General health",
    icon: Stethoscope,
    hint: "Headaches, fatigue, check-ups",
    symptoms: [
      {
        label: "Frequent recurring headaches",
        specialty: "General Practice",
        urgency: "Book within 48h",
      },
      {
        label: "Unexplained fatigue & weakness",
        specialty: "Internal Medicine",
        urgency: "Book within 48h",
      },
      {
        label: "Routine medical clearance",
        specialty: "General Practice",
        urgency: "Anytime",
      },
    ],
  },
]

const URGENCY_TONE: Record<string, string> = {
  "See a doctor today":
    "bg-destructive/10 text-destructive border-destructive/20",
  "Book within 24h": "bg-warning/15 text-warning border-warning/30",
  "Book within 48h": "bg-warning/10 text-warning-foreground border-warning/20",
  "Book within 1 week": "bg-muted text-muted-foreground border-border",
  Anytime: "bg-muted text-muted-foreground border-border",
}

export function SymptomChecker() {
  const router = useRouter()
  const { data: session } = authClient.useSession()

  const [category, setCategory] = useState<SymptomCategory | null>(null)
  const [selectedSymptom, setSelectedSymptom] = useState<string>("")
  const [severity, setSeverity] = useState<number>(4)
  const [hasFever, setHasFever] = useState(false)
  const [hasFatigue, setHasFatigue] = useState(false)
  const [consultationMode, setConsultationMode] = useState<"video" | "voice">(
    "video",
  )

  const [result, setResult] = useState<{
    label: string
    specialty: string
    urgency: string
  } | null>(null)

  function reset() {
    setCategory(null)
    setSelectedSymptom("")
    setSeverity(4)
    setHasFever(false)
    setHasFatigue(false)
    setResult(null)
  }

  function handleAssess() {
    if (!category) return
    const match =
      category.symptoms.find((s) => s.label === selectedSymptom) ||
      category.symptoms[0]
    if (match) {
      let finalUrgency = match.urgency
      if (severity >= 8) {
        finalUrgency = "See a doctor today"
      }
      setResult({
        ...match,
        urgency: finalUrgency,
      })
    }
  }

  const currentStepProgress = !category ? 25 : !result ? 65 : 100

  return (
    <section
      id="symptoms"
      className="relative scroll-mt-24 py-20 sm:py-28 border-t border-border/60"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          {/* Copy */}
          <div className="reveal-on-scroll">
            <Badge className="rounded-full border-primary/25 bg-primary/[0.08] px-3.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="mr-1.5 size-3.5" />
              AI Symptom Triage
            </Badge>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-foreground">
              Not sure which specialist to see?
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
              Answer a few quick questions to assess symptom severity and get an
              instant physician match with booking guidance.
            </p>
            <ul className="mt-7 space-y-3 text-sm text-muted-foreground">
              {[
                "Instant clinical discipline recommendation",
                "Pain & severity scoring slider",
                "Free to use — no account required to check",
              ].map((li) => (
                <li key={li} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{li}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Interactive widget */}
          <div
            className="reveal-on-scroll"
            style={{ transitionDelay: "120ms" }}
          >
            <div className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-sm sm:p-8">
              {/* Progress header */}
              <div className="mb-6 space-y-2 border-b border-border/60 pb-4">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>Triage Assessment Progress</span>
                  <span>{currentStepProgress}%</span>
                </div>
                <Progress
                  value={currentStepProgress}
                  className="h-1.5 rounded-full"
                />
              </div>

              {/* Step 1: Category Selection */}
              {!category && !result && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-lg font-bold text-foreground">
                      Step 1: Select Affected Area
                    </h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCategory(c)
                          setSelectedSymptom(c.symptoms[0]?.label ?? "")
                        }}
                        className="group flex items-center gap-3.5 rounded-xl border border-border/80 bg-background p-4 text-left transition hover:border-primary/40 hover:bg-primary/[0.04]"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                          <c.icon className="size-5" />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-foreground">
                            {c.label}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {c.hint}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Severity Slider + Symptom Options */}
              {category && !result && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={reset}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
                    >
                      <RotateCcw className="size-3.5" />
                      Back to categories
                    </button>
                    <span className="text-xs font-semibold text-primary">
                      {category.label}
                    </span>
                  </div>

                  {/* Symptom Picker */}
                  <div>
                    <Label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">
                      Specific Symptom
                    </Label>
                    <div className="space-y-2">
                      {category.symptoms.map((s) => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => setSelectedSymptom(s.label)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-xl border p-3 text-left text-sm transition",
                            selectedSymptom === s.label
                              ? "border-primary bg-primary/10 font-semibold text-primary"
                              : "border-border/80 bg-background text-foreground hover:border-border",
                          )}
                        >
                          <span>{s.label}</span>
                          {selectedSymptom === s.label && (
                            <CheckCircle2 className="size-4 text-primary shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pain & Severity Slider */}
                  <div className="space-y-3 rounded-xl border border-border/80 bg-background/60 p-4">
                    <div className="flex items-center justify-between text-xs">
                      <Label className="font-semibold text-foreground flex items-center gap-1.5">
                        <Sliders className="size-3.5 text-primary" />
                        Discomfort Severity Level:
                      </Label>
                      <span className="font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                        {severity} / 10
                      </span>
                    </div>
                    <Slider
                      value={[severity]}
                      onValueChange={(val) =>
                        setSeverity(
                          Array.isArray(val) ? (val[0] ?? 4) : Number(val),
                        )
                      }
                      min={1}
                      max={10}
                      className="py-1"
                    />
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>Mild (1)</span>
                      <span>Moderate (5)</span>
                      <span>Severe (10)</span>
                    </div>
                  </div>

                  {/* Additional Symptoms Checkbox */}
                  <div className="space-y-2.5 pt-1">
                    <Label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                      Accompanying Factors
                    </Label>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="fever-check"
                          checked={hasFever}
                          onCheckedChange={(c) => setHasFever(Boolean(c))}
                        />
                        <Label
                          htmlFor="fever-check"
                          className="text-xs text-foreground cursor-pointer font-normal"
                        >
                          High temperature / fever
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="fatigue-check"
                          checked={hasFatigue}
                          onCheckedChange={(c) => setHasFatigue(Boolean(c))}
                        />
                        <Label
                          htmlFor="fatigue-check"
                          className="text-xs text-foreground cursor-pointer font-normal"
                        >
                          Severe fatigue / weakness
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Preferred Mode RadioGroup */}
                  <div className="space-y-2 pt-1 border-t border-border/60">
                    <Label className="text-xs font-bold text-foreground uppercase tracking-wider block pt-2">
                      Preferred Consultation Mode
                    </Label>
                    <RadioGroup
                      value={consultationMode}
                      onValueChange={(val) =>
                        setConsultationMode(val as "video" | "voice")
                      }
                      className="flex gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="video" id="mode-video" />
                        <Label
                          htmlFor="mode-video"
                          className="text-xs font-medium cursor-pointer flex items-center gap-1"
                        >
                          <Video className="size-3.5 text-primary" /> HD Video
                          Call
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="voice" id="mode-voice" />
                        <Label
                          htmlFor="mode-voice"
                          className="text-xs font-medium cursor-pointer flex items-center gap-1"
                        >
                          <Phone className="size-3.5 text-primary" /> Voice Call
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button
                    onClick={handleAssess}
                    className="w-full h-11 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90 shadow-sm"
                  >
                    Generate Recommendation
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </div>
              )}

              {/* Step 3: Recommendation Result */}
              {result && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-success">
                      <Brain className="size-3.5" />
                      Triage Recommendation
                    </span>
                    <button
                      type="button"
                      onClick={reset}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
                    >
                      <RotateCcw className="size-3.5" />
                      Start over
                    </button>
                  </div>

                  <div className="flex items-center gap-4 rounded-xl border border-border/80 bg-background/60 p-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Stethoscope className="size-6" />
                    </span>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Recommended Medical Discipline
                      </div>
                      <div className="font-display text-xl font-bold text-foreground">
                        {result.specialty}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground">
                    For reported symptom <strong>"{result.label}"</strong> with
                    a severity score of <strong>{severity}/10</strong>,
                    scheduling a consultation with a board-certified{" "}
                    <strong>{result.specialty}</strong> specialist is
                    recommended.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <Button
                      onClick={() => {
                        const targetUrl = `/patient/appointments/book?specialty=${encodeURIComponent(result.specialty)}&symptom=${encodeURIComponent(result.label)}`
                        router.push(
                          session
                            ? targetUrl
                            : `/sign-up?callbackUrl=${encodeURIComponent(targetUrl)}`,
                        )
                      }}
                      className="w-full sm:flex-1 h-11 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90 shadow-sm"
                    >
                      Book {result.specialty} Visit
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                    <span
                      className={cn(
                        "rounded-xl px-3.5 py-2.5 text-xs font-bold border text-center",
                        URGENCY_TONE[result.urgency] ??
                          "bg-muted text-muted-foreground",
                      )}
                    >
                      {result.urgency}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
