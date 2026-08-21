"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { Badge } from "@workspace/ui/components/badge"
import { MessageCircleQuestion } from "lucide-react"
import Link from "next/link"

const FAQS = [
  {
    q: "How does a video consultation actually work?",
    a: "Book a slot with a doctor, and at appointment time you'll get a secure video room — no app download needed, it opens right in your browser. You'll talk face-to-face, and any prescription or follow-up notes land in your records immediately after.",
  },
  {
    q: "Do I need to leave my house to see a doctor?",
    a: "Nope. Consultations happen wherever you are — your phone on the commute, your laptop at home, or a tablet on the couch. Your session moves with you, and nothing is lost between devices.",
  },
  {
    q: "Is my medical information private and secure?",
    a: "Yes. Video calls, messages, and records are encrypted in transit and at rest, and every action is logged. Your data is only ever visible to you and the doctors you choose to share it with — we never sell it.",
  },
  {
    q: "Can I get a prescription without visiting a clinic?",
    a: "For most conditions, yes. Doctors can issue e-prescriptions after your video visit, which you can download, save, or send straight to your pharmacy.",
  },
  {
    q: "What if I'm not sure which doctor I need?",
    a: "Use the symptom checker above — answer two quick questions and we'll point you to the right specialist. You can also browse doctor profiles, specialties, and reviews before booking.",
  },
  {
    q: "How much does it cost to get started?",
    a: "Creating an account and browsing doctors is completely free. You only pay when you book a consultation, at the fee the doctor sets — shown clearly before you confirm.",
  },
]

export function FAQSection() {
  return (
    <section
      id="faq"
      className="relative scroll-mt-24 py-20 sm:py-24 border-t border-border/60"
    >
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <div className="text-center reveal-on-scroll">
          <Badge className="rounded-full border-primary/25 bg-primary/[0.08] px-3.5 py-1 text-xs font-semibold text-primary">
            <MessageCircleQuestion className="mr-1.5 size-3.5" />
            Questions, answered
          </Badge>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Everything you'd ask at the front desk — answered honestly, up
            front.
          </p>
        </div>

        <div
          className="mt-10 rounded-2xl border border-border/80 bg-card p-6 shadow-sm reveal-on-scroll"
          style={{ transitionDelay: "120ms" }}
        >
          <Accordion defaultValue={[FAQS[0]?.q ?? ""]}>
            {FAQS.map((faq) => (
              <AccordionItem key={faq.q} value={faq.q}>
                <AccordionTrigger className="text-base font-semibold text-foreground hover:text-primary">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-8 text-center reveal-on-scroll">
          <Link
            href="/faq"
            className="inline-flex h-10 items-center justify-center rounded-xl px-5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            View all FAQs in our Help Center →
          </Link>
        </div>
      </div>
    </section>
  )
}
