# Software Requirements Specification (SRS)

## Telehealth Application — WC Launchpad Builder Round

| Field | Details |
|---|---|
| **Project Name** | Telehealth Platform |
| **Version** | 1.0 |
| **Date** | 2026-05-30 |
| **Status** | Final — Submitted for WC Launchpad Builder Round |
| **Deadline** | 11:59 PM, May 30, 2026 |

---

## Table of Contents

1. [Introduction](#1-introduction)
   - 1.1 Purpose
   - 1.2 Product Scope
   - 1.3 Definitions, Acronyms, and Abbreviations
   - 1.4 References
2. [Overall Description](#2-overall-description)
   - 2.1 Product Perspective
   - 2.2 Product Functions
   - 2.3 User Characteristics
   - 2.4 Constraints
   - 2.5 Assumptions and Dependencies
3. [System Features and Requirements](#3-system-features-and-requirements)
   - 3.1 User Authentication and Role Management
   - 3.2 Patient Profile Management
   - 3.3 Doctor Profile Management
   - 3.4 Doctor Discovery and AI Recommendation
   - 3.5 Appointment Booking
   - 3.6 Consultation Session
   - 3.7 Medical Records & Prescriptions
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
   - Appendix A: Data Models (Prisma)
   - Appendix B: API Route Map
   - Appendix C: Error Codes
   - Appendix D: Philippine Compliance Checklist
   - Appendix E: Deliverables Checklist (Submission)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) defines the complete functional and non-functional requirements for a Telehealth Application built for the **WC Launchpad Builder Round**. The system enables patients to connect with licensed healthcare professionals through video consultations, secure messaging, and integrated health record management — all while complying with Philippine laws and regulations including the Data Privacy Act of 2012 (RA 10173).

The application is designed as a **minimal viable product (MVP)** with two primary modules:
- **Patient Module** — account management, doctor discovery, appointment booking, video consultations, and health records
- **Doctor Module** — profile management, schedule management, virtual consultations, consultation notes, and prescriptions

### 1.2 Product Scope

| Feature | Description | Priority |
|---|---|---|---|
| Patient Account | Register using email and password | ✅ Implemented |
| Patient Profile | Name, birthday, weight, height, profile picture, contact details, basic medical history | ✅ Implemented |
| Doctor Discovery | Browse doctors, view availability, filter by specialization | ✅ Implemented |
| AI Recommendation | AI recommends doctors based on patient symptoms/needs via NVIDIA NIM | ✅ Implemented |
| Appointment Booking | Book, reschedule, cancel consultations online | ✅ Implemented |
| Real-time Notifications | Push notifications for booked, upcoming, and updated appointments | ✅ Implemented |
| Consultation Session | Join video call for virtual consultation (LiveKit) | ✅ Implemented |
| Appointment History | View past consultations and records | ✅ Implemented |
| Medical Records | View basic medical records and prescriptions | ✅ Implemented |
| Doctor Account | Register using email and password | ✅ Implemented |
| Doctor Profile | Add profile details, bio, and specialization | ✅ Implemented |
| Schedule Management | Manage consultation schedules, restrict unavailable time slots | ✅ Implemented |
| Consultation Notes | Add medical notes and/or prescriptions after appointments | ✅ Implemented |
| In-app Chat | Secure real-time messaging between patient and doctor | ✅ Implemented |
| Doctor Reviews | Rate and review doctors after consultations | ✅ Implemented |
| Admin Dashboard | Manage users, approve doctors, view audit logs | ✅ Implemented |

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|---|---|
| **Patient** | End-user who books and attends consultations |
| **Doctor** | Medical professional who manages schedules, consultations, prescriptions, and notes |
| **Admin** | System administrator managing the platform |
| **DOH** | Department of Health (Philippines) |
| **PRC** | Professional Regulation Commission — issues and regulates professional licenses |
| **PDEA** | Philippine Drug Enforcement Agency — regulates controlled substances |
| **PhilHealth** | Philippine Health Insurance Corporation |
| **RA 10173** | Data Privacy Act of 2012 — the primary data privacy law in the Philippines |
| **NPC** | National Privacy Commission — enforces RA 10173 |
| **S2 License** | PDEA license required to prescribe controlled substances |
| **eRx** | Electronic Prescription |
| **EHR** | Electronic Health Record |
| **OTP** | One-Time Password |
| **RBAC** | Role-Based Access Control |
| **GCash** | Leading mobile wallet in the Philippines |
| **Maya** | Mobile wallet / digital bank (formerly PayMaya) |
| **PHP** | Philippine Peso |
| **PHT** | Philippine Time (UTC+8) |

### 1.4 References

| Reference | Source |
|---|---|
| Data Privacy Act of 2012 (RA 10173) | https://www.privacy.gov.ph/data-privacy-act/ |
| DOH Telehealth Guidelines (AO 2021-0037) | https://doh.gov.ph |
| PRC Online Services | https://www.prc.gov.ph |
| Better Auth Documentation | https://www.better-auth.com |
| Next.js Documentation | https://nextjs.org/docs |
| NestJS Documentation | https://docs.nestjs.com |

---

## 2. Overall Description

### 2.1 Product Perspective

The Telehealth Application is a web-based platform connecting patients with licensed Philippine healthcare providers through video consultations. It is built with a monorepo architecture using:

- **Frontend**: Next.js 16 + React 19 + Tailwind CSS v4 + shadcn/ui (`apps/web`)
- **Backend**: NestJS 11 REST API (`apps/api`)
- **Database**: PostgreSQL 16 via Prisma ORM with `@prisma/adapter-pg`
- **Auth**: Better Auth (email/password, 2FA)
- **AI Recommendation**: NVIDIA NIM — Nemotron-3-Super-120B-A12B (`nvidia/nemotron-3-super-120b-a12b`), fallback: Qwen3.5-122B-A10B (`qwen/qwen3.5-122b-a10b`)
- **Monorepo**: Turborepo + pnpm workspaces
- **Video**: LiveKit (self-hosted on AWS EC2)
- **Notifications**: WebSocket via Socket.io (NestJS Gateway)
- **File Storage**: AWS S3
- **Deployment**: Docker / AWS Elastic Beanstalk (API + Web), no Vercel

### 2.2 Product Functions

The system supports the following high-level functions:

1. **User Registration and Authentication**
   - Patient and Doctor registration with email/password
   - Role-based access control (Patient, Doctor)
   - Two-factor authentication (TOTP via authenticator apps)

2. **Patient Profile Management**
   - Personal information: name, birthday, weight, height, profile picture, contact details
   - Basic medical history
   - View medical records and prescriptions

3. **Doctor Discovery and AI Recommendation**
   - Browse available doctors by specialty
   - Filter/search doctors by specialization
   - AI-powered doctor recommendation based on patient symptoms and needs

4. **Appointment Lifecycle**
   - Doctor availability management (weekly schedule, time-off)
   - Patient browsing and booking
   - Appointment confirmation, rescheduling, and cancellation
   - Real-time push notifications for appointment updates

5. **Video Consultations**
   - Real-time video/audio calls in-browser (via third-party service)
   - Join consultation session from appointment
   - View appointment history

6. **Medical Records & Prescriptions**
   - Doctor access to patient consultation history
   - Consultation notes and prescriptions after each appointment
   - Patient view of basic medical records

7. **Notifications**
   - Real-time push notifications for booked, upcoming, and updated appointments
   - Schedule change alerts

### 2.3 User Characteristics

#### 2.3.1 Patient

| Attribute | Description |
|---|---|
| Technical proficiency | Low to moderate; many first-time telehealth users |
| Primary goal | Obtain convenient, affordable healthcare without visiting a clinic |
| Devices | Smartphone (mobile web) primarily; desktop secondary |
| Internet connectivity | Metro Manila/urban — stable 4G/5G; Provincial/rural — intermittent 3G/4G |
| Frequency of use | Occasional (once per episode of care) |
| Language preference | Filipino, Taglish, or English |

#### 2.3.2 Doctor

| Attribute | Description |
|---|---|
| Typical providers | General practitioners, internists, pediatricians, OB-GYNs, psychiatrists, dermatologists |
| Technical proficiency | Moderate |
| Primary goal | Efficiently see patients, document visits |
| Devices | Desktop primarily (may use tablet for notes) |
| Frequency of use | Daily during clinic hours |
| Regulatory requirements | Must maintain active PRC license |

#### 2.3.3 Admin

| Attribute | Description |
|---|---|
| Technical proficiency | High |
| Primary goal | Manage users, verify doctor credentials, monitor operations |
| Devices | Desktop |

### 2.4 Constraints

1. **Regulatory Compliance** — The system must comply with:
   - **RA 10173 (Data Privacy Act of 2012)** — personal and sensitive personal information
   - **DOH AO 2021-0037** — Guidelines on the Implementation of Telehealth Services
   - **PRC requirements** — valid license verification for all practicing doctors
   - **PDEA regulations** — for controlled substance prescriptions

2. **Data Sovereignty** — Patient health data must be stored within the Philippines or in jurisdictions with equivalent data protection standards recognized by the NPC.

3. **Browser Support** — Must support the last two major versions of Chrome, Firefox, Safari, and Edge. Mobile Safari and Chrome on Android are primary targets.

4. **Monorepo Architecture** — All code must live within the existing `telehealth-app` structure and adhere to its conventions (Turborepo, Biome linting, shared packages).

5. **Deployment Target** — AWS Elastic Beanstalk for both API and web frontend. No Vercel. LiveKit self-hosted on AWS EC2.

6. **Database** — PostgreSQL; schema changes managed via Prisma migrations in the `apps/api` workspace.

7. **Authentication** — Must use Better Auth as the authentication provider.

### 2.5 Assumptions and Dependencies

- **Assumptions**
  - Users have a stable internet connection (minimum 1 Mbps download).
  - Doctors are properly licensed by the PRC and in good standing.
  - Credential verification (PRC license validation) may be manual in MVP.

- **Dependencies**
- Better Auth library for authentication flows.
- LiveKit (self-hosted on AWS EC2) for video consultations.
- NVIDIA NIM API (Nemotron-3-Super-120B-A12B, fallback: Qwen3.5-122B-A10B) for AI-powered doctor recommendations. OpenAI-compatible endpoint at `integrate.api.nvidia.com/v1`.
- AWS S3 for file storage (profile photos, attachments).
- PostgreSQL database availability via Docker (development) or AWS RDS (production).
- Socket.io for real-time WebSocket notifications.

---

## 3. System Features and Requirements

### 3.1 User Authentication and Role Management

**ID:** F-AUTH

**Description:** The system shall provide secure registration, login, and role-based access control for Patient and Doctor users, compliant with the Data Privacy Act of 2012 (RA 10173).

**Priority:** Critical

#### Functional Requirements

| ID | Requirement | Verification |
|---|---|---|
| F-AUTH-01 | The system shall allow users to register as a Patient or Doctor using email and password (minimum 8 characters, must include letter and number). | Test: Registration form submits successfully, user created in DB |

| F-AUTH-03 | The system shall enforce role-based access control: Patients access only patient routes; Doctors access only doctor routes; Admins access admin dashboard. | Test: Role mismatch returns 403 |
| F-AUTH-04 | The system shall allow users to reset their password via a secure email link. | Test: Password reset sent, link works once |
| F-AUTH-05 | The system shall maintain session tokens with a configurable expiry (default: 7 days). | Test: Session expires as configured |
| F-AUTH-06 | The system shall allow Doctors to complete a profile with: full name, PRC license number, PRC license expiry date, specialty, bio, profile photo. | Test: Profile update persists |
| F-AUTH-07 | The system shall display a prominent privacy notice (Data Privacy Act compliant) during registration, requiring explicit consent. | Test: Consent checkbox required; without it, registration blocked |
| F-AUTH-08 | The system shall allow Admins to verify and approve Doctor registrations by validating PRC license details. | Test: Pending doctor cannot offer appointments |
| F-AUTH-09 | The system shall log all login attempts (successful and failed) with IP address and timestamp for NPC compliance. | Test: Audit log entry created on each attempt |
| F-AUTH-10 | The system shall support two-factor authentication (2FA) via TOTP authenticator apps with backup codes. | Test: 2FA enable/disable/verify works correctly |

### 3.2 Patient Profile Management

**ID:** F-PATIENT

**Description:** The system shall allow Patients to manage their personal profile, book appointments, join video consultations, and access medical records.

**Priority:** Critical

#### Functional Requirements

| ID | Requirement | Verification |
|---|---|---|
| F-PATIENT-01 | The system shall allow Patients to input personal information: name, birthday, weight, height, profile picture, contact details. | Test: Profile fields save and persist |
| F-PATIENT-02 | The system shall allow Patients to add basic medical history (allergies, chronic conditions, current medications). | Test: Medical history saved and displayed |
| F-PATIENT-03 | The system shall display a patient profile view with all personal information and medical history. | Test: Profile page renders correctly |
| F-PATIENT-04 | The system shall allow Patients to update their profile information at any time. | Test: Updates persist after page refresh |


### 3.3 Doctor Profile Management

**ID:** F-DOCTOR

**Description:** The system shall allow Doctors to manage their professional profile, including credentials and specialization.

**Priority:** Critical

#### Functional Requirements

| ID | Requirement | Verification |
|---|---|---|
| F-DOCTOR-01 | The system shall allow Doctors to register with email and password. | Test: Doctor account created with default PENDING status |
| F-DOCTOR-02 | The system shall allow Doctors to add profile details: bio, specialization, PRC license number, profile picture. | Test: Profile details persist |
| F-DOCTOR-03 | The system shall display a doctor's public profile with credentials and specialization. | Test: Public profile visible to unauthenticated users |
| F-DOCTOR-04 | The system shall prevent unapproved Doctors from being listed publicly or accepting appointments. | Test: Pending doctor not visible in search results |

### 3.4 Doctor Discovery and AI Recommendation

**ID:** F-DISCOVERY

**Description:** The system shall enable Patients to discover licensed doctors and receive AI-powered recommendations based on their healthcare needs.

**Priority:** Critical

#### Functional Requirements

| ID | Requirement | Verification |
|---|---|---|
| F-DISCOVERY-01 | The system shall allow Patients to browse all approved doctors and view their availability. | Test: Approved doctors listed with schedules |
| F-DISCOVERY-02 | The system shall allow Patients to filter doctors by specialization (e.g., Cardiology, Pediatrics, Dermatology). | Test: Filter returns matching results |
| F-DISCOVERY-03 | The system shall allow Patients to search doctors by name or specialty. | Test: Search returns matching doctors |
| F-DISCOVERY-04 | The system shall provide an AI-powered recommendation feature that suggests doctors based on patient-described symptoms or healthcare needs, using NVIDIA NIM (Nemotron-3-Super-120B-A12B) for symptom-to-specialty mapping. | Test: AI recommendation returns relevant doctors |
| F-DISCOVERY-05 | The system shall display doctor profiles with: name, specialty, bio, PRC credentials, price per visit, and available time slots. | Test: All fields render on profile page |

### 3.5 Appointment Booking

**ID:** F-APPT

**Description:** The system shall enable Doctors to manage availability and Patients to discover, book, and manage appointments — operating in Philippine Time (PHT, UTC+8).

**Priority:** Critical

#### Functional Requirements

| ID | Requirement | Verification |
|---|---|---|
| F-APPT-01 | The system shall allow Doctors to set recurring weekly availability with configurable time slots (15, 30, or 60 minutes). | Test: Availability saved, slots generated |
| F-APPT-02 | The system shall allow Doctors to block specific dates/times for personal time or admin work. | Test: Blocked slots not visible to patients |
| F-APPT-03 | The system shall allow Patients to book an appointment by selecting a Doctor, slot, and providing reason for visit. | Test: Appointment created, confirmation displayed |
| F-APPT-04 | The system shall prevent double-booking by locking the slot during the booking transaction. | Test: Concurrent booking attempts — one succeeds, one fails |
| F-APPT-05 | The system shall allow Patients to cancel an appointment. | Test: Cancelled appointment status updated |
| F-APPT-06 | The system shall allow Patients to reschedule an appointment to another available slot. | Test: Original slot freed, new slot booked |
| F-APPT-07 | The system shall allow Doctors to mark an appointment as: booked, confirmed, in_progress, completed, or cancelled. | Test: Status transitions follow valid state machine |
| F-APPT-08 | The system shall display an appointment history timeline for both Patient and Doctor. | Test: History page shows past and future appointments |
| F-APPT-09 | The system shall operate entirely in Philippine Time (PHT, UTC+8). | Test: All times displayed in PHT |

#### State Machine

```
booked ──→ confirmed ──→ in_progress ──→ completed
  │                         │
  └──→ cancelled            └──→ cancelled
```

### 3.6 Consultation Session

**ID:** F-CONSULT

**Description:** The system shall facilitate real-time video consultations between Patients and Doctors directly in the browser, optimized for Philippine internet conditions.

**Priority:** Critical

#### Functional Requirements

| ID | Requirement | Verification |
|---|---|---|
| F-CONSULT-01 | The system shall generate a unique video room for each appointment. | Test: Room created at appointment start time |
| F-CONSULT-02 | The system shall allow the Patient to join the video room at the appointment start time. | Test: Join button activates at scheduled time |
| F-CONSULT-03 | The system shall allow the Doctor to admit the Patient into the call. | Test: Patient's screen transitions to active call |
| F-CONSULT-04 | The system shall provide controls for: mute/unmute, camera on/off, and end call on both sides. | Test: Each control functions independently |
| F-CONSULT-05 | The system shall redirect both parties to a post-visit screen when the call ends. | Test: After end call, users see respective post-visit pages |
| F-CONSULT-06 | The system shall store call metadata (duration, participants, timestamps) for records. | Test: Call record created in DB |

### 3.7 Medical Records & Prescriptions

**ID:** F-RECORDS

**Description:** The system shall allow Doctors to document findings, recommendations, and prescriptions after each consultation, and Patients to view their basic medical records.

**Priority:** Critical

#### Functional Requirements

| ID | Requirement | Verification |
|---|---|---|
| F-RECORDS-01 | The system shall allow Doctors to add consultation notes after each appointment. | Test: Notes saved and linked to appointment |
| F-RECORDS-02 | The system shall allow Doctors to write electronic prescriptions with medication name, dosage, and instructions. | Test: Prescription saved and visible to patient |
| F-RECORDS-03 | The system shall allow Patients to view their basic medical records and prescriptions from past consultations. | Test: Patient sees records list |
| F-RECORDS-04 | The system shall allow Doctors to view a patient's consultation history and previously issued records. | Test: Doctor sees patient's past appointments |

### 3.8 Notifications and Reminders

**ID:** F-NOTIF

**Description:** The system shall notify users of important events via real-time push notifications.

**Priority:** Critical

#### Functional Requirements

| ID | Requirement | Verification |
|---|---|---|
| F-NOTIF-01 | The system shall send real-time push notifications for booked, upcoming, and updated appointments. | Test: Push notification received on schedule change |
| F-NOTIF-02 | The system shall notify users when an appointment is booked, rescheduled, or cancelled. | Test: Notification sent within 5 seconds of event |
| F-NOTIF-03 | The system shall send a notification to the Doctor when a Patient has booked an appointment. | Test: Doctor receives booking notification |
| F-NOTIF-04 | The system shall allow users to configure their notification preferences. | Test: Toggling notifications on/off works |

---

## 4. External Interface Requirements

### 4.1 User Interfaces

#### General Requirements

- **UI-01** — All pages shall be built using the shared `@workspace/ui` component library (shadcn/ui + Tailwind CSS).
- **UI-02** — The UI shall support light and dark themes, with theme preference stored and respected.
- **UI-03** — The UI shall be responsive and functional on screen sizes from 320px (mobile) to 2560px (ultrawide desktop). **Mobile-first design is mandatory**.
- **UI-04** — All forms shall display validation errors inline, below the relevant input.
- **UI-05** — Loading states shall be indicated by skeleton placeholders or spinners.
- **UI-06** — Error states shall display a user-friendly message with a retry action where applicable.

#### Key Screens

**Patient Screens:**
| Screen | Purpose |
|---|---|
| Landing / Home | Search doctors by specialty, featured doctors, quick actions |
| Doctor Search | Filter by specialty, availability; AI recommendation |
| Doctor Profile | PRC credentials, specialty, bio, available slots |
| Booking Flow | Select doctor and slot → confirm |
| My Appointments | Upcoming and past appointments with status |
| Video Call | In-call interface optimized for mobile |
| Medical Records | View basic medical records and prescriptions |
| Settings | Profile, notification preferences |

**Doctor Screens:**
| Screen | Purpose |
|---|---|
| Dashboard | Today's schedule, upcoming appointments |
| Availability Manager | Weekly calendar, set/block slots |
| Patient Queue | Waiting patients, upcoming visits |
| Video Call | In-call interface |
| Consultation Notes | Add notes and prescriptions after visit |
| Appointment History | Past consultations and patient records |
| Settings | Profile, PRC license, schedule |

### 4.2 Hardware Interfaces

| Interface | Description |
|---|---|
| **Camera** | The system shall access the user's webcam via the browser's `getUserMedia()` API for video consultations. |
| **Microphone** | The system shall access the user's microphone via the browser's `getUserMedia()` API for audio. |
| **Speaker** | The system shall output audio through the device's default speaker, headset, or earphones. |

### 4.3 Software Interfaces

#### External Services

| Service | Interface Type | Purpose | Data |
|---|---|---|---|
| **Better Auth** | REST API + SDK | Authentication, session management, RBAC | User credentials, roles, sessions |
| **LiveKit** | JavaScript SDK + REST API (self-hosted on AWS EC2) | Video room creation and management | Room tokens, participant identities |
| **NVIDIA NIM** (Nemotron-3-Super-120B-A12B) | OpenAI-compatible REST API (`integrate.api.nvidia.com/v1`) | AI doctor recommendation based on symptoms | Symptom description, doctor specialty data, recommendation result |
| **AWS S3** | S3 API | File storage for attachments (profile photos, documents) | File binaries, metadata |
| **PostgreSQL** | Prisma ORM + SQL | Primary data storage | All application data |
| **Socket.io** | WebSocket (NestJS Gateway) | Real-time push notifications | Appointment events, notification payloads |

#### Internal Packages

| Package | Purpose | Location |
|---|---|---|
| `@workspace/ui` | Shared UI components (shadcn/ui) | `packages/ui` |
| `@workspace/shared` | Shared types, validation schemas, utilities | `packages/shared` |

### 4.4 Communications Interfaces

| Protocol | Usage |
|---|---|
| **HTTPS (TLS 1.3)** | All client-server communication |
| **WebRTC** | Peer-to-peer video/audio streaming (via LiveKit server relay) |
| **WebSocket** | Real-time notifications via Socket.io (NestJS Gateway) |
| **REST (JSON)** | Standard CRUD operations via API |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| ID | Requirement | Target |
|---|---|---|
| NFR-PERF-01 | Page load time (initial, Metro Manila broadband) | < 2 seconds |
| NFR-PERF-02 | Page load time (initial, provincial 3G) | < 5 seconds |
| NFR-PERF-03 | API response time (p95) | < 300ms for read operations, < 500ms for write operations |
| NFR-PERF-04 | Notification delivery latency | < 5 seconds |
| NFR-PERF-05 | Total page weight | < 500 KB (critical for data-capped mobile users) |

### 5.2 Security and Privacy

| ID | Requirement |
|---|---|
| NFR-SEC-01 | All personal and sensitive personal information (as defined by RA 10173) shall be encrypted at rest using AES-256. |
| NFR-SEC-02 | All data in transit shall be encrypted using TLS 1.3. |
| NFR-SEC-03 | Passwords shall be hashed using bcrypt (minimum 12 rounds). |
| NFR-SEC-04 | Session tokens shall be cryptographically random and stored as HTTP-only, SameSite=Strict cookies. |
| NFR-SEC-05 | API endpoints shall enforce rate limiting (30 requests per 60-second window). |
| NFR-SEC-06 | All database queries shall use parameterized queries to prevent SQL injection. |
| NFR-SEC-07 | Access to health records shall be logged with: user ID, timestamp, IP address, action performed, resource ID. |
| NFR-SEC-08 | Audit logs shall be immutable (write-once, append-only) and stored for a minimum of 5 years per NPC guidelines. |
| NFR-SEC-09 | A Data Privacy Officer (DPO) contact shall be displayed on the privacy page and registration flow per NPC requirement. |
| NFR-SEC-10 | The system shall provide a mechanism for users to exercise their data privacy rights: access, correction, deletion, and portability (RA 10173). |

### 5.3 Reliability and Availability

| ID | Requirement | Target |
|---|---|---|
| NFR-REL-01 | System uptime (excluding planned maintenance) | 99.9% uptime |
| NFR-REL-02 | Graceful degradation | Video call continues in audio-only mode if video fails; messaging remains available if video service is down |
| NFR-REL-03 | Error handling | All API errors return consistent JSON structure: `{ error: string, code: string, details?: any }` |
| NFR-REL-04 | Retry policy | Transient failures (network timeouts, 5xx) shall retry up to 3 times with exponential backoff |

### 5.4 Usability

| ID | Requirement |
|---|---|
| NFR-UX-01 | No more than 3 taps/clicks to reach any core action (book appointment, join call, view records). |
| NFR-UX-02 | All error messages shall be written in plain language (not technical jargon). |
| NFR-UX-03 | Critical actions (booking, ending call) shall require explicit confirmation. |
| NFR-UX-04 | The video call interface shall have a maximum of 5 large, easy-to-tap controls on mobile. |
| NFR-UX-05 | Touch targets (buttons, links) shall be at least 44x44px on mobile for easy tapping. |

### 5.5 Scalability

| ID | Requirement |
|---|---|
| NFR-SCAL-01 | The system shall support 10,000 registered users in the first year. |
| NFR-SCAL-02 | The API layer shall scale horizontally without requiring code changes. |
| NFR-SCAL-03 | The database shall support read replicas for scaling read-heavy operations. |
| NFR-SCAL-04 | Static assets shall be served via CDN for low-latency access across all Philippine regions. |

### 5.6 Compliance

| ID | Requirement | Standard / Law |
|---|---|---|
| NFR-COMP-01 | All personal and sensitive personal information handling shall comply with RA 10173 (Data Privacy Act of 2012) and NPC issuances. | RA 10173 |
| NFR-COMP-02 | The system shall register as a Personal Information Controller (PIC) with the National Privacy Commission. | NPC |
| NFR-COMP-03 | The system shall comply with DOH Administrative Order 2021-0037 on telehealth services implementation. | DOH AO 2021-0037 |
| NFR-COMP-04 | The system shall maintain audit trails for a minimum of 5 years per NPC guidelines. | NPC |
| NFR-COMP-05 | Doctor credentials (PRC license) shall be reverified at minimum every 6 months automatically. | PRC |

---

## 6. Appendices

### Appendix A: Data Models (Prisma)

The complete schema is maintained at `apps/api/prisma/schema.prisma`. All primary keys use `uuid()` (migrated from `cuid()`). Key models:

**User Model:**
```
- id: String @id @default(uuid())
- email, emailVerified, mobile, mobileVerified
- name, image, role (PATIENT/DOCTOR/ADMIN)
- banned, banReason, banExpires
- failedLoginAttempts, lockoutUntil          // Account lockout
- twoFactorEnabled, twoFactorSecret, twoFactorBackupCodes  // 2FA
- Relationships: sessions, accounts, securityAlerts,
  patientProfile, doctorProfile, consentLogs,
  appointments (as Patient), notifications,
  sentMessages/receivedMessages, reviews
```

**PatientProfile Model:**
```
- id, userId (unique), dob, sex, phone, address
- philhealthNumber, weight, height, medicalHistory (Json?)
```

**DoctorProfile Model:**
```
- id, userId (unique), specialty, prcLicenseNumber
- prcLicenseExpiry, philhealthAccreditation
- pdeaS2License, pdeaS2Expiry, bio, clinicAddress
- pricePerVisit (Decimal), isApproved (default false)
- Relationships: appointments, availabilitySchedule, reviews
```

**AvailabilitySchedule Model:**
```
- id, doctorId (unique)
- monday..sunday: String (JSON array of time slots, default "[]")
- slotDuration: Int (default 30)
- Relationships: appointments, timeOffs
```

**TimeOff Model:**
```
- id, scheduleId, startDate, endDate, reason?
```

**Appointment Model:**
```
- id @default(uuid()), patientId, doctorId, scheduleId
- startTime, endTime, status (AppointmentStatus)
- reason?, symptoms?, type (VIDEO/PHONE/IN_PERSON)
- roomUrl?, notes?
- Relationships: patient, doctor, schedule, consultation,
  chatMessages[], reviews[]
```

**Consultation Model:**
```
- id, appointmentId (unique)
- patientNotes?, doctorNotes?, diagnosis?, plan?
- Relationships: appointment, prescriptions[]
```

**Prescription Model:**
```
- id, consultationId, medicationName, dosage
- frequency, duration, instructions?
```

**Review Model:**
```
- id @default(uuid()), patientId, doctorId, appointmentId
- rating (Int 1-5), comment?
- @@unique([patientId, appointmentId])
```

**ChatMessage Model:**
```
- id @default(uuid()), senderId, receiverId
- appointmentId?, content, isRead (default false)
```

**Notification Model:**
```
- id @default(uuid()), userId, type (NotificationType enum)
- title, body?, isRead, readAt?
```

**NotificationType enum:** APPOINTMENT_REMINDER, APPOINTMENT_CONFIRMATION, APPOINTMENT_CANCELLED, NEW_MESSAGE, SCHEDULE_UPDATED, SYSTEM

**SecurityAlert Model:**
```
- id, userId, title, message, ipAddress?, userAgent?, read
```

**AuditLog Model:**
```
- id, action, actorId, actorEmail, targetId?, targetEmail?, reason?, timestamp
```

**ConsentLog Model:**
```
- id, userId, consentType, granted, ipAddress?
```

### Appendix B: API Route Map

```
# Authentication (Better Auth)
POST /api/auth/sign-in
POST /api/auth/sign-up
POST /api/auth/sign-out
POST /api/auth/reset-password
POST /api/auth/forgot-password
POST /api/auth/change-password
GET /api/auth/session

# 2FA (Better Auth)
POST /api/auth/two-factor/verify
POST /api/auth/two-factor/enable
POST /api/auth/two-factor/disable
POST /api/auth/two-factor/backup-codes

# Doctor Discovery (public)
GET /api/doctors                       # Search approved doctors (specialty, search, sort)
GET /api/doctors/:id                   # Doctor profile detail (with avg rating)
POST /api/recommendations              # AI recommendation (symptoms → doctors)

# Availability (public + doctor)
GET /api/availability/:doctorId        # Doctor's weekly schedule
GET /api/availability/:doctorId/slots?date=  # Available slots for a date
PUT /api/availability                  # Set weekly availability (Doctor)
GET /api/availability/mine             # Get my availability (Doctor)
POST /api/availability/time-off        # Block specific time (Doctor)
GET /api/availability/time-off         # Get my time-off blocks (Doctor)
DELETE /api/availability/time-off/:id  # Remove a time-off entry (Doctor)

# Appointments
POST /api/appointments                 # Create appointment (Patient)
GET /api/appointments                  # My appointments list (Patient or Doctor)
GET /api/appointments/:id              # Appointment detail
PATCH /api/appointments/:id/status     # Update status (Doctor/Admin)
PATCH /api/appointments/:id/cancel     # Cancel appointment
PATCH /api/appointments/:id/reschedule # Reschedule appointment (Patient)
GET /api/appointments/upcoming         # Upcoming appointments
GET /api/appointments/history          # Past appointments

# Medical Records & Prescriptions
GET /api/records/consultations         # My consultations list
GET /api/records/consultations/:id     # Single consultation detail
POST /api/records/consultations        # Create consultation notes (Doctor)
POST /api/records/consultations/:id/prescriptions  # Add prescription (Doctor)
GET /api/records/prescriptions         # My prescriptions (Patient)

# Video Consultation (LiveKit)
POST /api/video/rooms                  # Create video room
POST /api/video/rooms/:roomName/join   # Get token to join room
PATCH /api/video/rooms/:roomName/end   # End consultation
GET /api/video/rooms/:roomName         # Get room metadata

# Notifications (Socket.IO Gateway)
GET /api/notifications                 # List notifications
GET /api/notifications/unread-count    # Unread count
PATCH /api/notifications/:id/read      # Mark as read
PATCH /api/notifications/read-all      # Mark all as read

# Chat
GET /api/chat/conversations            # List conversations
GET /api/chat/messages/:userId         # Get messages with user
POST /api/chat/messages                # Send message
POST /api/chat/messages/:userId/read   # Mark messages as read

# Patient Profile
POST /api/patients/profile             # Create/update patient profile
GET /api/patients/profile              # Get patient profile

# Doctor Registration
POST /api/doctors/register             # Register as doctor

# Doctor Reviews
GET /api/reviews/doctors/:doctorId     # Get doctor reviews
POST /api/reviews                      # Submit review (Patient)

# User Management (Self)
GET /api/users/me                      # Current user profile
PATCH /api/users/me                    # Update profile

# Consent
POST /api/consent                      # Record consent action
GET /api/consent                       # Get consent history

# Admin Routes
GET /api/admin/users                   # List all users
PATCH /api/admin/users/:id/ban         # Ban user
PATCH /api/admin/users/:id/role        # Change user role
PATCH /api/admin/doctors/:id/approve   # Approve doctor (verify PRC)
PATCH /api/admin/doctors/:id/reject    # Reject doctor
GET /api/admin/appointments            # All appointments
GET /api/admin/audit-logs              # Audit trail (NPC compliance)
GET /api/admin/security-alerts         # Security alerts
GET /api/admin/reports                 # Platform analytics/reports

# Security Alerts (User-facing)
GET /api/security-alerts               # My security alerts

# Storage (S3)
POST /api/storage/upload               # Upload file (profile photo, etc.)
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
| `SLOT_UNAVAILABLE` | 409 | Requested time slot is no longer available |
| `CANCELLATION_WINDOW` | 422 | Cannot cancel outside allowed window |
| `LICENSE_EXPIRED` | 403 | Doctor's PRC license is expired |
| `PRIVACY_CONSENT_REQUIRED` | 403 | User has not accepted privacy policy |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Appendix D: Philippine Compliance Checklist

| Requirement | Law/Regulation | Status |
|---|---|---|
| Data privacy consent during registration | RA 10173 Sec. 13 | ✅ ConsentLog model + consent collection |
| Privacy notice prominently displayed | NPC Advisory 2020-01 | ✅ Privacy notice during sign-up flow |
| Patient right to data access | RA 10173 Sec. 16 | ✅ Records/consultation history available via API |
| Patient right to data correction | RA 10173 Sec. 17 | ✅ Profile settings update endpoints |
| Patient right to data deletion | RA 10173 Sec. 18 | 🔧 Account deletion endpoint planned |
| Patient right to data portability | RA 10173 Sec. 19 | ✅ All data accessible via API for export |
| Appointment of Data Protection Officer | NPC Circular 16-01 | ⬜ Contact displayed on privacy page |
| Register as Personal Information Controller | NPC | ⬜ Production requirement |
| PRC license verification for all doctors | PRC | ✅ Doctor registration with PRC license + admin approval workflow |
| Account lockout after failed attempts | NPC | ✅ Lockout after 5 failed attempts (configurable) |
| Audit logging of all auth events | NPC | ✅ AuditLog table — login, logout, failed attempts |
| Password complexity enforcement | NPC | ✅ Min 8 chars, uppercase, lowercase, number, special char |
| Session management with expiry | NPC | ✅ 7-day session expiry, rotation every 24h |
| Email verification required | NPC | ✅ requireEmailVerification: true |
| Security alerts for sensitive actions | NPC | ✅ SecurityAlert model — password change, etc. |
| Minimum 5-year record retention | NPC | Retention scheduling service (`retention/`) |
| Data stored in PH or equivalent jurisdiction | NPC | ✅ AWS deployment (AP-Southeast-1 Singapore) |

### Appendix E: Deliverables Checklist (WC Launchpad Submission — SE Track)

| Deliverable | Details | Status |
|---|---|---|
| Pair Programming Session | Schedule via booking link | ⬜ To be scheduled |
| Video Recording | Max 15 min — app walkthrough, code overview, challenges | ⬜ To be recorded |
| Deployed Application URL | AWS Elastic Beanstalk | ⬜ To be deployed |
| Git Repository | https://github.com/leodyversemilla07/telehealth-app | ✅ Private/accessible |

**Deadline:** 11:59 PM, May 30, 2026  
**Submission:** https://forms.gle/2QrDQ17KBhHqWqBK9

### Bonus Features Implemented

| Feature | Description |
|---|---|
| In-app Chat | Real-time secure messaging via Socket.io between patient and doctor |
| Doctor Reviews & Ratings | Patients can rate (1-5) and review doctors post-consultation |
| AI Symptom Checker | NVIDIA NIM-powered symptom analysis with condition assessment |
| Two-Factor Authentication (2FA) | TOTP via authenticator apps with backup codes |
| Account Lockout | Auto-lock after 5 failed login attempts |
| Admin Dashboard | User management, doctor approval, audit logs, security alerts, reports |
| Appearance/Theme Toggle | Light/dark mode across all roles (admin, doctor, patient) |
| Dynamic Breadcrumbs | Context-aware navigation breadcrumbs |
| Design System | Custom telehealth-themed design system (oklch color palette) |
| Shared UI Components | Empty states, spinners, date pickers, navigation menus |
| Philippine Compliance | Consent logging, audit trails, PRC license validation, PDEA S2 support |

---

**Document Version History**

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-05-30 | System | Updated for WC Launchpad Builder Round — focused MVP with Patient/Doctor modules, AI recommendation, real-time notifications, and RA 10173 compliance |
| 1.1 | 2026-05-27 | System | Provider→Doctor rename throughout; updated Appendix A (normalized Consultation/Prescription models); updated Appendix B (API routes to match implementation: /doctors, /availability, /records, /video, /notifications, /consent) |
| 1.2 | 2026-05-29 | System | Added Doctor Reviews/Ratings schema and JSON structures in Appendix A. |
| 1.3 | 2026-05-30 | System | Updated schema to uuid(); added lockout, 2FA, chat, review, security models. Added bonus features. Final deliverable checklist. |

---

*End of Software Requirements Specification*
