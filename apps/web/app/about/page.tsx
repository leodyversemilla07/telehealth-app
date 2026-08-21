"use client"

import type { UserDto } from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { toast } from "@workspace/ui/components/toast"
import {
  Building,
  HeartPulse,
  Mail,
  Phone,
  Send,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Footer } from "@/components/homepage/footer"
import { Header } from "@/components/homepage/header"
import { authClient } from "@/lib/auth-client"

const CORE_VALUES = [
  {
    icon: Stethoscope,
    title: "Physician-Led Standards",
    desc: "Every practicing doctor is board-certified with an active PRC license, ensuring top-tier medical consultations.",
  },
  {
    icon: ShieldCheck,
    title: "Patient Data Sovereignty",
    desc: "Strict compliance with Data Privacy Act standards and end-to-end encryption across all records and video sessions.",
  },
  {
    icon: HeartPulse,
    title: "Accessible Care Anywhere",
    desc: "Connecting patients in major cities and remote provinces with specialized physicians without travel barriers.",
  },
  {
    icon: Users,
    title: "Connected Health Records",
    desc: "Digital e-prescriptions, clinical consultation notes, and diagnostic history consolidated in one secure portal.",
  },
]

export default function AboutPage() {
  const router = useRouter()
  const { data: session } = authClient.useSession()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const user = session?.user as unknown as UserDto | undefined
  const workspacePath =
    user?.role === "ADMIN"
      ? "/admin/dashboard"
      : user?.role === "DOCTOR"
        ? "/doctor/dashboard"
        : "/patient/dashboard"

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !message) {
      toast.add({
        title: "Please fill in all required fields",
        type: "error",
      })
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      toast.add({
        title: "Message sent! Our support team will get back to you shortly.",
        type: "success",
      })
      setName("")
      setEmail("")
      setSubject("")
      setMessage("")
    }, 600)
  }

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
        {/* Header */}
        <section className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <Badge className="rounded-full border-primary/25 bg-primary/[0.08] px-3.5 py-1 text-xs font-semibold text-primary">
            About Telehealth
          </Badge>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
            Our Mission is to Make Quality Care{" "}
            <span className="text-primary">Universally Accessible</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            We bridge the gap between patients and licensed healthcare
            professionals through secure, browser-based video visits and
            compliant digital health records.
          </p>
        </section>

        {/* Pillars Grid */}
        <section className="mx-auto mt-16 max-w-7xl px-5 sm:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {CORE_VALUES.map((val) => {
              const Icon = val.icon
              return (
                <div
                  key={val.title}
                  className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-base font-bold text-card-foreground mb-2">
                    {val.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {val.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Contact & Support Section */}
        <section className="mx-auto mt-24 max-w-7xl px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
            {/* Contact Details */}
            <div>
              <Badge className="rounded-full border-primary/25 bg-primary/[0.08] px-3.5 py-1 text-xs font-semibold text-primary">
                Contact & Inquiries
              </Badge>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl text-foreground">
                We're here to help
              </h2>
              <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                Have questions about our telemedicine platform, physician
                onboarding, or technical support? Send us a message.
              </p>

              <div className="mt-8 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <Mail className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Email Support
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      support@telehealth.ph
                    </p>
                    <p className="text-xs text-muted-foreground">
                      medical-board@telehealth.ph
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <Phone className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Telephone
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      +63 (2) 8888-2273 (CARE)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Monday to Sunday, 8:00 AM – 8:00 PM PHT
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <Building className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Clinical Operations
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Bonifacio Global City, Taguig, Metro Manila, Philippines
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form Card */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm">
              <h3 className="text-xl font-bold text-card-foreground mb-1">
                Send a Message
              </h3>
              <p className="text-xs text-muted-foreground mb-6">
                Our support team typically responds within 2 business hours.
              </p>

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="contact-name"
                      className="text-xs font-semibold"
                    >
                      Your Name *
                    </Label>
                    <Input
                      id="contact-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Juan Dela Cruz"
                      required
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="contact-email"
                      className="text-xs font-semibold"
                    >
                      Your Email *
                    </Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. juan@example.com"
                      required
                      className="h-10 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="contact-subject"
                    className="text-xs font-semibold"
                  >
                    Subject
                  </Label>
                  <Input
                    id="contact-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Question about appointment scheduling"
                    className="h-10 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="contact-message"
                    className="text-xs font-semibold"
                  >
                    Message *
                  </Label>
                  <Textarea
                    id="contact-message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we assist you?"
                    required
                    className="rounded-xl"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1 pb-2">
                  <Checkbox id="contact-consent" required defaultChecked />
                  <Label
                    htmlFor="contact-consent"
                    className="text-xs text-muted-foreground font-normal cursor-pointer leading-tight"
                  >
                    I consent to Telehealth processing my inquiry in accordance
                    with the Philippine Data Privacy Act of 2012.
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90 shadow-sm"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                  <Send className="ml-2 size-4" />
                </Button>
              </form>
            </div>
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
