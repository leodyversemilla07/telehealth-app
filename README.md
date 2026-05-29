# Telehealth App

A telehealth platform connecting patients with licensed Philippine healthcare providers through video consultations, secure messaging, electronic prescriptions, and integrated health record management.

Built with a **monorepo architecture** using Turborepo + pnpm workspaces.

## Architecture

```
telehealth-app/
├── apps/
│   ├── api/          # NestJS 11 REST API (port 3001)
│   └── web/          # Next.js 16 frontend (port 3000)
├── packages/
│   ├── shared/       # Shared Zod schemas & TypeScript types
│   ├── ui/           # shadcn/ui component library + Tailwind CSS v4
│   └── typescript-config/ # Shared TypeScript configurations
├── docs/
│   └── SRS.md        # Software Requirements Specification
└── scripts/
    └── deploy.sh     # AWS Elastic Beanstalk packaging
```

## Technology Stack

| Layer       | Technology                                                    |
| ----------- | ------------------------------------------------------------- |
| Frontend    | Next.js 16 + React 19 + Tailwind CSS v4 + shadcn/ui              |
| Backend     | NestJS 11 + Express                                               |
| Database    | PostgreSQL 16 (via Prisma ORM + `@prisma/adapter-pg`)            |
| Auth        | Better Auth (email/password, 2FA, account lockout)               |
| Video       | LiveKit (self-hosted on AWS EC2)                                  |
| AI          | NVIDIA NIM (Nemotron-3-Super-120B / Qwen3.5-122B)                |
| Notifications| WebSocket via Socket.io (NestJS Gateway)                         |
| Storage     | AWS S3                                                            |
| Validation  | Zod (shared) + class-validator (API)                              |
| API Client  | TanStack React Query v5                                           |
| Icons       | Lucide React                                                      |
| Linting     | Biome (linter + formatter)                                        |
| Monorepo    | Turborepo + pnpm workspaces                                       |
| Deployment  | Docker / AWS Elastic Beanstalk                                    |

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 11 (install: `npm i -g corepack && corepack enable`)
- **Docker Desktop** (for local PostgreSQL)

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL
docker compose up -d postgres

# 3. Apply database migrations
pnpm db:reset

