# Software Requirements Specification (SRS)

## Telehealth Application (Philippine Context)

| Document | |
|---|---|
| **Project Name** | Telehealth Platform |
| **Version** | 1.0 |
| **Date** | 2026-05-25 |
| **Status** | Draft |

---

## Table of Contents

1. [Introduction](#1-introduction)
   - 1.1 Purpose
   - 1.2 Scope
   - 1.3 Definitions, Acronyms, and Abbreviations
   - 1.4 References
   - 1.5 Overview
2. [Overall Description](#2-overall-description)
   - 2.1 Product Perspective
   - 2.2 Product Functions
   - 2.3 User Characteristics
   - 2.4 Constraints
   - 2.5 Assumptions and Dependencies
3. [System Features and Requirements](#3-system-features-and-requirements)
   - 3.1 User Authentication and Role Management
   - 3.2 Appointment Scheduling and Management
   - 3.3 Video Consultation
   - 3.4 Secure Messaging
   - 3.5 Payment and Billing
   - 3.6 Electronic Health Records (EHR)
   - 3.7 Prescription Management (eRx)
   - 3.8 Notifications and Reminders
4. [External Interface Requirements](#4-external-interface-requirements)
   - 4.1 User Interfaces
   - 4.2 Hardware Interfaces
   - 4.3 Software Interfaces
   - 4.4 Communications Interfaces
5. [Non-Functional Requirements](#5-non-functional-requirements)
   - 5.1 Performance
   - 5.2 Security and Privacy
   - 5.3 Reliability and Availability
   - 5.4 Usability
   - 5.5 Scalability
   - 5.6 Compliance
6. [Appendices](#6-appendices)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) defines the complete functional and non-functional requirements for a Telehealth Application designed for the Philippine healthcare system. It is intended for use by the development team, project stakeholders, quality assurance, and operations personnel to ensure a shared understanding of the system to be built.

The system enables licensed Filipino healthcare providers to deliver clinical services to patients remotely via video consultations, secure messaging, electronic prescriptions, and integrated health record management — all while complying with Philippine laws and regulations including the Data Privacy Act of 2012 (RA 10173), DOH telehealth guidelines, and PRC/PDEA requirements.

### 1.2 Scope

The Telehealth Application is a web-based platform that connects patients with licensed Philippine healthcare providers through:

- **Patient-facing features**: Account management, provider search, appointment booking, video consultations, secure messaging, payment processing (including GCash, Maya, and credit/debit cards), and health record access.
- **Provider-facing features**: Schedule management, patient queue, video consultations, clinical note-taking, prescription writing (compliant with PDEA regulations for controlled substances), and earnings tracking.
- **Admin-facing features**: User management, provider credential verification (PRC license, PhilHealth accreditation, S2 license), platform configuration, analytics dashboard, and audit logging.

The system is built using a monorepo architecture with a Next.js web frontend (`apps/web`) and a NestJS API backend (`apps/api`), sharing TypeScript packages (`packages/shared`, `packages/ui`). The initial release targets desktop and mobile web browsers. Native mobile apps are out of scope for v1.0.

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|---|---|
| **Patient** | End-user seeking healthcare services |
| **Provider** | Licensed healthcare professional registered with the Professional Regulation Commission (PRC) |
| **Admin** | System administrator managing the platform |
| **DOH** | Department of Health (Philippines) |
| **PRC** | Professional Regulation Commission — issues and regulates professional licenses (including doctors, nurses, therapists) |
| **PDEA** | Philippine Drug Enforcement Agency — regulates controlled substances |
| **PhilHealth** | Philippine Health Insurance Corporation — national health insurance program |
| **RA 10173** | Data Privacy Act of 2012 — the primary data privacy law in the Philippines |
| **NPC** | National Privacy Commission — enforces RA 10173 |
| **S2 License** | PDEA license required to prescribe controlled substances |
| **eRx** | Electronic Prescription |
| **EHR** | Electronic Health Record |
| **PHI** | Protected Health Information |
| **SOAP** | Subjective, Objective, Assessment, Plan — clinical note format |
| **OTP** | One-Time Password |
| **RBAC** | Role-Based Access Control |
| **GCash** | Leading mobile wallet in the Philippines (Globe Telecom) |
| **Maya** | Mobile wallet / digital bank (formerly PayMaya) |
| **PHP** | Philippine Peso |
| **PhilHealth Accreditation** | Accreditation required for health providers to accept PhilHealth coverage |
| **TBD** | To Be Determined |

### 1.4 References

| Reference | Source |
|---|---|
| Data Privacy Act of 2012 (RA 10173) | https://www.privacy.gov.ph/data-privacy-act/ |
| DOH Telehealth Guidelines (AO 2021-0037) | https://doh.gov.ph |
| PRC Online Services | https://www.prc.gov.ph |
| PhilHealth Circulars | https://www.philhealth.gov.ph |
| PDEA Regulations on Controlled Substances | https://pdea.gov.ph |
| Better Auth Documentation | https://www.better-auth.com |
| Next.js Documentation | https://nextjs.org/docs |
| NestJS Documentation | https://docs.nestjs.com |
| WCAG 2.1 Accessibility Guidelines | https://www.w3.org/TR/WCAG21/ |

### 1.5 Overview

This document is organized into six sections. Section 2 provides a high-level product description, user characteristics, and constraints specific to the Philippine telehealth landscape. Section 3 details each core system feature with functional requirements. Section 4 defines external interface requirements. Section 5 covers non-functional requirements including security, performance, and Philippine regulatory compliance. Section 6 contains appendices.

---

## 2. Overall Description

### 2.1 Product Perspective

The Telehealth Application is a new, self-contained product within an existing monorepo (`telehealth-app`). It leverages shared packages for UI components (`@workspace/ui`) and shared types/utilities (`@workspace/shared`). The system integrates with third-party services for:

- **Authentication** — Better Auth (email/password, OAuth providers including Google)
- **Video conferencing** — Daily.co or LiveKit
- **Payments** — PayMongo (preferred for PH market: supports GCash, Maya, credit/debit cards, over-the-counter bank payments) or Stripe
- **Email/SMS** — Resend, Twilio/Semaphore (Semaphore is popular in PH)
- **File storage** — AWS S3 or Cloudflare R2
- **Database** — PostgreSQL (via Prisma ORM)

### 2.2 Product Functions

The system must support the following high-level functions:

1. **User Registration and Authentication**
   - Patient and provider registration with email/password and OAuth
   - Role-based access control (Patient, Provider, Admin)
   - Two-factor authentication (optional for v1.0)

2. **Appointment Lifecycle**
   - Provider availability management
   - Patient browsing and booking
   - Appointment confirmation, rescheduling, and cancellation
   - Automated reminders (SMS preferred in PH due to high SMS penetration)

3. **Video Consultations**
   - Real-time audio/video calls in-browser
   - Waiting room with provider admit
   - Screen sharing and in-call chat
   - Low-bandwidth mode (critical for provincial/rural areas)
   - Call recording (with patient consent)

4. **Secure Messaging**
   - Asynchronous patient-provider messaging
   - File attachment support (images, PDFs)
   - Read receipts and message threading
   - Support for Taglish (Tagalog-English) content

5. **Payment Processing**
   - Pre-visit payment collection
   - GCash and Maya payment support
   - Credit/debit card payments (via PayMongo or Stripe)
   - PhilHealth coverage verification (future integration)
   - Provider payout management
   - Refund processing for cancellations

6. **Electronic Health Records**
   - SOAP note creation and storage
   - Medication and allergy lists
   - Visit history timeline
   - Consent-based record sharing
   - Support for Philippine-specific diagnosis coding (ICD-10 PH)

7. **Electronic Prescriptions**
   - Medication selection and dosing
   - Allergy/interaction checks
   - PDF prescription generation (printed on PRC-licensed prescription forms)
   - PDEA compliance for controlled substances (S2 license verification)
   - Refill request workflow
   - Integration with Philippine pharmacy networks (Mercury Drug, Watsons, Rose Pharmacy)

8. **Notifications**
   - Appointment reminders (24h, 1h before) — SMS preferred
   - New message alerts
   - Payment receipts and prescription notifications
   - Support for Filipino language notifications

### 2.3 User Characteristics

#### 2.3.1 Patient

| Attribute | Description |
|---|---|
| Technical proficiency | Low to moderate; many first-time telehealth users |
| Primary goal | Obtain convenient, affordable healthcare without visiting a clinic |
| Devices | Smartphone (mobile web) primarily; desktop secondary |
| Internet connectivity | Metro Manila/urban — stable 4G/5G; Provincial/rural — intermittent 3G/4G, may be data-capped |
| Frequency of use | Occasional (once per episode of care) |
| Language preference | Filipino, Taglish, or English |
| Special needs | Elderly patients may have low digital literacy; accessibility features important |
| Payment preference | GCash > Maya > Credit/Debit Card > Bank transfer > Over-the-counter |

#### 2.3.2 Provider

| Attribute | Description |
|---|---|
| Typical providers | General practitioners (GPs), internists, pediatricians, OB-GYNs, psychiatrists, dermatologists |
| Technical proficiency | Moderate; familiar with hospital EHR systems |
| Primary goal | Efficiently see patients, document visits, and bill |
| Devices | Desktop primarily (may use tablet for notes) |
| Frequency of use | Daily during clinic hours |
| Special needs | Fast workflows, keyboard shortcuts, minimal clicks |
| Regulatory requirements | Must maintain active PRC license, PhilHealth accreditation, and (if applicable) PDEA S2 license |
| Language preference | English for clinical notes; Filipino/Taglish for patient communication |

#### 2.3.3 Admin

| Attribute | Description |
|---|---|
| Technical proficiency | High |
| Primary goal | Manage users, verify provider credentials, monitor operations, view analytics |
| Devices | Desktop |
| Frequency of use | Daily for monitoring; occasional for configuration |

### 2.4 Constraints

1. **Regulatory Compliance** — The system must comply with:
   - **RA 10173 (Data Privacy Act of 2012)** — personal and sensitive personal information
   - **DOH AO 2021-0037** — Guidelines on the Implementation of Telehealth Services
   - **PRC requirements** — valid license verification for all practicing providers
   - **PDEA regulations** — for controlled substance prescriptions
   - **PhilHealth rules** — for covered consultations

2. **Data Sovereignty** — Patient health data must be stored within the Philippines or in jurisdictions with equivalent data protection standards recognized by the NPC.

3. **Browser Support** — Must support the last two major versions of Chrome, Firefox, Safari, and Edge. Mobile Safari and Chrome on Android are primary targets.

4. **Low-Bandwidth Support** — The application must function acceptably on connections as slow as 1 Mbps download / 512 Kbps upload, common in provincial areas.

5. **Monorepo Architecture** — All code must live within the existing `telehealth-app` structure and adhere to its conventions (TurboRepo, Biome linting, shared packages).

6. **Deployment Target** — AWS Elastic Beanstalk (API) + Vercel (web) as specified in existing configuration.

7. **Database** — PostgreSQL; schema changes managed via Prisma migrations in the `apps/api` workspace.

8. **Authentication** — Must use Better Auth as the authentication provider.

### 2.5 Assumptions and Dependencies

- **Assumptions**
  - Users have a stable internet connection (minimum 1 Mbps download).
  - Providers are properly licensed by the PRC and in good standing.
  - Credential verification (PRC license validation) may be manual or via PRC API in the future.
  - Payment gateway supports Philippine payment methods (GCash, Maya, over-the-counter).
  - SMS delivery rates in the Philippines are reliable for appointment reminders.

- **Dependencies**
  - Better Auth library for authentication flows.
  - Daily.co or LiveKit SDK for video conferencing.
  - PayMongo or Stripe API for payment processing (PayMongo preferred for GCash/Maya support).
  - Resend API + Semaphore or Twilio for email and SMS delivery.
  - PostgreSQL database availability via Docker (development) or AWS RDS (production).
  - PRC API or manual verification process for provider credential validation.
  - PhilHealth API integration for eligibility checks (future enhancement).

---

## 3. System Features and Requirements

### 3.1 User Authentication and Role Management

**ID:** F-AUTH

**Description:** The system shall provide secure registration, login, and role-based access control for three user types: Patient, Provider, and Admin — all compliant with the Data Privacy Act of 2012 (RA 10173).

**Priority:** Critical

#### Functional Requirements

| ID | Requirement | Verification |
|---|---|---|
| F-AUTH-01 | The system shall allow users to register as a Patient or Provider using email and password (minimum 8 characters, must include letter and number). | Test: Registration form submits successfully, user created in DB |
| F-AUTH-02 | The system shall support OAuth login via Google for Patients (most common PH identity provider). | Test: OAuth flow completes, user redirected to dashboard |
| F-AUTH-03 | The system shall require email verification or SMS OTP verification before a user can log in for the first time. | Test: Unverified user receives 403 on login attempt |
| F-AUTH-04 | The system shall enforce role-based access control: Patients access only patient routes; Providers access only provider routes; Admins access admin dashboard. | Test: Role mismatch returns 403 |
| F-AUTH-05 | The system shall allow users to reset their password via a secure email or SMS link. | Test: Password reset sent, link works once |
| F-AUTH-06 | The system shall maintain session tokens with a configurable expiry (default: 7 days for Patients, 4 hours for Providers). | Test: Session expires as configured |
| F-AUTH-07 | The system shall allow Providers to complete a profile with: full name, PRC license number, PRC license expiry date, specialty, PhilHealth accreditation number (optional), PDEA S2 license number (if applicable), bio, profile photo, price per visit in PHP. | Test: Profile update persists |
| F-AUTH-08 | The system shall display a prominent privacy notice (Data Privacy Act compliant) during registration, requiring explicit consent. | Test: Consent checkbox required; without it, registration blocked |
| F-AUTH-09 | The system shall allow Admins to verify and approve Provider registrations by validating PRC license details. | Test: Pending provider cannot offer appointments |
| F-AUTH-10 | The system shall flag and notify Admin when a Provider's PRC license or PhilHealth accreditation is nearing expiry (30 days before). | Test: Notification generated at T-30d |
| F-AUTH-11 | The system shall log all login attempts (successful and failed) with IP address and timestamp for NPC compliance. | Test: Audit log entry created on each attempt |

### 3.2 Appointment Scheduling and Management

**ID:** F-APPT

**Description:** The system shall enable Providers to manage availability and Patients to discover, book, and manage appointments — considering Philippine time zone (PHT, UTC+8) and local scheduling norms.

**Priority:** Critical

#### Functional Requirements

| ID | Requirement | Verification |
|---|---|---|
| F-APPT-01 | The system shall allow Providers to set recurring weekly availability with configurable time slots (default: 15, 30, or 60 minutes). | Test: Availability saved, slots generated |
| F-APPT-02 | The system shall allow Providers to block specific dates/times for personal time, admin work, or clinic duty. | Test: Blocked slots not visible to patients |
| F-APPT-03 | The system shall allow Patients to search Providers by specialty, name, location (for hybrid clinics), or availability date. | Test: Search returns filtered results |
| F-APPT-04 | The system shall display available time slots for a selected Provider based on their availability and existing bookings. | Test: Only unbooked slots shown |
| F-APPT-05 | The system shall allow Patients to book an appointment by selecting a Provider, slot, and providing: reason for visit, brief symptom description, preferred language (Filipino/English). | Test: Appointment created, confirmation displayed |
| F-APPT-06 | The system shall prevent double-booking by locking the slot during the booking transaction. | Test: Concurrent booking attempts — one succeeds, one fails |
| F-APPT-07 | The system shall allow Patients to cancel an appointment up to 4 hours before the start time for a full refund. | Test: Cancel within window succeeds; after window, option disabled |
| F-APPT-08 | The system shall allow Patients to reschedule an appointment to an available slot at least 4 hours in advance. | Test: Original slot freed, new slot booked |
| F-APPT-09 | The system shall allow Providers to mark an appointment as: confirmed, in_progress, completed, no_show, or cancelled. | Test: Status transitions follow valid state machine |
| F-APPT-10 | The system shall display an appointment history timeline for both Patient and Provider. | Test: History page shows past, current, and future appointments |
| F-APPT-11 | The system shall operate entirely in Philippine Time (PHT, UTC+8). No timezone conversion is needed since the service is Philippine-only. | Test: All times displayed in PHT |
| F-APPT-12 | The system shall support hybrid appointment types: video, phone (audio-only), or in-person at a clinic location. | Test: Appointment type displayed and respected in flow |

#### State Machine

```
booked ──→ confirmed ──→ in_progress ──→ completed
  │                       │               │
  └──→ cancelled          └──→ cancelled  └──→ no_show (via timeout)
```

### 3.3 Video Consultation

**ID:** F-VIDEO

**Description:** The system shall facilitate real-time video consultations between Patients and Providers directly in the browser, optimized for Philippine internet conditions.

**Priority:** Critical

#### Functional Requirements

| ID | Requirement | Verification |
|---|---|---|
| F-VIDEO-01 | The system shall generate a unique, secured video room for each appointment. | Test: Room created at appointment start time |
| F-VIDEO-02 | The system shall allow the Patient to join the video room at the appointment start time or up to 5 minutes early. | Test: Join button activates at T-5min |
| F-VIDEO-03 | The system shall place the Patient in a waiting room until the Provider admits them. | Test: Patient sees "Waiting for provider" screen with estimated wait time |
| F-VIDEO-04 | The system shall notify the Provider when the Patient has joined the waiting room. | Test: Toast/notification appears on Provider screen |
| F-VIDEO-05 | The system shall allow the Provider to admit the Patient from the waiting room into the call. | Test: Patient's screen transitions to active call |
| F-VIDEO-06 | The system shall provide controls for: mute/unmute, camera on/off, screen sharing, and end call on both sides. | Test: Each control functions independently |
| F-VIDEO-07 | The system shall include an in-call text chat for sharing links or quick messages (useful for sharing lab results). | Test: Message sent in chat appears on both sides |
| F-VIDEO-08 | The system shall automatically fall back to audio-only mode when bandwidth drops below 1 Mbps. | Test: Simulated low bandwidth triggers audio-only |
| F-VIDEO-09 | The system shall allow the Provider to record the consultation with a visible consent prompt to the Patient (compliance with DOH guidelines). | Test: Recording starts only after Patient accepts |
| F-VIDEO-10 | The system shall redirect both parties to a post-visit screen when the call ends — Patient sees prescription/notes summary, Provider sees SOAP note form. | Test: After end call, both users see respective post-visit page |
| F-VIDEO-11 | The system shall store call metadata (duration, participants, timestamps, connection quality metrics) for billing and audit. | Test: Call record created in DB with correct data |
| F-VIDEO-12 | The system shall display a stable connection indicator (green/yellow/red) so both parties know when quality is degrading. | Test: Indicator changes based on connection metrics |

### 3.4 Secure Messaging

**ID:** F-MSG

**Description:** The system shall allow asynchronous, secure communication between Patients and Providers.

**Priority:** High

#### Functional Requirements

| ID | Requirement | Verification |
|---|---|---|
| F-MSG-01 | The system shall allow a Patient to send a message to their assigned/consulted Provider at any time. | Test: Message sent, appears in conversation |
| F-MSG-02 | The system shall allow a Provider to message any Patient they have a consultation history with. | Test: Provider can select from patient list |
| F-MSG-03 | The system shall support attachments: images (jpg, png, gif, webp), PDFs, and common document formats (lab results, prescriptions). | Test: File uploaded, displayed in chat |
| F-MSG-04 | The system shall enforce a file size limit of 25 MB per attachment. | Test: File > 25 MB rejected with error message |
| F-MSG-05 | The system shall encrypt messages at rest (AES-256) and in transit (TLS 1.3) as required by RA 10173. | Test: DB encryption verified, network traffic encrypted |
| F-MSG-06 | The system shall display read receipts: sent, delivered, and read status. | Test: Status updates correctly as message progresses |
| F-MSG-07 | The system shall notify the recipient of new messages via push notification (browser), SMS (if enabled), and email (if offline). | Test: Notification received in appropriate channels |
| F-MSG-08 | The system shall auto-delete messages older than the configured retention period (minimum 5 years per NPC guidelines for health data). | Test: Messages older than retention period purged |
| F-MSG-09 | The system shall prevent Patient-to-Patient messaging. | Test: Patient trying to message another Patient gets 403 |
| F-MSG-10 | The system shall provide an audit log of message access (who read which message, when) for NPC compliance. | Test: Audit entry created on message read |
| F-MSG-11 | The system shall support Unicode and render Filipino characters (ñ, ng, etc.) correctly in all interfaces. | Test: Tagalog messages display properly |

### 3.5 Payment and Billing

**ID:** F-PAY

**Description:** The system shall handle financial transactions in Philippine Peso (PHP), supporting local payment methods and PhilHealth integration.

**Priority:** High

#### Functional Requirements

| ID | Requirement | Verification |
|---|---|---|
| F-PAY-01 | The system shall collect payment in Philippine Peso (PHP) before the appointment starts. | Test: Payment intent created, charge successful |
| F-PAY-02 | The system shall support the following payment methods common in the Philippines: GCash, Maya, credit/debit cards (Visa, Mastercard, JCB), and over-the-counter bank payments (via 7-Eleven, Bayad Center). | Test: Each method processes successfully |
| F-PAY-03 | The system shall use PayMongo as the primary payment gateway for native GCash/Maya and over-the-counter support. Stripe may be used as secondary for international card processing. | Test: Payment gateway integration verified |
| F-PAY-04 | The system shall validate the payment method by authorizing a small amount (₱1.00) before booking, then voiding it. | Test: Authorization succeeds, no real charge |
| F-PAY-05 | The system shall issue a full refund if the Patient cancels within the cancellation window (4 hours before). Refunds go back to the original payment method (GCash/Maya refunds within 1-3 business days). | Test: Refund processed, payment status updated |
| F-PAY-06 | The system shall issue no refund for cancellations less than 4 hours before or for no-shows, per standard PH telehealth practice. | Test: No refund applied, provider still paid |
| F-PAY-07 | The system shall automatically process Provider payouts on a configurable schedule (default: weekly, every Friday). Withholding tax (if applicable) handled per BIR requirements. | Test: Payout created for completed visits in period |
| F-PAY-08 | The system shall allow Admins to view transaction history, refunds, and payout status in a dashboard. | Test: Dashboard displays accurate financial data |
| F-PAY-09 | The system shall send an email and/or SMS receipt to the Patient after each successful payment. | Test: Receipt contains visit details and amount in PHP |
| F-PAY-10 | The system shall handle payment failures gracefully — retry mechanism with notification to Patient, including alternative payment method suggestion. | Test: Failed payment triggers retry + notification |
| F-PAY-11 | The system shall display all prices clearly in PHP (₱) with no hidden fees. A service fee breakdown (platform fee + provider fee) shall be shown before payment. | Test: Price breakdown visible on payment screen |
| F-PAY-12 | The system shall generate official receipts for each transaction (required for PH tax compliance). | Test: Receipt contains all BIR-required fields |

### 3.6 Electronic Health Records (EHR)

**ID:** F-EHR

**Description:** The system shall store and manage basic health records associated with each patient-provider relationship, compliant with DOH and NPC standards.

**Priority:** High

#### Functional Requirements

| ID | Requirement | Verification |
|---|---|---|
| F-EHR-01 | The system shall allow Providers to create a SOAP note for each completed appointment. | Test: Note saved and linked to appointment |
| F-EHR-02 | The system shall display a structured SOAP note form with fields for Subjective, Objective, Assessment, and Plan — available in English and Filipino. | Test: All four fields present and save independently |
| F-EHR-03 | The system shall allow Providers to add diagnoses using ICD-10 (Philippine adaptation) codes with both English and Filipino descriptions. | Test: Diagnosis saved with code and description |
| F-EHR-04 | The system shall maintain a medication list for each Patient (current medications, dosages, start dates, prescribing provider). | Test: Medication added, displayed in patient record |
| F-EHR-05 | The system shall maintain an allergy list for each Patient with severity levels (MILD, MODERATE, SEVERE). | Test: Allergy recorded, flagged prominently during prescription |
| F-EHR-06 | The system shall display a visit history timeline showing all past appointments with links to visit notes. | Test: Timeline shows chronological visit list |
| F-EHR-07 | The system shall allow Patients to view their own health records (read-only). | Test: Patient sees records but no edit controls |
| F-EHR-08 | The system shall allow Patients to download their health records as a PDF (data portability right under RA 10173). | Test: PDF generated with complete record |
| F-EHR-09 | The system shall allow Providers to access records for patients they have treated. | Test: Provider sees patient list, opens records |
| F-EHR-10 | The system shall prevent Providers from accessing records of patients they have not treated (except via explicit consent-based sharing). | Test: Unauthorized record access returns 403 |
| F-EHR-11 | The system shall log all access to health records (who accessed what, when, from which IP) for NPC compliance. | Test: Audit log entry created on each record view |
| F-EHR-12 | The system shall support data deletion requests per RA 10173 — Patients can request deletion of their records, subject to legal retention requirements (minimum 5 years for health records). | Test: Deletion request queued, data anonymized after retention period |

### 3.7 Prescription Management (eRx)

**ID:** F-RX

**Description:** The system shall allow licensed Filipino Providers to electronically prescribe medications, compliant with DOH, PRC, and PDEA regulations.

**Priority:** Medium (optional for v1.0, required for v1.1)

#### Functional Requirements

| ID | Requirement | Verification |
|---|---|---|
| F-RX-01 | The system shall allow Providers to search a medication database (Philippine Drug Reference or DOH essential medicines list) by brand name or generic name. | Test: Search returns matching medications with both brand and generic names |
| F-RX-02 | The system shall allow Providers to select dosage, frequency, route, duration, and quantity for each prescription, with options for "take as needed" (prn). | Test: All fields configurable, prescription saved |
| F-RX-03 | The system shall default to generic medication names per the DOH Generics Act (RA 6675) requirement. | Test: Generic name auto-populated; brand name optional |
| F-RX-04 | The system shall check for drug-allergy interactions before finalizing a prescription and alert the Provider. | Test: Known allergy triggers warning |
| F-RX-05 | The system shall generate a PDF prescription that includes all legally required fields: Provider PRC license number, expiry date, specialty, clinic address (or teleconsultation indicator), Patient name and age, medication name and dosage, date, and digital signature/PIN. | Test: PDF generated with all required fields |
| F-RX-06 | For controlled substances (Dangerous Drugs), the system shall require the Provider's PDEA S2 license number and apply additional verification. | Test: Controlled substance requires S2 license entry |
| F-RX-07 | The system shall allow the Patient to download or receive the prescription PDF via email/SMS to bring to any Philippine pharmacy (Mercury Drug, Watsons, Rose Pharmacy, local pharmacies). | Test: Patient receives prescription PDF |
| F-RX-08 | The system shall allow Patients to request a refill from their Provider. | Test: Request sent, Provider receives notification |
| F-RX-09 | The system shall allow Providers to approve or deny refill requests. | Test: Approved refill renews prescription with new date |
| F-RX-10 | The system shall display a prescription history timeline for each Patient. | Test: Timeline shows current and past prescriptions |

### 3.8 Notifications and Reminders

**ID:** F-NOTIF

**Description:** The system shall notify users of important events via multiple channels, prioritizing SMS due to its high penetration rate in the Philippines (where smartphone data may be limited).

**Priority:** High

#### Functional Requirements

| ID | Requirement | Verification |
|---|---|---|
| F-NOTIF-01 | The system shall send an appointment confirmation email and SMS immediately after booking. | Test: Both email and SMS received within 30 seconds |
| F-NOTIF-02 | The system shall send an appointment reminder via SMS 24 hours before the scheduled time (SMS is the primary channel in PH due to high open rates). | Test: SMS sent at T-24h |
| F-NOTIF-03 | The system shall send a second SMS reminder 1 hour before the scheduled time with the join link. | Test: SMS sent at T-1h |
| F-NOTIF-04 | The system shall send a browser push notification when a new message is received. | Test: Notification appears when user is on another tab |
| F-NOTIF-05 | The system shall send an SMS and email notification for new messages when the user is offline. | Test: Notification sent within 5 minutes of message |
| F-NOTIF-06 | The system shall send a payment receipt via email and SMS after each successful transaction. | Test: Receipt with correct amount in PHP |
| F-NOTIF-07 | The system shall send a notification to the Provider when a Patient joins the waiting room. | Test: Toast + sound on provider screen |
| F-NOTIF-08 | The system shall allow users to configure their notification preferences (email on/off, SMS on/off, push on/off) with SMS enabled by default. | Test: Toggling a channel off stops notifications via that channel |
| F-NOTIF-09 | The system shall support notification content in Filipino and English, with the Patient's language preference respected. | Test: Filipino-speaking patient receives "Paalala: May appointment ka bukas" |
| F-NOTIF-10 | The system shall respect quiet hours (e.g., no non-critical notifications between 9 PM and 7 AM), except for appointment reminders. | Test: Non-critical notifications suppressed during quiet hours |
| F-NOTIF-11 | The system shall use Semaphore or Chikka as the SMS provider (optimized for Philippine telecoms: Globe, Smart, DITO). | Test: SMS delivered to Globe, Smart, and DITO numbers |

---

## 4. External Interface Requirements

### 4.1 User Interfaces

#### 4.1.1 General Requirements

- **UI-01** — All pages shall be built using the shared `@workspace/ui` component library (shadcn/ui + Tailwind CSS).
- **UI-02** — The UI shall support light and dark themes, with theme preference stored and respected.
- **UI-03** — The UI shall be responsive and functional on screen sizes from 320px (mobile) to 2560px (ultrawide desktop). **Mobile-first design is mandatory** given the majority of PH users access via smartphone.
- **UI-04** — The UI shall support keyboard navigation for all interactive elements.
- **UI-05** — All forms shall display validation errors inline, below the relevant input.
- **UI-06** — Loading states shall be indicated by skeleton placeholders or spinners.
- **UI-07** — Error states shall display a user-friendly message with a retry action where applicable.
- **UI-08** — The UI shall meet WCAG 2.1 AA accessibility standards (contrast ratios, focus indicators, ARIA labels, semantic HTML).
- **UI-09** — The default language shall be English with Filipino (Tagalog) language support toggle. All user-facing text shall be available in both languages.
- **UI-10** — Data-dense layouts (provider search results, appointment lists) shall use infinite scroll rather than pagination for mobile-friendliness.

#### 4.1.2 Key Screens

**Patient Screens:**
| Screen | Purpose |
|---|---|
| Landing / Home | Search providers by specialty, featured providers, quick actions |
| Provider Search | Filter by specialty, availability, price range (PHP); sort by rating or price |
| Provider Profile | PRC credentials, specialty, bio, available slots, patient ratings |
| Booking Flow | Select slot → describe symptoms → select language → confirm → payment |
| My Appointments | Upcoming and past appointments with status |
| Video Call | In-call interface optimized for mobile (large buttons, minimal clutter) |
| Messages | Conversation list and chat view (supports Filipino text) |
| Health Records | Visit history, medications, allergies, lab results |
| Settings | Profile, notification preferences, payment methods, language toggle |

**Provider Screens:**
| Screen | Purpose |
|---|---|
| Dashboard | Today's schedule, upcoming appointments, earnings summary (PHP) |
| Availability Manager | Weekly calendar, set/block slots |
| Patient Queue | Waiting patients, upcoming visits |
| Video Call | In-call interface with admit controls |
| SOAP Note Editor | Structured note-taking per visit (bilingual) |
| Prescription Writer | Generic-first medication search, dosing, PDF generation |
| Messages | Patient conversation list and chat |
| Earnings | Transaction history, payout status, BIR-compliant reports |
| Settings | Profile, PRC license management, schedule, pricing (PHP), notification preferences |

**Admin Screens:**
| Screen | Purpose |
|---|---|
| Dashboard | Key metrics: total users, appointments, revenue (PHP) |
| User Management | List/filter users, approve/reject providers, verify PRC licenses |
| Appointment Log | All appointments with filters and status |
| Analytics | Charts: bookings over time, revenue by specialty, no-show rates, provider performance |
| Audit Log | Searchable log of all system access events (NPC compliance) |
| Payout Management | Manual or automatic provider payout processing |
| Platform Settings | Configuration: slot durations, cancellation window, service fee percentage, notification defaults |

### 4.2 Hardware Interfaces

| Interface | Description |
|---|---|
| **Camera** | The system shall access the user's webcam via the browser's `getUserMedia()` API for video consultations. |
| **Microphone** | The system shall access the user's microphone via the browser's `getUserMedia()` API for audio. |
| **Speaker** | The system shall output audio through the device's default speaker, headset, or earphones. |
| **Screen** | The system shall support screen capture via the browser's `getDisplayMedia()` API for screen sharing (e.g., sharing lab results). |

No specialized hardware is required beyond a standard smartphone, tablet, or computer with a camera, microphone, and internet connection.

### 4.3 Software Interfaces

#### External Services

| Service | Interface Type | Purpose | Data |
|---|---|---|---|
| **Better Auth** | REST API + SDK | Authentication, session management, RBAC | User credentials, roles, sessions |
| **Daily.co / LiveKit** | JavaScript SDK + REST API | Video room creation and management | Room tokens, participant identities |
| **PayMongo** | REST API | Primary payment processing (GCash, Maya, cards, over-the-counter) | Payment intents, source IDs, charge amounts (PHP) |
| **Stripe** | REST API | Secondary payment processing (international cards) | Payment intents, customer IDs |
| **Resend** | REST API | Transactional email delivery | Email addresses, templates, content |
| **Semaphore / Twilio** | REST API | SMS delivery (Globe, Smart, DITO) | Phone numbers, message content |
| **AWS S3 / R2** | S3-compatible API | File storage for attachments, recordings | File binaries, metadata |
| **PostgreSQL** | Prisma ORM + SQL | Primary data storage | All application data |

#### Internal Packages

| Package | Purpose | Location |
|---|---|---|
| `@workspace/ui` | Shared UI components (shadcn/ui) | `packages/ui` |
| `@workspace/shared` | Shared types, validation schemas, utilities | `packages/shared` |

### 4.4 Communications Interfaces

| Protocol | Usage |
|---|---|
| **HTTPS (TLS 1.3)** | All client-server communication |
| **WebRTC** | Peer-to-peer video/audio streaming (via Daily.co/LiveKit relay) |
| **WebSocket** | Real-time messaging and notification delivery |
| **REST (JSON)** | Standard CRUD operations via API |
| **HTTP/2** | Recommended for API performance |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| ID | Requirement | Target |
|---|---|---|
| NFR-PERF-01 | Page load time (initial, Metro Manila broadband) | < 2 seconds |
| NFR-PERF-02 | Page load time (initial, provincial 3G) | < 5 seconds |
| NFR-PERF-03 | Page load time (subsequent, with caching) | < 500ms |
| NFR-PERF-04 | API response time (p95) | < 300ms for read operations, < 500ms for write operations |
| NFR-PERF-05 | Video call connection time | < 5 seconds from clicking "Join" (accounts for lower bandwidth) |
| NFR-PERF-06 | Video latency (optimal conditions) | < 200ms end-to-end |
| NFR-PERF-07 | Video latency (low bandwidth fallback) | Audio-only mode if latency exceeds 1 second |
| NFR-PERF-08 | Message delivery latency | < 1 second (same session), < 30 seconds for SMS delivery |
| NFR-PERF-09 | Concurrent video calls per server | >= 50 simultaneous calls (adjusted for PH bandwidth profile) |
| NFR-PERF-10 | Database query time (p99) | < 1 second |
| NFR-PERF-11 | Search results (provider search) | < 1 second |
| NFR-PERF-12 | Asset sizes | Total page weight < 500 KB (critical for data-capped mobile users) |

### 5.2 Security and Privacy

| ID | Requirement |
|---|---|
| NFR-SEC-01 | All personal and sensitive personal information (as defined by RA 10173) shall be encrypted at rest using AES-256. |
| NFR-SEC-02 | All data in transit shall be encrypted using TLS 1.3. |
| NFR-SEC-03 | Passwords shall be hashed using bcrypt (minimum 12 rounds). |
| NFR-SEC-04 | Session tokens shall be cryptographically random and stored as HTTP-only, SameSite=Strict cookies. |
| NFR-SEC-05 | API endpoints shall enforce rate limiting (100 requests/minute per user, 1000/minute per provider). |
| NFR-SEC-06 | All database queries shall use parameterized queries to prevent SQL injection. |
| NFR-SEC-07 | File uploads shall be scanned for malware before storage. |
| NFR-SEC-08 | Access to health records shall be logged with: user ID, timestamp, IP address, action performed, resource ID. |
| NFR-SEC-09 | Audit logs shall be immutable (write-once, append-only) and stored for a minimum of 5 years per NPC guidelines. |
| NFR-SEC-10 | API endpoints shall validate that the requesting user has the appropriate role and permission for each action. |
| NFR-SEC-11 | Session timeout after 15 minutes of inactivity for Provider and Admin roles. |
| NFR-SEC-12 | The system shall support optional two-factor authentication (TOTP or SMS OTP) for Provider and Admin accounts. |
| NFR-SEC-13 | A Data Privacy Officer (DPO) contact shall be displayed on the privacy page and registration flow per NPC requirement. |
| NFR-SEC-14 | The system shall provide a mechanism for users to exercise their data privacy rights: access, correction, deletion, and portability (RA 10173). |

### 5.3 Reliability and Availability

| ID | Requirement | Target |
|---|---|---|
| NFR-REL-01 | System uptime (excluding planned maintenance) | 99.9% uptime |
| NFR-REL-02 | Planned maintenance window | Once per month, max 1 hour, scheduled during low-usage hours (2-4 AM PHT), notified 48h in advance |
| NFR-REL-03 | Backup frequency (database) | Daily automated backup with 30-day retention |
| NFR-REL-04 | Point-in-time recovery | RPO < 1 hour, RTO < 4 hours |
| NFR-REL-05 | Graceful degradation | Video call continues in audio-only mode if video fails; messaging remains available if video service is down; appointment booking operates independently of video service |
| NFR-REL-06 | Error handling | All API errors return consistent JSON structure: `{ error: string, code: string, details?: any }` |
| NFR-REL-07 | Retry policy | Transient failures (network timeouts, 5xx) shall retry up to 3 times with exponential backoff |
| NFR-REL-08 | SMS fallback | If primary SMS provider (Semaphore) is down, automatically failover to secondary provider (Twilio) |

### 5.4 Usability

| ID | Requirement |
|---|---|
| NFR-UX-01 | No more than 3 taps/clicks to reach any core action (book appointment, join call, send message). |
| NFR-UX-02 | All error messages shall be written in plain language (not technical jargon) and available in both English and Filipino. |
| NFR-UX-03 | Critical actions (booking, payment, ending call) shall require explicit confirmation. |
| NFR-UX-04 | The application shall provide a guided onboarding flow for first-time Patients and Providers. |
| NFR-UX-05 | Forms shall auto-save draft content to prevent data loss. |
| NFR-UX-06 | The video call interface shall have a maximum of 5 large, easy-to-tap controls on mobile to avoid clutter. |
| NFR-UX-07 | All prices shall be clearly displayed in PHP (₱) with the service fee breakdown visible before payment confirmation. |
| NFR-UX-08 | The application shall provide tooltips or help text for complex fields (e.g., PhilHealth information, PDEA license). |
| NFR-UX-09 | Text size shall be at least 16px on mobile for readability without zooming. |
| NFR-UX-10 | Touch targets (buttons, links) shall be at least 44x44px on mobile for easy tapping. |

### 5.5 Scalability

| ID | Requirement |
|---|---|
| NFR-SCAL-01 | The system shall support 50,000 registered users in the first year (Philippine market estimate). |
| NFR-SCAL-02 | The system shall support 200 concurrent video calls at peak (evening hours, 6-9 PM PHT). |
| NFR-SCAL-03 | The API layer shall scale horizontally (increase instance count) without requiring code changes. |
| NFR-SCAL-04 | The database shall support read replicas for scaling read-heavy operations (provider search, record access). |
| NFR-SCAL-05 | File storage shall handle 30 GB of attachments in the first year, scaling with usage. |
| NFR-SCAL-06 | Static assets shall be served via CDN for low-latency access across all Philippine regions (Luzon, Visayas, Mindanao). |
| NFR-SCAL-07 | The system should be deployable in an AWS AP-Southeast-1 (Singapore) or PH-local region for lowest latency to Philippine users. |

### 5.6 Compliance

| ID | Requirement | Standard / Law |
|---|---|---|
| NFR-COMP-01 | All personal and sensitive personal information handling shall comply with RA 10173 (Data Privacy Act of 2012) and NPC issuances. | RA 10173 |
| NFR-COMP-02 | The system shall register as a Personal Information Controller (PIC) with the National Privacy Commission. | NPC |
| NFR-COMP-03 | The system shall comply with DOH Administrative Order 2021-0037 on telehealth services implementation. | DOH AO 2021-0037 |
| NFR-COMP-04 | All prescriptions shall comply with the Generics Act (RA 6675) — generic names shall be mandatory. | RA 6675 |
| NFR-COMP-05 | Controlled substance prescriptions shall comply with PDEA regulations and require valid S2 license. | PDEA / RA 9165 |
| NFR-COMP-06 | The system shall meet WCAG 2.1 AA accessibility standards. | WCAG 2.1 |
| NFR-COMP-07 | The system shall maintain audit trails for a minimum of 5 years per NPC guidelines. | NPC |
| NFR-COMP-08 | The system shall support data portability and deletion requests per RA 10173 Sections 18-20. | RA 10173 |
| NFR-COMP-09 | Provider credentials (PRC license) shall be reverified at minimum every 6 months automatically. | PRC |
| NFR-COMP-10 | Financial records shall comply with BIR requirements for official receipts and digital invoicing. | BIR |

---

## 6. Appendices

### Appendix A: Data Models (Prisma)

Below are the core database models that implement the functional requirements described above, adapted for the Philippine context.

```prisma
// User (backed by Better Auth)
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  mobile        String?   @unique // PH mobile number for SMS
  name          String?
  role          Role      @default(PATIENT)
  emailVerified Boolean   @default(false)
  mobileVerified Boolean  @default(false)
  preferredLang Language  @default(FILIPINO) // Filipino or English
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  patientProfile   PatientProfile?
  providerProfile  ProviderProfile?
  appointments     Appointment[]  @relation("PatientAppointments")
  messages         Message[]
  payments         Payment[]
  notifications    Notification[]
}

enum Role {
  PATIENT
  PROVIDER
  ADMIN
}

enum Language {
  FILIPINO
  ENGLISH
}

model PatientProfile {
  id        String @id @default(cuid())
  userId    String @unique
  user      User   @relation(fields: [userId], references: [id])
  dob       DateTime?
  sex       String? // Male, Female
  phone     String?
  address   String?
  philhealthNumber String? // optional PhilHealth member ID
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  medications Medication[]
  allergies   Allergy[]
  records     HealthRecord[]
}

model ProviderProfile {
  id                    String   @id @default(cuid())
  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id])
  specialty             String   // GP, Internal Medicine, Pedia, OB, Derma, Psych, etc.
  prcLicenseNumber      String   @unique // PRC license number
  prcLicenseExpiry      DateTime
  philhealthAccreditation String? // PhilHealth accreditation code
  pdeaS2License         String?  // PDEA S2 license (for controlled substances)
  pdeaS2Expiry          DateTime?
  bio                   String?
  clinicAddress         String?  // for hybrid in-person consults
  pricePerVisit         Decimal  @db.Decimal(10, 2) // in PHP
  isApproved            Boolean  @default(false)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relations
  availabilities Availability[]
  appointments   Appointment[] @relation("ProviderAppointments")
}

model Availability {
  id             String   @id @default(cuid())
  providerId     String
  provider       ProviderProfile @relation(fields: [providerId], references: [id])
  dayOfWeek      Int      // 0=Sun, 1=Mon ... 6=Sat
  startTime      DateTime // Time stored as datetime for Prisma compatibility
  endTime        DateTime
  slotDuration   Int      // minutes (15, 30, or 60)
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([providerId, dayOfWeek, startTime, endTime])
}

model TimeOff {
  id         String   @id @default(cuid())
  providerId String
  provider   ProviderProfile @relation(fields: [providerId], references: [id])
  date       DateTime
  startTime  DateTime
  endTime    DateTime
  reason     String?
  createdAt  DateTime @default(now())
}

model Appointment {
  id         String            @id @default(cuid())
  patientId  String
  patient    User              @relation("PatientAppointments", fields: [patientId], references: [id])
  providerId String
  provider   ProviderProfile   @relation("ProviderAppointments", fields: [providerId], references: [id])
  startTime  DateTime          // PHT (UTC+8)
  endTime    DateTime          // PHT (UTC+8)
  status     AppointmentStatus @default(BOOKED)
  reason     String?
  symptoms   String?           // brief symptom description
  language   Language?         // patient's preferred language for consult
  type       VisitType         @default(VIDEO)
  roomToken  String?
  callDuration Int?            // seconds
  createdAt  DateTime          @default(now())
  updatedAt  DateTime          @updatedAt

  // Relations
  payment      Payment?
  visitNote    VisitNote?
  videoCallLog VideoCallLog[]
}

enum AppointmentStatus {
  BOOKED
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum VisitType {
  VIDEO
  PHONE       // audio-only
  IN_PERSON   // at clinic
}

model Payment {
  id                String   @id @default(cuid())
  appointmentId     String   @unique
  appointment       Appointment @relation(fields: [appointmentId], references: [id])
  patientId         String
  patient           User     @relation(fields: [patientId], references: [id])
  amount            Decimal  @db.Decimal(10, 2) // PHP
  serviceFee        Decimal  @db.Decimal(10, 2) // platform service fee
  providerAmount    Decimal  @db.Decimal(10, 2) // amount to provider after fees
  currency          String   @default("PHP")
  paymentMethod     String?  // gcash, maya, card, otc
  gateway           String?  // paymongo, stripe
  gatewayPaymentId  String?  // PayMongo or Stripe payment ID
  status            PaymentStatus @default(PENDING)
  officialReceipt   String?  // BIR-compliant receipt number
  refundedAt        DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
  REFUNDED
}

model Message {
  id          String   @id @default(cuid())
  senderId    String
  sender      User     @relation(fields: [senderId], references: [id])
  receiverId  String
  receiver    User     @relation(fields: [receiverId], references: [id])
  appointmentId String? // optional: link to specific visit
  content     String?
  attachmentUrl String?
  attachmentType String?
  isRead      Boolean  @default(false)
  readAt      DateTime?
  createdAt   DateTime @default(now())

  @@index([senderId, receiverId])
  @@index([appointmentId])
}

model VisitNote {
  id            String   @id @default(cuid())
  appointmentId String   @unique
  appointment   Appointment @relation(fields: [appointmentId], references: [id])
  subjective    String?  // in English or Filipino
  objective     String?
  assessment    String?
  plan          String?
  diagnosisCode String?  // ICD-10 PH
  diagnosisDesc String?  // English or Filipino description
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Medication {
  id          String   @id @default(cuid())
  patientId   String
  patient     PatientProfile @relation(fields: [patientId], references: [id])
  name        String   // generic name per RA 6675
  brandName   String?  // optional brand name
  dosage      String
  frequency   String
  route       String?
  prescribedBy String? // provider name
  startDate   DateTime?
  endDate     DateTime?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}

model Allergy {
  id          String   @id @default(cuid())
  patientId   String
  patient     PatientProfile @relation(fields: [patientId], references: [id])
  name        String
  severity    AllergySeverity @default(MILD)
  reaction    String?
  recordedBy  String?
  createdAt   DateTime @default(now())
}

enum AllergySeverity {
  MILD
  MODERATE
  SEVERE
}

model Prescription {
  id              String   @id @default(cuid())
  providerId      String
  provider        ProviderProfile @relation(fields: [providerId], references: [id])
  patientId       String
  patient         PatientProfile @relation(fields: [patientId], references: [id])
  medicationName  String   // generic name
  brandName       String?
  dosage          String
  frequency       String
  duration        String?
  quantity        Int?
  isControlled    Boolean  @default(false) // dangerous drug flag
  pdeaS2Number    String?  // required if controlled
  status          PrescriptionStatus @default(ACTIVE)
  pdfUrl          String?  // generated prescription PDF
  refillAvailable Boolean  @default(false)
  refillCount     Int      @default(0)
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([patientId])
  @@index([providerId])
}

enum PrescriptionStatus {
  ACTIVE
  DISPENSED
  EXPIRED
  CANCELLED
}

model VideoCallLog {
  id            String   @id @default(cuid())
  appointmentId String
  appointment   Appointment @relation(fields: [appointmentId], references: [id])
  providerId    String
  patientId     String
  callStartedAt DateTime?
  callEndedAt   DateTime?
  duration      Int?     // seconds
  recordingUrl  String?
  roomName      String
  connectionQuality String? // excellent, good, fair, poor
  createdAt     DateTime @default(now())
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      NotificationType
  title     String
  titleFil  String?  // Filipino translation
  body      String?
  bodyFil   String?  // Filipino translation
  channel   String   // email, sms, push, in_app
  isRead    Boolean  @default(false)
  readAt    DateTime?
  sentAt    DateTime?
  createdAt DateTime @default(now())
}

enum NotificationType {
  APPOINTMENT_REMINDER
  APPOINTMENT_CONFIRMATION
  NEW_MESSAGE
  PAYMENT_RECEIPT
  PRESCRIPTION_READY
  WAITING_ROOM
  LICENSE_EXPIRY
  SYSTEM
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String
  action     String   // login, record_access, payment, consent_change, etc.
  resource   String?  // appointment, record, payment, user
  resourceId String?
  ipAddress  String?
  userAgent  String?
  metadata   Json?    // arbitrary contextual data
  createdAt  DateTime @default(now())

  @@index([userId, createdAt])
  @@index([action, createdAt])
}

model ConsentLog {
  id        String   @id @default(cuid())
  userId    String
  consentType String // privacy_policy, data_sharing, recording, marketing
  granted   Boolean
  ipAddress String?
  createdAt DateTime @default(now())
}
```

### Appendix B: API Route Map

```
# Patient Routes
GET    /api/providers                    # Search providers (by specialty, name, available)
GET    /api/providers/:id                # Provider profile + credentials + availability
GET    /api/providers/:id/slots?date=    # Available slots for a date (PHT)
POST   /api/appointments                 # Create appointment
GET    /api/appointments                 # My appointments list
GET    /api/appointments/:id             # Appointment detail
PATCH  /api/appointments/:id/cancel      # Cancel appointment
PATCH  /api/appointments/:id/reschedule  # Reschedule appointment
POST   /api/appointments/:id/join        # Get video room token

GET    /api/messages                     # Conversation list
GET    /api/messages/:userId             # Chat with specific user
POST   /api/messages                     # Send message

GET    /api/records                      # My health records
GET    /api/records/:id                  # Specific visit note
GET    /api/records/export               # Export records as PDF (data portability)

GET    /api/medications                  # My medications
GET    /api/allergies                    # My allergies
GET    /api/prescriptions                # My prescriptions
GET    /api/prescriptions/:id/download   # Download prescription PDF

POST   /api/payments/book                # Authorize payment for booking
GET    /api/payments                     # Payment/transaction history

GET    /api/notifications                # My notifications
PATCH  /api/notifications/:id/read       # Mark as read
PUT    /api/settings/notifications       # Update notification preferences
PUT    /api/settings/language            # Update preferred language

DELETE /api/data/me                      # Request data deletion (RA 10173)
GET    /api/data/export                  # Download all my data (portability)

# Provider Routes
GET    /api/provider/schedule            # Today's/upcoming appointments
PUT    /api/provider/availability        # Set weekly availability
POST   /api/provider/time-off            # Block specific time
DELETE /api/provider/availability/:id    # Remove availability slot

PATCH  /api/appointments/:id/status      # Update appointment status
POST   /api/appointments/:id/notes       # Create SOAP note
PUT    /api/appointments/:id/notes       # Update SOAP note

POST   /api/prescriptions                # Write prescription
GET    /api/prescriptions                # Prescription history
PATCH  /api/prescriptions/:id/refill     # Approve/deny refill

GET    /api/provider/earnings            # Earnings dashboard (PHP)
GET    /api/provider/patients            # My patients list
GET    /api/provider/patients/:id/records # Patient's health records

PUT    /api/provider/profile             # Update profile + credentials
GET    /api/provider/credentials         # View credential status

# Admin Routes
GET    /api/admin/users                  # List all users
PATCH  /api/admin/users/:id/approve      # Approve provider (verify PRC license)
GET    /api/admin/users/:id              # User detail
GET    /api/admin/appointments           # All appointments
GET    /api/admin/analytics              # Platform analytics (bookings, revenue, etc.)
GET    /api/admin/audit-log              # Audit trail (NPC compliance)
GET    /api/admin/payouts                 # Payout management
POST   /api/admin/payouts/process        # Process provider payouts
PUT    /api/admin/settings               # Platform settings
GET    /api/admin/reports/revenue        # Revenue report (BIR-compliant)
```

### Appendix C: Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | Authenticated but insufficient permissions |
| `NOT_FOUND` | 404 | Resource does not exist |
| `VALIDATION_ERROR` | 422 | Request body failed validation |
| `CONFLICT` | 409 | Resource conflict (e.g., double-booking) |
| `RATE_LIMITED` | 429 | Too many requests |
| `PAYMENT_FAILED` | 402 | Payment processing failed |
| `PAYMENT_CANCELLED` | 402 | User cancelled payment (GCash/Maya timeout) |
| `SLOT_UNAVAILABLE` | 409 | Requested time slot is no longer available |
| `CANCELLATION_WINDOW` | 422 | Cannot cancel outside allowed window |
| `LICENSE_EXPIRED` | 403 | Provider's PRC license is expired |
| `PRIVACY_CONSENT_REQUIRED` | 403 | User has not accepted privacy policy |
| `DATA_DELETION_PENDING` | 409 | Data deletion request already in progress |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Appendix D: Philippine Compliance Checklist

| Requirement | Law/Regulation | Status |
|---|---|---|
| Data privacy consent during registration | RA 10173 Sec. 13 | Required |
| Privacy notice prominently displayed | NPC Advisory 2020-01 | Required |
| Data breach notification procedure | RA 10173 Sec. 20(f) | Required |
| Patient right to data access | RA 10173 Sec. 16 | Required |
| Patient right to data correction | RA 10173 Sec. 17 | Required |
| Patient right to data deletion | RA 10173 Sec. 18 | Required |
| Patient right to data portability | RA 10173 Sec. 19 | Required |
| Appointment of Data Protection Officer | NPC Circular 16-01 | Required |
| Register as Personal Information Controller | NPC | Required |
| Generic names on all prescriptions | RA 6675 (Generics Act) | Required |
| PRC license verification for all providers | PRC | Required |
| PDEA S2 license for controlled substances | RA 9165 | Required |
| Official receipts for all transactions | BIR Revenue Regs | Required |
| Telehealth consent per DOH guidelines | DOH AO 2021-0037 | Required |
| Minimum 5-year record retention | NPC | Required |
| Data stored in PH or equivalent jurisdiction | NPC | Required |

### Appendix E: Glossary

| Term | Definition |
|---|---|
| **RA 10173** | Data Privacy Act of 2012 — the primary data privacy law in the Philippines, enforced by the National Privacy Commission (NPC) |
| **DOH** | Department of Health — the principal health agency of the Philippine government |
| **PRC** | Professional Regulation Commission — government agency that regulates and licenses professionals including doctors, nurses, and allied health workers |
| **PDEA** | Philippine Drug Enforcement Agency — agency that implements the Comprehensive Dangerous Drugs Act of 2002 (RA 9165) |
| **PhilHealth** | Philippine Health Insurance Corporation — the national health insurance program providing coverage to Filipino citizens |
| **NPC** | National Privacy Commission — government body that administers and implements RA 10173 |
| **S2 License** | License issued by PDEA authorizing a physician to prescribe controlled/dangerous drugs |
| **Generics Act (RA 6675)** | Law requiring that all prescriptions use the generic name of the medication |
| **GCash** | Leading mobile wallet in the Philippines, operated by Globe Telecom's Mynt |
| **Maya** | Digital bank and mobile wallet in the Philippines (formerly PayMaya) |
| **PayMongo** | Philippine payment gateway supporting GCash, Maya, cards, and over-the-counter payments |
| **Semaphore** | Philippine SMS gateway provider with direct connections to Globe, Smart, and DITO |
| **PRC License** | Professional identification card issued by the PRC to licensed professionals |
| **SOAP Note** | Structured clinical note format: Subjective, Objective, Assessment, Plan |
| **ICD-10 PH** | International Classification of Diseases, 10th Revision — Philippine adaptation |
| **PHT** | Philippine Time (UTC+8) — the sole timezone used throughout the system |
| **Taglish** | Code-switching between Tagalog (Filipino) and English, common in everyday Philippine communication |
| **BIR** | Bureau of Internal Revenue — Philippine tax authority |

---

**Document Version History**

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-05-25 | System | Initial draft — Philippine context adaptation |
| | | | |

---

*End of Software Requirements Specification*