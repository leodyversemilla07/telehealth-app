# Telehealth App — Web Frontend

A modern, highly interactive, and responsive web frontend built with **Next.js 16**, **React 19**, **Tailwind CSS v4**, and **shadcn/ui**. Serves as the user portal for patients, healthcare providers (doctors), and platform administrators.

---

## Technical Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 + React 19 | Server Component Architecture & Client Routing |
| **Style & Layout** | Tailwind CSS v4 + shadcn/ui | Beautiful, responsive, and glassmorphic UI |
| **Icons** | Lucide React | Clean, scalable vector outline icons |
| **Data Fetching** | TanStack React Query v5 | Highly optimized query caching & mutations |
| **Real-time Gateway**| Socket.io-client | Live push notifications for appointment updates |
| **Authentication** | Better Auth Client SDK | Secure cookie sessions, 2FA registration, OAuth |
| **Testing** | Vitest + JSDOM | Component and hook unit tests |

---

## Directory & Route Architecture

The project utilizes Next.js App Router conventions within `apps/web/app/`:

```
apps/web/
├── app/
│   ├── (auth)/             # Login, signup, OAuth, and 2FA setup flows
│   ├── patient/            # Patient Portal
│   │   ├── dashboard/      # Patient dashboard (quick actions, appointments, records)
│   │   ├── appointments/   # Booking calendars, discovery, and cancel/reschedule
│   │   └── records/        # Diagnostic consultation details & prescriptions
│   ├── doctor/             # Doctor Portal
│   │   ├── dashboard/      # Clinic queues, patient lists, and daily schedule
│   │   ├── availability/   # Slot configuration, weekly scheduling, & time-off blocks
│   │   └── records/        # Patient EHR consultation history access
│   ├── admin/              # Admin Portal (Audit logs, role edits, PRC verifications)
│   ├── settings/           # Profile settings, 2FA status, and active sessions
│   ├── layout.tsx          # Root theme providers and global layouts
│   └── page.tsx            # Main Landing / Discovery page
├── components/             # Reusable UI component modules
├── hooks/                  # Custom React hooks (usePatient, useRecords, useAuth)
├── lib/                    # Library configurations (api-client, utils)
└── public/                 # Static asset resources
```

---

## Core Implementations & Mechanics

### 🌟 Discovery & Doctor Reviews
On the landing page and search layouts, the doctor cards render:
- **Aggregated Ratings**: Displays average review stars (e.g. `4.5 ★`) computed dynamically from patient submissions.
- **Total Reviews Counter**: Shows review volume (e.g. `(48 reviews)`) to reinforce provider trust signals.

---

## Data Fetching & Caching Patterns

The web client standardizes on **TanStack React Query** with a unified API client setup. Custom hooks encapsulate queries and automatically invalidate keys on success:

```typescript
// Example custom hook: apps/web/hooks/use-patient.ts
export function useUpdatePatientProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdatePatientProfileDto) => apiClient.patch("/patients/me", data),
    onSuccess: () => {
      // Invalidate query to trigger re-renders & redraw the SVG curves with new nodes!
      qc.invalidateQueries({ queryKey: ["patient", "profile"] })
    },
  })
}
```

---

## Getting Started Locally

```bash
# 1. Start NestJS backend first
# 2. From workspace root run:
pnpm --filter web dev
```

The server launches in development mode with Turbopack at **http://localhost:3000**.
