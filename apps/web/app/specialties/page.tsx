"use client"

import type { UserDto } from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { ScrollArea, ScrollBar } from "@workspace/ui/components/scroll-area"
import {
  Activity,
  ArrowRight,
  Baby,
  Brain,
  CheckCircle2,
  Heart,
  Pill,
  Search,
  Sparkles,
  Stethoscope,
  Wind,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Footer } from "@/components/homepage/footer"
import { Header } from "@/components/homepage/header"
import { authClient } from "@/lib/auth-client"

const SPECIALTIES_CATALOG = [
  {
    name: "General Practice",
    category: "Primary Care",
    icon: Stethoscope,
    description:
      "Comprehensive initial consultations, preventative care, common infections, blood pressure screenings, and routine health certificates.",
    conditions: [
      "Fever, flu & cold symptoms",
      "Headaches & body aches",
      "Routine medical checkups",
      "Medication refills",
    ],
  },
  {
    name: "Internal Medicine",
    category: "Chronic Care",
    icon: Activity,
    description:
      "Specialized diagnosis and long-term management of adult illnesses including diabetes, hypertension, cholesterol, and multi-system diseases.",
    conditions: [
      "Type 1 & Type 2 Diabetes",
      "Hypertension & lipid management",
      "Thyroid conditions",
      "Metabolic health reviews",
    ],
  },
  {
    name: "Cardiology",
    category: "Heart & Vascular",
    icon: Heart,
    description:
      "Care for cardiovascular health, heart rhythm evaluations, post-cardiac event follow-up, and preventive lifestyle cardiology.",
    conditions: [
      "Chest discomfort & palpitations",
      "High blood pressure management",
      "Arrhythmia follow-ups",
      "Cardiac risk assessments",
    ],
  },
  {
    name: "Dermatology",
    category: "Skin & Hair",
    icon: Sparkles,
    description:
      "Expert virtual evaluations for acne, rashes, eczema, psoriasis, hair loss, skin infections, and general skin wellness.",
    conditions: [
      "Acne & rosacea care",
      "Eczema, psoriasis & dermatitis",
      "Skin allergies & hives",
      "Hair loss & scalp conditions",
    ],
  },
  {
    name: "Pediatrics",
    category: "Child Health",
    icon: Baby,
    description:
      "Compassionate healthcare for infants, children, and adolescents, including common childhood illnesses, growth milestones, and feeding guidance.",
    conditions: [
      "Childhood fever & viral infections",
      "Pediatric rashes & allergies",
      "Feeding & nutrition concerns",
      "Growth milestone check-ins",
    ],
  },
  {
    name: "Psychiatry",
    category: "Mental Health",
    icon: Brain,
    description:
      "Confidential virtual care for depression, anxiety, insomnia, panic disorders, and comprehensive medication management.",
    conditions: [
      "Generalized anxiety & panic attacks",
      "Depression & mood changes",
      "Sleep disturbances & insomnia",
      "Stress & burnout support",
    ],
  },
  {
    name: "Neurology",
    category: "Brain & Nerves",
    icon: Brain,
    description:
      "Evaluation and management of chronic migraines, nerve pain, tremors, dizziness, vertigo, and cognitive health.",
    conditions: [
      "Chronic migraines & tension headaches",
      "Vertigo & balance issues",
      "Neuropathic tingling & numbness",
      "Memory & cognitive health reviews",
    ],
  },
  {
    name: "Pulmonology",
    category: "Respiratory & Lungs",
    icon: Wind,
    description:
      "Diagnosis and management of asthma, chronic bronchitis, chronic cough, respiratory allergies, and post-viral recovery.",
    conditions: [
      "Persistent or unexplained cough",
      "Asthma & wheezing management",
      "Shortness of breath on exertion",
      "Allergic bronchitis & post-viral recovery",
    ],
  },
  {
    name: "Gastroenterology",
    category: "Digestive Health",
    icon: Pill,
    description:
      "Care for acid reflux (GERD), irritable bowel syndrome (IBS), abdominal pain, bloating, and digestive disturbances.",
    conditions: [
      "Acid reflux, GERD & heartburn",
      "Chronic bloating & indigestion",
      "Irritable bowel syndrome (IBS)",
      "Unexplained abdominal discomfort",
    ],
  },
]

