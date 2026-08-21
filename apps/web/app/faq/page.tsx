"use client"

import type { UserDto } from "@workspace/shared"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  CalendarCheck,
  FileText,
  HelpCircle,
  Lock,
  Search,
  Video,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { Footer } from "@/components/homepage/footer"
import { Header } from "@/components/homepage/header"
import { authClient } from "@/lib/auth-client"

const FAQ_CATEGORIES = [
  {
    category: "Appointments & Booking",
    icon: CalendarCheck,
    items: [
      {
        question: "How do I schedule an appointment with a doctor?",
        answer:
          "You can search doctors by name, specialty, or condition on our platform. Once you choose a doctor, pick an available date and time slot in Philippine Standard Time (PHT), describe your symptoms, and confirm your booking. You will receive an instant email and calendar notification.",
      },
      {
        question: "Can I cancel or reschedule my appointment?",
        answer:
          "Yes. You can manage your appointments directly from your Patient Dashboard under 'My Appointments'. You can cancel or choose a new time slot up to 2 hours before the scheduled consultation.",
      },
      {
        question: "How much does a virtual consultation cost?",
        answer:
          "Consultation fees are set transparently by each licensed physician and displayed directly on their profile before you book. There are no hidden subscription fees or surprise platform charges.",
      },
    ],
  },
  {
    category: "Video Consultations & Technology",
    icon: Video,
    items: [
      {
        question: "Do I need to download an app to join the video call?",
        answer:
          "No app downloads or software installations are required. Consultations run securely in your standard web browser (Chrome, Safari, Edge, Firefox) on your phone, tablet, laptop, or desktop.",
      },
      {
        question: "What should I do if my connection drops during a visit?",
        answer:
          "If disconnected, simply refresh the browser tab or click the consultation room link again from your dashboard. Your doctor will remain in the room for the duration of the scheduled window.",
      },
      {
        question:
          "Can I upload previous lab results or photos for the doctor to review?",
        answer:
          "Yes. During the consultation or in the pre-visit booking form, you can securely attach medical files, previous lab reports, and high-resolution photos for the doctor's review.",
      },
    ],
  },
  {
    category: "E-Prescriptions & Medical Records",
    icon: FileText,
    items: [
      {
        question:
          "Are digital prescriptions issued here legally valid in the Philippines?",
        answer:
          "Yes. Prescriptions issued through our platform adhere to Philippine telemedicine guidelines (DOH/FDA compliance) and feature the physician's electronic signature, PRC license number, and PTR information for fulfillment at licensed pharmacies nationwide.",
      },
      {
        question:
          "Where can I access my consultation history and prescriptions?",
        answer:
          "All consultation summaries, doctor notes, and digital prescriptions are automatically archived in your secure 'Medical Records' portal accessible 24/7.",
      },
    ],
  },
  {
    category: "Security, Privacy & Compliance",
    icon: Lock,
    items: [
      {
        question: "Is my medical data protected under Philippine law?",
        answer:
          "Yes. Telehealth strictly complies with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173). All health records, video streams, and text messages are encrypted using TLS & AES-256 standards.",
      },
      {
        question: "How are doctors vetted and verified?",
        answer:
          "Every practicing doctor must submit their Philippine Professional Regulation Commission (PRC) medical license, government identification, and specialty board credentials, which are individually verified by our administrative clinical board before approval.",
      },
    ],
  },
]

export default function FAQPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")

  const { data: session } = authClient.useSession()
  const user = session?.user as unknown as UserDto | undefined
  const workspacePath =
    user?.role === "ADMIN"
      ? "/admin/dashboard"
      : user?.role === "DOCTOR"
        ? "/doctor/dashboard"
        : "/patient/dashboard"

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return FAQ_CATEGORIES
    const q = search.toLowerCase()
    return FAQ_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.question.toLowerCase().includes(q) ||
          item.answer.toLowerCase().includes(q),
      ),
    })).filter((cat) => cat.items.length > 0)
  }, [search])

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
            Help & Knowledge Base
          </Badge>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
            Frequently Asked <span className="text-primary">Questions</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Find answers to common questions regarding telemedicine visits,
            physician qualifications, electronic prescriptions, and data
            privacy.
          </p>

          {/* Search bar */}
          <div className="mx-auto mt-9 max-w-md">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions (e.g. prescription, video, cancel)..."
                className="h-11 w-full rounded-xl border border-border/80 bg-card pl-10 pr-4 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Categorized FAQs with Shadcn Accordion */}
        <section className="mx-auto mt-16 max-w-4xl px-5 sm:px-8">
          <div className="space-y-10">
            {filteredCategories.map((cat) => {
              const Icon = cat.icon
              return (
                <div
                  key={cat.category}
                  className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-4.5" />
                    </div>
                    <h2 className="text-xl font-bold text-card-foreground">
                      {cat.category}
                    </h2>
                  </div>

                  <Accordion defaultValue={[`${cat.category}-0`]}>
                    {cat.items.map((item, idx) => (
                      <AccordionItem
                        key={item.question}
                        value={`${cat.category}-${idx}`}
                      >
                        <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )
            })}

            {filteredCategories.length === 0 && (
              <div className="rounded-2xl border border-border/70 bg-card p-12 text-center">
                <HelpCircle className="mx-auto size-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-semibold text-foreground">
                  No matching answers found for "{search}"
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSearch("")}
                  className="mt-4 rounded-xl"
                >
                  Clear Search
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Still Have Questions CTA */}
        <section className="mx-auto mt-20 max-w-4xl px-5 sm:px-8">
          <div className="rounded-2xl border border-border/80 bg-muted/20 p-8 text-center">
            <h3 className="text-xl font-bold text-foreground">
              Still have questions?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Our clinical support team is available 7 days a week to assist
              you.
            </p>
            <Button
              onClick={() => router.push("/about")}
              className="mt-5 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Contact Support Team
            </Button>
          </div>
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
