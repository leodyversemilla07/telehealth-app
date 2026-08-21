"use client"

import type { UserDto } from "@workspace/shared"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { Footer } from "@/components/homepage/footer"
import { Header } from "@/components/homepage/header"
import { authClient } from "@/lib/auth-client"

export default function TermsOfServicePage() {
  const router = useRouter()
  const { data: session } = authClient.useSession()

  const user = session?.user as unknown as UserDto | undefined
  const workspacePath =
    user?.role === "ADMIN"
      ? "/admin/dashboard"
      : user?.role === "DOCTOR"
        ? "/doctor/dashboard"
        : "/patient/dashboard"

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
        <section className="mx-auto max-w-4xl px-5 sm:px-8">
          <Badge className="rounded-full border-primary/25 bg-primary/[0.08] px-3.5 py-1 text-xs font-semibold text-primary">
            Terms & Conditions
          </Badge>
          <h1 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl lg:text-5xl text-foreground">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last Updated: August 2026 · Governing Telehealth Consultations &
            Platform Use
          </p>

          {/* Emergency Warning Box */}
          <div className="mt-8">
            <Alert
              variant="destructive"
              className="rounded-xl border-destructive/30 bg-destructive/5"
            >
              <AlertCircle className="size-4 text-destructive" />
              <AlertTitle className="font-bold text-destructive text-xs">
                Medical Emergency Notice
              </AlertTitle>
              <AlertDescription className="text-xs text-foreground/90 leading-relaxed">
                Telehealth is not an emergency response service. If you or
                someone you are caring for is experiencing severe chest pain,
                shortness of breath, heavy bleeding, loss of consciousness, or
                symptoms of stroke, call <strong>911</strong> or visit the
                nearest hospital emergency department immediately.
              </AlertDescription>
            </Alert>
          </div>

          <div className="mt-8 space-y-8 rounded-2xl border border-border/80 bg-card p-6 sm:p-10 shadow-sm text-muted-foreground leading-relaxed text-sm">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">
                1. Acceptance of Terms
              </h2>
              <p>
                By registering an account, booking an appointment, or using any
                feature on the Telehealth platform, you agree to be bound by
                these Terms of Service and all applicable Philippine healthcare
                laws and regulations.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">
                2. Telemedicine Scope & Limitations
              </h2>
              <p>
                Telemedicine involves the delivery of healthcare services using
                electronic communication between a licensed medical practitioner
                and a patient. You understand and acknowledge that:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  Telemedicine is a supplement to, and not a full replacement
                  for, in-person clinical physical examinations when deemed
                  necessary by your physician.
                </li>
                <li>
                  Your doctor reserves the clinical discretion to determine
                  whether your condition is suitable for virtual care or
                  requires an in-person physical assessment or emergency
                  referral.
                </li>
                <li>
                  You must provide honest, accurate, and complete information
                  regarding your medical history, symptoms, and current
                  medications.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">
                3. Physician Independence & Standards
              </h2>
              <p>
                All practicing doctors on Telehealth are independent licensed
                medical professionals registered with the Philippine
                Professional Regulation Commission (PRC). Medical decisions,
                diagnostic evaluations, and prescriptions are the sole
                professional judgment of the treating doctor.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">
                4. Electronic Prescriptions
              </h2>
              <p>
                Digital prescriptions (e-prescriptions) generated on our
                platform comply with Philippine telemedicine guidelines. The
                treating physician reserves the right to decline prescribing
                controlled substances or medications that require in-person
                clinical supervision.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">
                5. Appointments, Rescheduling & Cancellations
              </h2>
              <p>
                Patients may reschedule or cancel scheduled appointments up to 2
                hours before the appointment start time without penalty.
                Repeated missed consultations (no-shows) may result in temporary
                booking restrictions.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">
                6. Contact & Inquiries
              </h2>
              <p>
                For questions regarding these Terms of Service, please reach out
                to our legal compliance department at{" "}
                <strong>legal@telehealth.ph</strong>.
              </p>
            </section>
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