const CATEGORIES = [
  "All",
  "Primary Care",
  "Chronic Care",
  "Heart & Vascular",
  "Skin & Hair",
  "Child Health",
  "Mental Health",
  "Brain & Nerves",
  "Respiratory & Lungs",
  "Digestive Health",
]

export default function SpecialtiesPage() {
  const router = useRouter()
  const [filterQuery, setFilterQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const { data: session } = authClient.useSession()

  const user = session?.user as unknown as UserDto | undefined
  const workspacePath =
    user?.role === "ADMIN"
      ? "/admin/dashboard"
      : user?.role === "DOCTOR"
        ? "/doctor/dashboard"
        : "/patient/dashboard"

  const filtered = SPECIALTIES_CATALOG.filter((s) => {
    const matchesCategory =
      activeCategory === "All" || s.category === activeCategory
    const matchesQuery =
      !filterQuery.trim() ||
      s.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(filterQuery.toLowerCase()) ||
      s.conditions.some((c) =>
        c.toLowerCase().includes(filterQuery.toLowerCase()),
      )
    return matchesCategory && matchesQuery
  })

  return (
    <div className="min-h-svh bg-background text-foreground">
      <Header
        isAuthenticated={Boolean(session)}
        onCreateAccount={() => router.push("/sign-up")}
        onSignIn={() => router.push("/sign-in")}
        onSignOut={async () => {
          await authClient.signOut()
          router.refresh()
        }}
        onDashboard={() => router.push(workspacePath)}
      />

      <main className="pt-10 pb-16 sm:pt-14 sm:pb-20 md:pt-16">
        {/* Page Header */}
        <section className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <Badge className="rounded-full border-primary/25 bg-primary/[0.08] px-3.5 py-1 text-xs font-semibold text-primary">
            Clinical Specialties
          </Badge>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
            Specialized Care for{" "}
            <span className="text-primary">Every Condition</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Explore board-certified medical disciplines. Select any specialty to
            view practicing physicians and available video appointment slots.
          </p>

          {/* Quick Filter Search */}
          <div className="mx-auto mt-9 max-w-md">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search symptom or medical specialty..."
                className="h-11 w-full rounded-xl border border-border/80 bg-card pl-10 pr-4 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Scrollable Category Filter Pills */}
          <div className="mx-auto mt-6 max-w-3xl">
            <ScrollArea className="w-full whitespace-nowrap pb-2">
              <div className="flex w-max space-x-2 p-1">
                {CATEGORIES.map((cat) => {
                  const isActive = activeCategory === cat
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "border border-border/80 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {cat}
                    </button>
                  )
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </section>

        {/* Specialties Grid */}
        <section className="mx-auto mt-12 max-w-7xl px-5 sm:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((spec) => {
              const Icon = spec.icon
              return (
                <div
                  key={spec.name}
                  className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition hover:border-primary/40 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {spec.category}
                      </span>
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </div>
                    </div>

                    <h2 className="text-xl font-bold text-card-foreground">
                      {spec.name}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {spec.description}
                    </p>

                    <div className="mt-5 border-t border-border/60 pt-4">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                        Common Conditions:
                      </span>
                      <ul className="space-y-1.5">
                        {spec.conditions.map((c) => (
                          <li
                            key={c}
                            className="flex items-center gap-2 text-xs text-foreground"
                          >
                            <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-border/60 pt-4">
                    <Button
                      variant="outline"
                      onClick={() =>
                        router.push(
                          `/doctors?specialty=${encodeURIComponent(spec.name)}`,
                        )
                      }
                      className="w-full rounded-xl border-border/80 font-medium hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                    >
                      View {spec.name} Doctors
                      <ArrowRight className="ml-1.5 size-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-border/70 bg-card p-12 text-center">
              <p className="text-sm font-semibold text-foreground">
                No specialties found matching your filter.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setFilterQuery("")
                  setActiveCategory("All")
                }}
                className="mt-4 rounded-xl"
              >
                Reset Filters
              </Button>
            </div>
          )}
        </section>
      </main>

      <Footer
        isAuthenticated={Boolean(session)}
        onCreateAccount={() => router.push("/sign-up")}
        onOpenDashboard={() => router.push(workspacePath)}
      />
    </div>
  )
}
