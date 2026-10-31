<div align="center">
  <img src="apps/web/public/logo.png" alt="Telehealth App logo" width="112" />
</div>

<h1 align="center">Telehealth App</h1>

<p align="center">
  Video consultations, appointments, medical records, and care coordination for patients, doctors, and administrators.
</p>

<p align="center">
  <a href="https://github.com/leodyversemilla07/telehealth-app/actions/workflows/ci.yml"><img src="https://github.com/leodyversemilla07/telehealth-app/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI" /></a>
  <a href="https://github.com/leodyversemilla07/telehealth-app/actions/workflows/e2e.yml"><img src="https://github.com/leodyversemilla07/telehealth-app/actions/workflows/e2e.yml/badge.svg?branch=main" alt="E2E" /></a>
  <img src="https://img.shields.io/badge/Node.js-%E2%89%A524-339933?logo=node.js&logoColor=white" alt="Node.js >= 24" />
  <img src="https://img.shields.io/badge/pnpm-12.16.1-F69220?logo=pnpm&logoColor=white" alt="pnpm 12.16.1" />
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white" alt="TypeScript 6" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL 16" />
</p>

> [!NOTE]
> This repository is an MVP built for the WC Launchpad Builder Round. It covers the full patient, doctor, and admin flows, but formal privacy, regulatory, and data-residency review is still required before a production launch.

## Overview

Telehealth App is a full-stack, role-based telehealth platform built for Philippine healthcare delivery. Patients can find licensed doctors, book and attend video consultations, message their care team, and review their records and prescriptions. Doctors manage availability, consultations, clinical notes, and prescriptions. Administrators approve doctor credentials, manage users, and review audit activity.

The monorepo is organized around a typed tRPC/REST API, a Next.js application, and shared packages for authentication, database access, environment loading, UI components, and common schemas.

## Features

### For patients

- Discover doctors by name, specialty, and availability
- Describe symptoms and get AI-assisted doctor recommendations
- Book, reschedule, and cancel appointments in Philippine Time (PHT)
- Join LiveKit video consultations from the appointment
- Chat with doctors in real time
- View consultation history, medical records, and prescriptions
- Receive in-app, web push, and email notifications
- Manage profile, health information, privacy consent, and notification preferences
- Enable TOTP two-factor authentication and review security alerts

### For doctors

- Register with PRC license details and complete a professional profile
- Publish a public profile once approved by an administrator
- Manage weekly availability, slot durations, and time off
- Work through consultation queues and admit patients from the waiting room
- Record consultation notes and issue electronic prescriptions
- View patient consultation history and prior records
- Chat with patients and manage notification preferences

### For administrators

- Dashboard with platform activity and reports
- User management, including account status and role controls
- Doctor approval and PRC license verification
- Audit log review and security alert monitoring
- Daily PRC re-verification and data-retention jobs

### Platform

- Email/password authentication with required email verification
- TOTP two-factor authentication with backup codes
- Account lockout after repeated failed sign-ins
- Role-based access control and server-side route guards
- Rate limiting, CSRF protection, and HTTP-only session cookies
- Real-time notifications and chat over Socket.IO
- Private medical document upload with local or S3-backed storage
- Light and dark themes built on a shared design system

## Tech stack

| Area         | Technology                                                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Frontend     | Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4, Base UI, TanStack Query, Socket.IO client, LiveKit Components |
| Backend      | NestJS 12, Express 5, tRPC 11, Zod, class-validator, Pino, Socket.IO                                                         |
| Data         | PostgreSQL 16, Prisma 7 with `@prisma/adapter-pg`, Redis (optional for shared rate limits, cache, and Socket.IO rooms)       |
| Auth         | Better Auth 1.7 — email/password, email verification, TOTP 2FA, account lockout, RBAC                                        |
| Integrations | LiveKit (video), Resend (email), NVIDIA NIM (AI recommendations), S3-compatible storage, Web Push (VAPID)                    |
| Tooling      | pnpm 12.16.1, Turborepo 2.11, Biome 2, TypeScript 6, Jest 30, Vitest 5, Playwright 1.64                                      |

## Architecture

