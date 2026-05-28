# Telehealth Website Design — Reference Notes

> **Source:** [Telemedicine Website Design: Features, UX, and Key Principles](https://www.purrweb.com/blog/telehealth-website-design/)  
> **Author:** Sergey Nikonenko (COO, Purrweb)  
> **Published:** 2025-09-30 · Last updated: 2026-04-18  
> **Documented:** 2026-05-28

---

## Overview

Telehealth website design is a specialized discipline where UX failures have direct consequences on patient outcomes and regulatory risk. The article covers the core principles, must-have features, UX patterns, and compliance requirements that separate effective telehealth platforms from generic healthcare websites.

---

## Why Telehealth Design Is Different

Unlike standard web products, telehealth platforms carry unique constraints:

- **Trust is non-negotiable.** Patients share sensitive medical data. Visual credibility, security signals, and professional aesthetics are table stakes — not enhancements.
- **Two distinct user groups** with conflicting needs: patients (anxious, often low digital literacy) and healthcare providers (time-pressured, workflow-driven).
- **Regulatory compliance** is baked into UX flows — informed consent, data transparency, and audit trails must be visible and accessible to users, not just enforced in the backend.
- **Accessibility is required**, not optional — elderly and chronically ill users are primary audiences.

---

## Core Design Principles

### 1. Trust Signals First
Every screen should reinforce legitimacy:
- Display doctor credentials (license numbers, specialties, accreditations) prominently
- Use professional photography — not stock photos
- Show patient review counts and ratings
- Display security badges (SSL, HIPAA/data privacy compliance, payment security)
- Use neutral, clinical color palettes (blues, teals, whites) with intentional accent colors

### 2. Reduce Friction at Every Step
Patients booking a consultation are often in discomfort or anxiety. Every unnecessary click increases abandonment:
- Onboarding should be 3 steps or fewer
- Pre-fill forms where possible (account data, returning patient profiles)
- Offer guest booking or social login
- Show progress indicators on multi-step forms
- Inline validation — don't make users submit to discover errors

### 3. Mobile-First Architecture
- **60–70% of telehealth sessions** are initiated on mobile
- Touch targets must be ≥ 44px
- Video consultation UI must work on a 375px screen
- Appointment booking calendar needs swipe navigation on mobile

### 4. Accessibility
- WCAG 2.1 AA compliance as a minimum
- Font size ≥ 16px for body text
- Color contrast ratio ≥ 4.5:1
- All interactive elements keyboard-navigable
- Screen reader support for consultation flows

---

## Must-Have Features

### For Patients
| Feature | UX Priority |
|---|---|
| Doctor search + filters (specialty, availability, price, language) | Critical |
| Availability calendar with real-time slot display | Critical |
| Video consultation room | Critical |
| Appointment booking + confirmation | Critical |
| Prescription history and download | High |
| Medical records access | High |
| Notification system (appointment reminders, prescription ready) | High |
| AI-powered symptom checker / doctor recommendation | Medium |
| Secure messaging with doctors | Medium |
| Payment and invoice management | Medium |

### For Doctors
| Feature | UX Priority |
|---|---|
| Appointment queue and calendar | Critical |
| Video consultation interface with doctor controls | Critical |
| Patient record access during consultation | Critical |
| Note-taking and prescription tools | Critical |
| Availability schedule management | High |
| Notification and alert inbox | High |
| Earnings and analytics dashboard | Medium |

### For Admins
| Feature | UX Priority |
|---|---|
| Provider onboarding and verification workflow | Critical |
| User management (ban, role, status) | High |
| Audit log and compliance reporting | High |
| Platform analytics and reports | Medium |

---

## UX Flow Patterns

### Doctor Discovery Flow
```
Symptom input / Specialty browse
    → Filter results (price, availability, rating, language)
        → Doctor profile page (credentials, bio, reviews, price)
            → Select time slot
                → Confirm booking (reason, symptoms, visit type)
                    → Confirmation + reminders
```

### Consultation Flow
```
Appointment confirmation
    → Join room (5 min early window)
        → Video room (mute, camera, end call controls)
            → Post-visit: consultation notes + prescription
                → Follow-up booking prompt
```

### Onboarding Flow (New Patient)
```
Sign up (email or social)
    → Role selection (patient / provider)
        → Profile completion (DOB, contact, health info)
            → Consent (data privacy, data sharing)
                → Dashboard
```

---

## Visual Design Guidelines

### Color
- **Primary palette:** Blues and teals convey trust and calm (`oklch` or HSL-based tokens preferred over raw hex for themability)
- **Avoid:** Aggressive reds, high-saturation orange — associated with urgency/alarm
- **Use accent colors** sparingly for CTAs and status indicators
- **Status colors:**
  - Green → available / confirmed / completed
  - Yellow/amber → pending / in-progress
  - Red → cancelled / urgent
  - Neutral gray → inactive

### Typography
- Use a humanist sans-serif (Inter, Plus Jakarta Sans, Nunito) — readable at small sizes
- Minimum 16px body text
- Line height 1.5–1.65 for readability
- Limit to 2 typefaces maximum

### Spacing & Layout
- Generous whitespace signals credibility in healthcare
- Card-based layouts for doctor profiles and appointment lists — scannable at a glance
- Sticky navigation during long scroll pages
- Floating action buttons for primary patient actions (book, join call)

### Iconography
- Use outline-style icons for clinical contexts (Lucide, Phosphor)
- Icons should always be paired with text labels in critical flows — don't rely on icon-only UI for healthcare actions
- Consistent 24px or 20px icon sizing

---

## Compliance & Trust UX

### Consent Flows
- Privacy consent must be explicit (no pre-checked boxes)
- Show what data is collected and why before asking for it
- Consent logs should be accessible to the user ("Your Privacy Settings")
- Separate consent for: data storage, data sharing, marketing, recording

### Security Signals
- Display password strength meter on registration
- Security alerts inbox (password changed, session from new device)
- Session management (view and revoke active sessions)
- 2FA onboarding prompt after first login

### Data Transparency
- Patients should be able to download their records
- Doctors' license information should be publicly verifiable
- Audit trail for admin actions (ban, role change, approval)

---

## Performance Requirements

| Metric | Target |
|---|---|
| LCP (Largest Contentful Paint) | < 2.5s |
| FID / INP (Interaction to Next Paint) | < 100ms |
| CLS (Cumulative Layout Shift) | < 0.1 |
| Time to Interactive | < 3.5s |
| Page weight (mobile) | < 500KB initial JS |

Telehealth users in rural or low-connectivity areas must still be able to access booking. Progressive loading and offline-friendly appointment confirmations (cached) are recommended.

---

## AI Integration Patterns

The article highlights AI as an emerging expectation in telehealth UX:

- **Symptom-to-specialty mapper** — patients describe symptoms in plain language; AI returns relevant specialties and doctor recommendations
- **Smart scheduling** — AI suggests optimal appointment times based on doctor availability and patient history
- **Triage assistant** — helps patients categorize urgency before booking (non-emergency vs. urgent vs. emergency redirect)
- **Post-consultation summaries** — AI generates readable summary of consultation notes for patients

> **Key UX principle:** AI recommendations must show confidence levels and always provide an escape hatch — "See all doctors" / "I'll choose manually."

---

## Common UX Mistakes to Avoid

| Mistake | Why It Hurts |
|---|---|
| Requiring account creation before showing doctor availability | Kills discovery — 40–60% drop-off at forced registration |
| Hiding pricing until booking confirmation | Erodes trust; patients abandon at payment step |
| No-show / no-notification on appointment changes | Biggest patient satisfaction driver; SMS/email reminders are expected |
| Doctor profile without photo | 3× lower booking conversion than profiles with photos |
| Generic error messages | "Something went wrong" in a healthcare context creates panic; always specify what failed and what to do next |
| Small touch targets on mobile booking calendar | Leads to wrong slot selection — frustrating and potentially harmful |
| Session timeout during consultation | Video calls must not be subject to standard session timeout logic |

---

## Relevance to This Project

The following observations map directly to our `telehealth-app` codebase:

### ✅ Already Implemented
- Doctor search with specialty + price filters (`DoctorsService.findApproved()`)
- Appointment state machine with valid transitions
- 2FA and session management
- Consent logging (RA 10173 / PDPA)
- Audit logs for admin actions
- AI symptom → specialty mapping (NVIDIA NIM)
- Security alerts inbox
- Role-based dashboards (Patient / Doctor / Admin)
- Video consultation via LiveKit with time-window enforcement

### 🔴 Gaps to Address
| Gap | Priority |
|---|---|
| **Messaging / secure chat** — route exists in frontend, no backend | High |
| **Email notifications** — currently `console.log` only; no SMTP transport | High |
| **Doctor profile photos** — `image` field exists on User but no UI to display it on doctor cards | Medium |
| **Post-visit summary** — no patient-facing consultation note view after COMPLETED | Medium |
| **Prescription download (PDF)** — prescriptions stored in DB but no download endpoint | Medium |
| **Mobile calendar UI** — booking calendar not yet built | Medium |
| **Progress indicator on booking flow** — multi-step booking has no step indicator | Low |
| **Appointment reminder notifications** — `NotificationType.APPOINTMENT_REMINDER` exists but nothing sends it | High |

---

*Documented from: https://www.purrweb.com/blog/telehealth-website-design/*
