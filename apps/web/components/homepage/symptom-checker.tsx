"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import {
  Activity,
  ArrowRight,
  Brain,
  HeartPulse,
  RotateCcw,
  Scan,
  Sparkles,
  Stethoscope,
  Wind,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

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
        label: "Shortness of breath",
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
        label: "Persistent cough",
        specialty: "General Practice",
        urgency: "Book within 48h",
      },
      {
        label: "Fever + body aches",
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
    hint: "Rashes, irritation, moles",
    symptoms: [
      {
        label: "New or changing mole",
        specialty: "Dermatology",
        urgency: "Book within 48h",
      },
      {
        label: "Itchy rash",
        specialty: "Dermatology",
        urgency: "Book within 48h",
      },
      {
        label: "Acne that won't clear",
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
        label: "Frequent headaches",
        specialty: "General Practice",
        urgency: "Book within 48h",
      },
      {
        label: "Persistent fatigue",
        specialty: "General Practice",
        urgency: "Book within 48h",
      },
      {
        label: "Annual check-up",
        specialty: "General Practice",
        urgency: "Anytime",
      },
    ],
  },
]

const URGENCY_TONE: Record<string, string> = {
  "See a doctor today": "bg-destructive/10 text-destructive",
  "Book within 24h": "bg-warning/15 text-warning",
  "Book within 48h": "bg-warning/10 text-warning-foreground",
  "Book within 1 week": "bg-muted text-muted-foreground",
  Anytime: "bg-muted text-muted-foreground",
}

export function SymptomChecker() {
  const router = useRouter()
  const [category, setCategory] = useState<SymptomCategory | null>(null)
  const [result, setResult] = useState<{
    label: string
    specialty: string
    urgency: string
  } | null>(null)

  function reset() {
    setCategory(null)
    setResult(null)
  }

  return (
    <section id="symptoms" className="relative scroll-mt-24 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          {/* Copy */}
          <div className="reveal-on-scroll">
            <Badge className="rounded-full border-primary/25 bg-primary/[0.08] px-3 py-1 text-xs text-primary">
              <Sparkles className="mr-1 size-3" />
              Symptom checker
            </Badge>
            <h2 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Not sure who to see?{" "}
              <span className="italic text-primary">Start here.</span>
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
              Answer two quick questions and we'll point you to the right
              specialist — before you even book. No forms, no phone trees, no
              guessing.
            </p>
            <ul className="mt-8 space-y-3.5 text-sm text-muted-foreground">
              {[
                "Instant specialist recommendation",
                "Plain-language guidance, no jargon",
                "Free — works before you sign up",
              ].map((li) => (
                <li key={li} className="flex items-start gap-2.5">
                  <Activity className="mt-0.5 size-4 shrink-0 text-primary" />
                  {li}
                </li>
              ))}
            </ul>
          </div>

          {/* Interactive widget */}
          <div
            className="reveal-on-scroll"
            style={{ transitionDelay: "120ms" }}
          >
            <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-6 shadow-xl shadow-primary/[0.06] sm:p-8 dark:border-white/10">
              <div className="bg-grain absolute inset-0 opacity-[0.04]" />
              <div className="absolute -right-16 -top-16 size-48 rounded-full bg-primary/[0.05] blur-3xl" />

              {!category && !result && (
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-semibold">
                      What's bothering you?
                    </h3>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      Step 1 of 2
                    </span>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategory(c)}
                        className="group flex items-center gap-3.5 rounded-2xl border border-border/70 bg-background/60 p-4 text-left transition hover:border-primary/40 hover:bg-primary/[0.04] hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
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

              {category && !result && (
                <div>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={reset}
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
                    >
                      <RotateCcw className="size-3.5" />
                      Back
                    </button>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      Step 2 of 2
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-xl font-semibold">
                    {category.label} — pick your closest match
                  </h3>
                  <div className="mt-5 flex flex-col gap-2.5">
                    {category.symptoms.map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => setResult(s)}
                        className="group flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-5 py-4 text-left transition hover:border-primary/40 hover:bg-primary/[0.04] focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        <span className="text-sm font-medium text-foreground">
                          {s.label}
                        </span>
                        <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {result && (
                <div className="animate-fade-in-up">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-success">
                      <Brain className="size-3.5" />
                      Recommendation
                    </span>
                    <button
                      type="button"
                      onClick={reset}
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
                    >
                      <RotateCcw className="size-3.5" />
                      Start over
                    </button>
                  </div>

                  <div className="mt-6 flex items-center gap-4">
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Stethoscope className="size-7" />
                    </span>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">
                        Recommended specialist
                      </div>
                      <div className="font-display text-2xl font-semibold text-foreground">
                        {result.specialty}
                      </div>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                    For "{result.label}", a{" "}
                    <strong className="text-foreground">
                      {result.specialty}
                    </strong>{" "}
                    consultation is the right first step. This is guidance, not
                    a diagnosis — always follow your doctor's advice.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <Button
                      onClick={() => router.push("/sign-up")}
                      className="h-11 rounded-full bg-primary px-6 hover:bg-primary/90"
                    >
                      Book a {result.specialty} visit
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                    <span
                      className={cn(
                        "rounded-full px-3.5 py-1.5 text-xs font-semibold",
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