```mermaid
flowchart LR
  Web["Next.js web<br/>apps/web"] -->|"tRPC + REST"| API["NestJS API<br/>apps/api"]
  API --> DB[("PostgreSQL 16")]
  API --> Redis[("Redis<br/>optional")]
  API --> LiveKit["LiveKit"]
  API --> Resend["Resend"]
  API --> NIM["NVIDIA NIM"]
  API --> Storage["Local uploads / S3"]
  API -->|"Socket.IO"| Web
```

The HTTP surface is intentionally hybrid:
- **tRPC** at `/api/trpc` for domain modules with shared Zod contracts and end-to-end types.
- **REST** at `/api/*` for authentication, video, chat, uploads, push, admin operations, and other streaming or third-party modules.

Both layers share the same NestJS DI container, services, and Better Auth session. The generated tRPC contract is committed and checked in CI to prevent client/server drift.

## Monorepo layout

```text
telehealth-app/
├── apps/
│   ├── api/                 # NestJS API — tRPC routers, REST controllers, jobs, integrations
│   └── web/                 # Next.js app — patient, doctor, and admin portals
├── packages/
│   ├── auth/                # Better Auth server/client config, password and lockout utilities
│   ├── db/                  # Prisma schema, migrations, seed, shared PrismaClient
│   ├── env/                 # Root .env loader and validation
│   ├── shared/              # Shared Zod schemas, types, and utilities
│   ├── typescript-config/   # Shared TypeScript configuration
│   └── ui/                  # Base UI + Tailwind component library
├── docs/                    # Software requirements and design system
├── .github/workflows/       # CI, E2E, and Dependabot auto-merge
├── turbo.json
└── pnpm-workspace.yaml
```

## Getting started

### Prerequisites

- **Node.js 24 or newer**
- **pnpm 12.16.1** (`corepack enable` is the simplest way to get the pinned version)
- **PostgreSQL 16** running locally or reachable over the network
- Optional: Redis, a LiveKit project, a Resend account and verified sender domain, an NVIDIA NIM API key, and an S3-compatible bucket

### 1. Install dependencies

```bash
git clone https://github.com/leodyversemilla07/telehealth-app.git
cd telehealth-app
corepack enable
pnpm install
```

### 2. Configure the environment

The workspace uses a **single root `.env`**; there are no per-app environment files. `.env.local` is merged on top of `.env` and takes precedence.

```bash
cp .env.example .env
```

Set at minimum:

```dotenv
DATABASE_URL="postgresql://user:password@localhost:5432/telehealth?schema=public"
BETTER_AUTH_SECRET="<at least 32 characters>"
BETTER_AUTH_URL="http://localhost:3001"
CORS_ORIGIN="http://localhost:3000,http://localhost:3001"
API_URL="http://localhost:3001"
```

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

> [!IMPORTANT]
> `RESEND_API_KEY` is optional for booting the API, but email verification and password reset depend on it. Without a working Resend key, those emails fail and users cannot complete verification. LiveKit and NVIDIA NIM are also optional: video endpoints return `403` and AI recommendations return `503` until their credentials are configured.

### 3. Set up the database

```bash
pnpm db:reset   # migrate, reset, and seed
```

Or run the steps separately:

```bash
pnpm migrate    # prisma migrate deploy
pnpm seed       # seed demo data
```

The seed script creates demo admin, doctor, and patient accounts. See `packages/db/prisma/seed.ts` for the credentials and seeded profiles.

### 4. Start developing

```bash
pnpm dev
```

| Service                  | URL                            |
| ------------------------ | ------------------------------ |
| Web app                  | http://localhost:3000          |
| API                      | http://localhost:3001          |
| Swagger (non-production) | http://localhost:3001/api/docs |

The web app proxies `/api/*` to `API_URL`, so browser requests stay same-origin by default.

## Environment variables

The full validated schema lives in `apps/api/src/config/env.validation.ts`. The most important variables are:

