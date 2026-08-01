"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
import { cn } from "@workspace/ui/lib/utils"
import { ChevronDown, MessageCircleQuestion } from "lucide-react"
import { useState } from "react"

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
  const [open, setOpen] = useState<string | null>(FAQS[0]?.q ?? null)

  return (
    <section
      id="faq"
      className="relative scroll-mt-24 bg-primary/[0.02] py-24 sm:py-28 dark:bg-transparent"
    >
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <div className="text-center reveal-on-scroll">
          <Badge className="rounded-full border-primary/25 bg-primary/[0.08] px-3 py-1 text-xs text-primary">
            <MessageCircleQuestion className="mr-1 size-3" />
            Questions, answered
          </Badge>
          <h2 className="mt-5 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            In plain language,{" "}
            <span className="italic text-primary">not jargon.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Everything you'd ask at the front desk — answered honestly, up
            front.
          </p>
        </div>

        <div
          className="mt-12 space-y-3 reveal-on-scroll"
          style={{ transitionDelay: "120ms" }}
        >
          {FAQS.map((faq) => {
            const isOpen = open === faq.q
            return (
              <Collapsible
                key={faq.q}
                open={isOpen}
                onOpenChange={() => setOpen(isOpen ? null : faq.q)}
                className={cn(
                  "rounded-2xl border transition-all duration-300",
                  isOpen
                    ? "border-primary/30 bg-card shadow-lg shadow-primary/[0.06]"
                    : "border-border/70 bg-card/50 hover:border-primary/25 hover:bg-card",
                )}
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
                  <span className="text-base font-semibold text-foreground">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4.5 shrink-0 text-muted-foreground transition-transform duration-300",
                      isOpen && "rotate-180 text-primary",
                    )}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <p className="px-6 pb-6 text-[15px] leading-relaxed text-muted-foreground">
                    {faq.a}
                  </p>
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </div>

        <div className="mt-10 text-center reveal-on-scroll">
          <Button
            variant="ghost"
            className="h-11 rounded-full px-6 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() =>
              document
                .getElementById("top")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Still curious? Get started and ask us directly
          </Button>
        </div>
      </div>
    </section>
  )
}
