"use client"

import type { UserDto } from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"
import { useRouter } from "next/navigation"
import { Footer } from "@/components/homepage/footer"
import { Header } from "@/components/homepage/header"
import { authClient } from "@/lib/auth-client"

export default function PrivacyPolicyPage() {
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
            Legal & Compliance
          </Badge>
          <h1 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl lg:text-5xl text-foreground">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last Updated: August 2026 · Compliant with Philippine Data Privacy
            Act of 2012 (RA 10173)
          </p>

          <div className="mt-10 space-y-8 rounded-2xl border border-border/80 bg-card p-6 sm:p-10 shadow-sm text-muted-foreground leading-relaxed text-sm">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">
                1. Introduction & Overview
              </h2>
              <p>
                Telehealth ("we", "our", or "us") is dedicated to protecting the
                privacy, confidentiality, and integrity of your sensitive
                personal health information. This Privacy Policy details how we
                collect, process, store, and safeguard your medical records,
                personal details, and communication during telemedicine
                consultations.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">
                2. Information We Collect
              </h2>
              <p>To deliver telemedicine services, we collect:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Account Information:</strong> Full name, email
                  address, phone number, date of birth, and biological sex.
                </li>
                <li>
                  <strong>Clinical & Health Records:</strong> Reported medical
                  history, current symptoms, previous diagnoses, allergy
                  records, and uploaded lab/imaging attachments.
                </li>
                <li>
                  <strong>Consultation Metadata:</strong> Physician notes,
                  clinical diagnoses, issued electronic prescriptions, and
                  appointment timestamps.
                </li>
                <li>
                  <strong>Technical Data:</strong> Browser type, IP address, and
                  encrypted session logs for system security and audit
                  requirements.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">
                3. How Your Information is Used
              </h2>
              <p>
                We process your personal and health information strictly to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  Facilitate encrypted face-to-face video consultations with
                  licensed physicians.
                </li>
                <li>
                  Generate legally compliant electronic prescriptions
                  (e-prescriptions) and medical certificates.
                </li>
                <li>
                  Maintain your longitudinal Electronic Health Record (EHR)
                  accessible exclusively to you and your authorized treating
                  doctors.
                </li>
                <li>
                  Ensure compliance with Department of Health (DOH) and National
                  Privacy Commission (NPC) regulatory requirements.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">
                4. Data Security & Encryption Standards
              </h2>
              <p>
                We implement industry-grade administrative, technical, and
                physical security measures. All communications (video, audio,
                and text) are transmitted over TLS 1.3 encryption, and all
                electronic health records are encrypted at rest using AES-256
                standards. Direct access to medical data is restricted strictly
                on a role-based need-to-know basis.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">
                5. Patient Data Rights
              </h2>
              <p>
                Under the Philippine Data Privacy Act of 2012, you possess the
                right to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Access:</strong> Request copies of your complete
                  medical records and prescription history.
                </li>
                <li>
                  <strong>Rectification:</strong> Correct inaccurate or outdated
                  demographic and medical details.
                </li>
                <li>
                  <strong>Erasure / Blocking:</strong> Request deletion of
                  account data, subject to statutory medical record retention
                  obligations.
                </li>
                <li>
                  <strong>Data Portability:</strong> Obtain your digital medical
                  records in an interoperable electronic format.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">
                6. Contact Our Data Protection Officer
              </h2>
              <p>
                For privacy inquiries, rights enforcement, or compliance
                questions, please contact our Data Protection Office at:
              </p>
              <p className="font-semibold text-foreground">
                Email: dpo@telehealth.ph
                <br />
                Address: Telehealth Data Protection Office, Bonifacio Global
                City, Taguig, Philippines
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