# 4. Start development (both API + Web)
pnpm dev
```

- **Web app**: http://localhost:3000
- **API**: http://localhost:3001
- **API docs (Swagger)**: http://localhost:3001/api/docs

## Seeded Users

| Email                  | Password          | Role     |
| ---------------------- | ----------------- | -------- |
| admin@example.com      | Set via sign-up   | ADMIN    |
| doctor@example.com     | Set via sign-up   | DOCTOR   |
| alice@example.com      | Set via sign-up   | PATIENT  |
| bob@example.com        | Set via sign-up   | PATIENT  |

Passwords are set through the Better Auth sign-up flow. Use the **Forgot Password** flow to set initial passwords for seeded users.

## Workspace Commands

### Development

```bash
pnpm dev              # Run all apps in parallel (Turbo)
pnpm --filter web dev  # Web only (Next.js with Turbopack)
pnpm --filter api dev  # API only (NestJS watch mode)
```

### Build

```bash
pnpm build             # Build all packages and apps
pnpm --filter web build
pnpm --filter api build
```

### Database

```bash
pnpm db:start          # Start PostgreSQL via Docker
pnpm db:stop           # Stop PostgreSQL
pnpm db:reset          # Reset DB + apply migrations + seed
pnpm seed              # Run seed script only
pnpm migrate           # Apply pending migrations
```

### Quality

```bash
pnpm typecheck         # TypeScript check all packages
pnpm lint              # Biome lint all packages
pnpm format            # Biome format + fix
pnpm format:check      # Biome format check only
```

### Testing

```bash
pnpm --filter api test  # API unit tests (Jest)
pnpm --filter web test  # Web tests (Vitest)
```

## Package Details

### `@workspace/ui` (`packages/ui`)
- shadcn/ui components with `base-nova` style
- Tailwind CSS v4 with OKLCH color tokens
- Available components: Badge, Button, Card, Dialog, Input, Label, Select, Separator, Sonner, DatePicker, DateRangePicker, DateTimePicker, Empty, Spinner, NavigationMenu, Item, Field
- [Components JSON](./apps/web/components.json) for shadcn CLI

### `@workspace/shared` (`packages/shared`)
- Zod validation schemas (`signInSchema`, `signUpSchema`, `userSchema`, etc.)
- Shared TypeScript types (`UserDto`, `ProviderProfileDto`, etc.)
- Exported via subpath exports: `@workspace/shared/schemas/*`, `@workspace/shared/types/*`

## Key Features

### 👤 Patient Module
- **Account Creation** — Email/password registration with email verification
- **Profile Management** — Name, birthday, weight, height, photo, contact details, medical history
- **Doctor Discovery** — Browse doctors, filter by specialization, search by name
- **AI Symptom Checker** — Describe symptoms → AI recommends specialists (NVIDIA NIM)
- **Appointment Booking** — Book, reschedule, cancel consultations with real-time availability
- **Video Consultations** — Join LiveKit-powered video calls directly in browser
- **Medical Records** — View consultation history, prescriptions, and doctor notes
- **In-app Chat** — Real-time secure messaging with doctors

### 🩺 Doctor Module
- **Registration** — Email/password with PRC license submission
- **Profile Management** — Bio, specialty, credentials, clinic address, pricing
- **Schedule Management** — Weekly availability, time-off blocks, slot duration
- **Consultations** — Video calls, notes, diagnosis, treatment plans
- **Prescriptions** — eRx with medication name, dosage, frequency, duration
- **Patient Records** — Access consultation history and records
- **In-app Chat** — Real-time messaging with patients

### 🔒 Auth & Security
- **Better Auth** — Email/password with email verification
- **2FA** — TOTP via authenticator apps (Google Authenticator, Authy) with backup codes
- **Account Lockout** — Auto-lock after 5 failed login attempts
- **Password Policy** — Min 8 chars, complexity validation
- **Session Rotation** — 7-day expiry, refreshed every 24h, fresh token every 5min
- **Rate Limiting** — 30 requests/60s API-wide, 20 auth requests/min
- **RBAC** — Three roles: `PATIENT`, `DOCTOR`, `ADMIN`
- **Security Alerts** — Password changes trigger email + in-app alert
- **Audit Logging** — All auth events (login, logout, failed attempts) immutably logged

### ⭐ Bonus Features
- **Doctor Reviews & Ratings** — 1-5 star ratings with comments post-consultation
- **AI Symptom Checker** — NVIDIA NIM-powered analysis with condition assessment
- **Design System** — Custom telehealth-themed oklch color palette
- **Theme Toggle** — Light/dark mode across all roles
- **Admin Dashboard** — User management, doctor approval, audit logs, reports, security alerts

## API Routes

### Authentication (`/api/auth`)
- Sign in / Sign up (email + password)
- Email verification / Password reset
- Forgot password / Change password
- 2FA enable/disable/verify/backup-codes

### Doctors (`/api/doctors`)
- `GET /api/doctors` — List/search approved doctors (filter by specialty, name, sort by price)
- `GET /api/doctors/:id` — Doctor profile with average rating
- `POST /api/doctors/register` — Register as doctor
- `POST /api/recommendations` — AI symptom → doctor recommendation

### Availability (`/api/availability`)
- `GET /api/availability/:doctorId` — Weekly schedule
- `GET /api/availability/:doctorId/slots?date=` — Available time slots
- `PUT /api/availability` — Set weekly schedule (Doctor)
- `POST /api/availability/time-off` — Block unavailable time (Doctor)

### Appointments (`/api/appointments`)
- `POST /api/appointments` — Book appointment (Patient)
- `GET /api/appointments` — My appointments list
- `GET /api/appointments/:id` — Appointment detail
- `PATCH /api/appointments/:id/status` — Update status (Doctor/Admin)
- `PATCH /api/appointments/:id/cancel` — Cancel
- `PATCH /api/appointments/:id/reschedule` — Reschedule (Patient)

### Medical Records (`/api/records`)
- `GET /api/records/consultations` — My consultations
- `POST /api/records/consultations` — Create consultation notes (Doctor)
- `POST /api/records/consultations/:id/prescriptions` — Add prescription (Doctor)
- `GET /api/records/prescriptions` — My prescriptions (Patient)

### Video Consultation (`/api/video`)
- `POST /api/video/rooms` — Create room
- `POST /api/video/rooms/:roomName/join` — Join with token
- `PATCH /api/video/rooms/:roomName/end` — End call

### Chat (`/api/chat`)
- `GET /api/chat/conversations` — List conversations
- `GET /api/chat/messages/:userId` — Get messages
- `POST /api/chat/messages` — Send message
- `POST /api/chat/messages/:userId/read` — Mark as read

### Notifications (`/api/notifications`)
- `GET /api/notifications` — List notifications
- `PATCH /api/notifications/:id/read` — Mark read
- `PATCH /api/notifications/read-all` — Mark all read

### Admin (`/api/admin`)
- `GET /api/admin/users` — List all users
- `PATCH /api/admin/doctors/:id/approve` — Approve doctor
- `PATCH /api/admin/doctors/:id/reject` — Reject doctor
- `GET /api/admin/audit-logs` — Audit trail
- `GET /api/admin/security-alerts` — Security alerts
- `GET /api/admin/reports` — Platform analytics

## Documentation

- **SRS**: [docs/SRS.md](./docs/SRS.md) — Full Software Requirements Specification covering Philippine regulatory compliance (RA 10173, DOH AO 2021-0037, PRC, PDEA, PhilHealth)
- **Design System**: [docs/DESIGN-SYSTEM.md](./docs/DESIGN-SYSTEM.md) — Telehealth-themed design system with oklch color tokens
- **Deployment**: [AWS.md](./AWS.md) — AWS Elastic Beanstalk deployment guide

## Deployment

### Docker (local/production)

```bash
docker compose up -d
```

Spins up PostgreSQL, API (port 3001), and Web (port 3000).

### AWS Elastic Beanstalk

See [AWS.md](./AWS.md) for detailed deployment guide using Elastic Beanstalk (Node.js platform) without Docker.

```bash
./scripts/deploy.sh all
```

## Notes

- The `@workspace/ui` package is transpiled by Next.js via `transpilePackages` in `next.config.mjs`
- Prisma client is generated under `apps/api/generated/prisma/` (gitignored)
- The project targets the Philippine healthcare market — all times are PHT (UTC+8), prices in PHP