# Telehealth App — Web Frontend

A modern, highly interactive, and responsive web frontend built with **Next.js 16**, **React 19**, **Tailwind CSS v4**, and **Base UI**. Serves as the user portal for patients, healthcare providers (doctors), and platform administrators.

## Technical Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 + React 19 | Server Component Architecture & Client Routing |
| **Style & Layout** | Tailwind CSS v4 + Base UI | Responsive, themed UI with light/dark mode |
| **Icons** | Lucide React | Clean, scalable vector outline icons |
| **Data Fetching** | TanStack React Query v5 | Optimized query caching & mutations |
| **Real-time Gateway**| Socket.io-client | Live push notifications, chat messages |
| **Video** | @livekit/components-react | Video consultation rooms |
| **Authentication** | Better Auth Client SDK | Secure cookie sessions, 2FA, OAuth |
| **Testing** | Vitest + JSDOM | Component and hook unit tests |

---

## Directory & Route Architecture

```
apps/web/
├── app/
│   ├── (auth)/             # Sign-in, sign-up, password reset, 2FA setup
│   ├── patient/            # Patient Portal (20 pages)
│   │   ├── dashboard/      # Patient dashboard, quick actions
│   │   ├── appointments/   # Book, view, cancel/reschedule appointments
│   │   ├── chat/           # Real-time messaging with doctors
│   │   ├── prescriptions/  # View prescriptions
│   │   ├── records/        # Medical records & consultation history
│   │   ├── symptoms/       # AI symptom checker
│   │   └── settings/       # Profile, health, privacy, notifications, 2FA, alerts
│   ├── doctor/             # Doctor Portal (18 pages)
│   │   ├── dashboard/      # Clinic queues, daily schedule
│   │   ├── consultations/  # Join/manage video consultations
│   │   ├── chat/           # Messaging with patients
│   │   ├── patients/       # Patient list & records
│   │   ├── records/        # Patient EHR access
│   │   ├── schedule/       # Slot configuration, time-off
│   │   ├── register/       # Doctor registration
│   │   └── settings/       # Profile, professional, notifications, 2FA, alerts
│   ├── admin/              # Admin Portal (13 pages)
│   │   ├── dashboard/      # Platform overview
│   │   ├── users/          # User management
│   │   ├── doctors/        # Doctor approval (PRC verification)
│   │   ├── audit-logs/     # Compliance audit trail
│   │   ├── reports/        # Platform analytics
│   │   └── settings/       # Profile, notifications, 2FA, alerts
│   ├── layout.tsx          # Root theme providers and global layouts
│   └── page.tsx            # Landing / Doctor discovery page
├── components/             # Reusable UI components
├── hooks/                  # Custom React hooks
├── lib/                    # API client, utilities
└── public/                 # Static assets
```

---

## Core Features

### Video Consultations
- LiveKit-powered video rooms with mute/unmute, camera toggle, end call
- Waiting room overlay — patient waits until doctor admits
- Post-visit redirect — doctor to consultations, patient to appointments
- Call metadata recording (duration, participants)

### Real-time Notifications
- Socket.io WebSocket gateway for instant push
- Per-type notification preferences (in-app, push, email)
- All roles can configure toggles in settings

### Doctor Discovery & AI Recommendations
- Browse doctors by specialty, search, and sort
- Aggregated ratings and review counts
- NVIDIA NIM-powered symptom-based doctor recommendations

### In-app Chat
- Secure real-time messaging between patient and doctor
- Appointment-scoped conversations
- Read/unread status tracking

### Multi-role Settings
- Each role has dedicated settings: profile, password, 2FA, sessions, appearance (theme), alerts, notifications
- Patient-specific: health info, privacy
- Doctor-specific: professional info

---

## Data Fetching & Caching

Standardized on **TanStack React Query** with a unified API client. Custom hooks encapsulate queries and auto-invalidate on mutations.

---

## Getting Started Locally

```bash
# 1. Start NestJS backend first
# 2. From workspace root run:
pnpm --filter web dev
```

The server launches in development mode with Turbopack at **http://localhost:3000**.