| Variable                                                                   | Required   | Purpose                                                                         |
| -------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                             | Yes        | PostgreSQL connection string                                                    |
| `BETTER_AUTH_SECRET`                                                       | Yes        | Auth signing secret, minimum 32 characters                                      |
| `BETTER_AUTH_URL`                                                          | No         | Public API base URL, defaults to `http://localhost:3001`                        |
| `CORS_ORIGIN`                                                              | No         | Comma-separated allowed origins                                                 |
| `API_URL`                                                                  | No         | API origin used by Next.js rewrites and server-side session checks              |
| `WEB_URL`                                                                  | No         | Web origin used by Playwright and cross-origin links                            |
| `NEXT_PUBLIC_API_URL`                                                      | No         | Client-side API URL; leave empty for same-origin rewrites                       |
| `RESEND_API_KEY`                                                           | Production | Resend key for verification, reset, and notification emails                     |
| `EMAIL_FROM`                                                               | No         | Verified sender address for outbound email                                      |
| `REDIS_URL`                                                                | No         | Shared rate limits, cache, and Socket.IO adapter for multi-instance deployments |
| `LIVEKIT_URL` / `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET`                   | No         | Enables video consultations                                                     |
| `NIM_API_KEY`                                                              | No         | Enables AI symptom analysis and doctor recommendations                          |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`                                   | No         | Web push notifications                                                          |
| `AWS_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `S3_BUCKET` | No         | Switches uploads from local disk to private S3 storage                          |
| `SESSION_EXPIRY_SECONDS`                                                   | No         | Session lifetime, defaults to 7 days                                            |
| `CANCELLATION_WINDOW_HOURS`                                                | No         | Minimum patient cancellation notice, defaults to 24                             |
| `THROTTLE_LIMIT`                                                           | No         | API requests per 60-second window, defaults to 30                               |
| `COOKIE_DOMAIN`                                                            | Production | Cookie domain for cross-subdomain sessions                                      |

Data-retention windows for notifications, security alerts, and audit logs can also be overridden with the `RETENTION_*_DAYS` variables documented in `.env.example`.

## Available scripts

Run these from the repository root.

| Command                      | Description                                |
| ---------------------------- | ------------------------------------------ |
| `pnpm dev`                   | Start all apps in watch mode via Turborepo |
| `pnpm build`                 | Build every workspace package and app      |
| `pnpm start`                 | Start the built API                        |
| `pnpm lint`                  | Run Biome lint across the workspace        |
| `pnpm format`                | Format and fix with Biome                  |
| `pnpm format:check`          | Check formatting without writing           |
| `pnpm typecheck`             | Type-check all workspaces                  |
| `pnpm test`                  | Run all unit tests                         |
| `pnpm test:api`              | Run API unit tests                         |
| `pnpm test:web`              | Run web unit tests                         |
| `pnpm test:e2e`              | Run the web Playwright suite               |
| `pnpm migrate`               | Apply Prisma migrations                    |
| `pnpm db:reset`              | Reset the database and seed it             |
| `pnpm db:seed` / `pnpm seed` | Seed demo data                             |
| `pnpm db:studio`             | Open Prisma Studio                         |

Scoped commands are also available, for example `pnpm --filter api test:e2e` and `pnpm --filter web test:cov`.

## API surface

### tRPC routers

Routers live beside their domain as `*.router.ts`, with Zod contracts in `*.contracts.ts`. Middleware handles throttling, logging, authentication, and role checks. Regenerate the committed client contract with `pnpm --filter api trpc:generate` after changing a router.

| Router          | Highlights                                                        |
| --------------- | ----------------------------------------------------------------- |
| `appointments`  | Create, list, upcoming/history, update status, cancel, reschedule |
| `availability`  | Weekly schedule, time off, public available slots                 |
| `doctors`       | Public list and detail, registration, own profile                 |
| `documents`     | Documents scoped to an appointment                                |
| `notifications` | List, unread count, preferences, mark read                        |
| `patients`      | Current patient profile                                           |
| `records`       | Consultations, records, prescriptions, doctor and patient views   |
| `reviews`       | Create, list by doctor, own reviews                               |

### REST modules

| Module                   | Description                                                   |
| ------------------------ | ------------------------------------------------------------- |
| `/api/auth/*`            | Better Auth sign-in, sign-up, verification, reset, 2FA, OAuth |
| `/api/users/*`           | Profile, avatar, sessions, account deletion                   |
| `/api/video/*`           | LiveKit consultation rooms and tokens                         |
| `/api/chat/*`            | Conversations, messages, read state                           |
| `/api/documents/*`       | Private upload, listing, and authorized streaming             |
| `/api/recommendations/*` | AI symptom analysis and doctor recommendations                |
| `/api/consent/*`         | Privacy consent records                                       |
| `/api/push/*`            | Web push subscription registration                            |
| `/api/security-alerts/*` | User-facing security alerts                                   |
| `/api/audit-logs/*`      | Audit trail                                                   |
| `/api/admin/*`           | User, doctor, report, and dashboard operations                |
| `/api/storage/*`         | File upload                                                   |

API errors use a consistent shape: `{ error, code, details? }`.

## Database

The Prisma schema, migrations, seed, and shared client live in `packages/db`:
- Schema: `packages/db/prisma/schema.prisma`
- Migrations: `packages/db/prisma/migrations`
- Generated client: `packages/db/generated/prisma`, re-exported through `@telehealth/db`

Create a new migration after editing the schema:

```bash
pnpm --filter @telehealth/db exec prisma migrate dev --name <migration-name>
```

There are 21 models across five areas:
- **Auth:** `User`, `Session`, `Account`, `Verification`, `twoFactor`
- **Profiles:** `PatientProfile`, `DoctorProfile`, `AvailabilitySchedule`, `TimeOff`
- **Care:** `Appointment`, `Consultation`, `Prescription`, `MedicalDocument`
- **Communication:** `Notification`, `NotificationPreference`, `PushSubscription`, `ChatMessage`
- **Security and quality:** `ConsentLog`, `AuditLog`, `SecurityAlert`, `Review`

## Security

- Email verification is required before sign-in
- TOTP two-factor authentication with backup codes
- Account lockout after five failed sign-in attempts
- Password complexity checks: 8–128 characters with upper, lower, number, and special characters
- Seven-day sessions with 24-hour rotation, HTTP-only cookies, `SameSite=Lax`, and secure cookies in production
- Rate limiting on API and authentication routes
- Role-based access control plus Next.js server-side route guards
- Audit logs for sensitive actions, consent logs at registration, and security alert emails
- PRC license verification with a daily re-verification job
- Scheduled retention purges for notifications, security alerts, and audit logs
- Upload validation by magic bytes, allowed types, and a 10 MB size limit

## Testing and CI

```bash
pnpm test                          # all unit tests
pnpm --filter api test:e2e         # API HTTP e2e with a mocked Prisma client
pnpm --filter api test:e2e:db      # API e2e against real Postgres and Redis
pnpm --filter web test:e2e         # Playwright end-to-end suite
pnpm --filter api test:cov         # API coverage gate
pnpm --filter web test:cov         # web coverage gate
```

The `ci` workflow runs a frozen install, lockfile drift check, format check, lint, typecheck, unit tests, coverage gates, API e2e suites, tRPC contract drift check, and a full build. The `e2e` workflow boots the app against PostgreSQL and Redis and runs the Playwright suite. Dependabot opens weekly npm minor/patch updates and monthly GitHub Actions updates, with auto-merge configured for eligible npm updates.

## Production notes

> [!WARNING]
> This MVP has not undergone formal regulatory, privacy, or security review. Do not use it with real patient data until those reviews, data-residency decisions, and production hardening are complete.
- Video requires `LIVEKIT_*`; without it the video endpoints return `403 Video consultation is not configured`.
- AI recommendations require `NIM_API_KEY`; without it the endpoint returns `503`.
- Local file storage is the default in development. Set the `AWS_*` and `S3_BUCKET` variables to use private S3 storage.
- Redis is optional for a single API instance. Configure `REDIS_URL` before running multiple instances so rate limits and Socket.IO rooms are shared.
- Swagger is only served outside production.
- The repository does not include deployment manifests. The web app and API can be deployed independently, provided PostgreSQL, the root environment variables, and any optional integrations are available.

## Documentation

- [Software Requirements Specification](docs/SRS.md) — product scope, functional and non-functional requirements, data model, and API route map
- [Design System](docs/DESIGN-SYSTEM.md) — color tokens, semantic status colors, and component usage
- [API README](apps/api/README.md) — backend architecture, modules, environment details, and testing
- [Web README](apps/web/README.md) — frontend routes, features, and data fetching
