# Telehealth App

## Tech Stack

| Layer         | Technology                                     |
| ------------- | ---------------------------------------------- |
| **Frontend**  | Next.js 16, React 19, Tailwind CSS v4, Base UI |
| **Backend**   | NestJS 12, Express 5 (tRPC + REST)             |
| **Database**  | PostgreSQL 16 (Prisma ORM)                     |
| **Auth**      | Better Auth (email/password, 2FA, lockout)     |
| **Video**     | LiveKit                                        |
| **Real-time** | Socket.io (WebSocket)                          |
| **Email**     | Resend (email API)                             |
| **Storage**   | Local filesystem (S3-compatible in prod)       |

## Quick Start

### Local Development

```bash
# Install dependencies
pnpm install

# Create the env file from the template at the repo root (DATABASE_URL,
# secrets, etc.). Copy it to .env and fill in real values.
cp .env.example .env

# Setup database (requires PostgreSQL running at DATABASE_URL)
pnpm db:reset

# Start development
pnpm dev
```

- **Web:** http://localhost:3000
- **API:** http://localhost:3001
- **Swagger:** http://localhost:3001/api/docs

> Note: local development runs against the `docker-compose.yml` Postgres on `:5433`.
> Production deployment lives in [`deploy/aws`](./deploy/aws) (EC2 + nginx + pm2 + RDS + S3).

## 📦 Available Scripts

```bash
pnpm dev              # Run all apps
pnpm build            # Build all apps
pnpm lint             # Lint all apps
pnpm typecheck        # Type check all apps
pnpm test             # Run all tests
pnpm db:reset         # Reset database
pnpm db:seed          # Seed database
```

## 📁 Project Structure

### Frontend Pages (~55 pages)

| Route                  | Description                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| `/sign-in`, `/sign-up` | Authentication, password reset, 2FA                                                                 |
| `/patient/*`           | Patient area (20 pages — dashboard, appointments, chat, records, prescriptions, symptoms, settings) |
| `/doctor/*`            | Doctor area (18 pages — dashboard, consultations, chat, patients, records, schedule, settings)      |
| `/admin/*`             | Admin area (13 pages — dashboard, users, doctors, audit-logs, reports, settings)                    |

### API Surface (hybrid tRPC + REST)

The API is migrating domain modules onto typed tRPC procedures at
`/api/trpc` (consumed by the web client via the committed `AppRouter` types);
REST controllers remain for auth-adjacent and streaming/third-party-module
routes. Both share the same DI container, services, and Better Auth session.

**tRPC routers** (`/api/trpc`, zod contracts as the single source of truth):
appointments, availability, doctors, documents, notifications, patients,
records, reviews.

**REST controllers** (`/api/*`):

| Module                   | Description                                    |
| ------------------------ | ---------------------------------------------- |
| `/api/auth/*`            | Authentication (2FA, lockout, verification)    |
| `/api/video/*`           | Video consultation rooms (LiveKit)             |
| `/api/chat/*`            | Real-time messaging                            |
| `/api/documents/*`       | Medical document upload & authorized streaming |
| `/api/recommendations`   | AI symptom-based doctor recommendation         |
| `/api/admin/*`           | Admin operations, audit logs, reports          |
| `/api/users/*`           | Profile, avatar, sessions, account deletion    |
| `/api/consent/*`         | Privacy consent records                        |
| `/api/push/*`            | Web push subscriptions                         |
| `/api/security-alerts/*` | User-facing security alerts                    |
| `/api/audit-logs/*`      | Audit trail                                    |
| `/api/storage/*`         | File upload                                    |

### Database Models (21 models)

- **Auth:** User, Session, Account, Verification, twoFactor
- **Profiles:** PatientProfile, DoctorProfile, AvailabilitySchedule, TimeOff
- **Appointments:** Appointment, Consultation, Prescription, MedicalDocument
- **Communication:** Notification, NotificationPreference, PushSubscription, ChatMessage
- **Security:** ConsentLog, AuditLog, SecurityAlert, Review

## 🔐 Security Features

- ✅ Email verification required
- ✅ Two-factor authentication (TOTP with backup codes)
- ✅ Account lockout (5 failed attempts, configurable)
- ✅ Password complexity validation (min 8, upper, lower, number, special)
- ✅ Session rotation (7-day expiry, rotation every 24h)
- ✅ Rate limiting (20 req/min auth)
- ✅ Audit logging
- ✅ Security alerts (password change, etc.)
- ✅ PRC license verification + auto-reverification daily cron
- ✅ Notification preference controls (per-type toggles)

## Documentation

- [Software Requirements](./docs/SRS.md) — product features and requirements
- [Design System](./docs/DESIGN-SYSTEM.md) — Colors, components

## 🧪 Testing

```bash
# API tests
pnpm --filter api test

# Web tests
pnpm --filter web test

# E2E tests
pnpm --filter api test:e2e
```

## 📄 License

Private — All rights reserved.

## ⚠️ Known Limitations

- **Video consultations:** fully implemented (backend `livekit-server-sdk` + web `@livekit/components-react`); requires `LIVEKIT_URL` / `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` to connect. Without credentials the endpoints return `403 Video consultation is not configured`.
- **Production readiness:** privacy governance, formal regulatory review, and data-residency decisions are deferred to the production-hardening milestone.
- **The MVP has not undergone formal regulatory review.** `pnpm build`, `pnpm typecheck`, `pnpm lint`, and the unit + service-level suites (`pnpm test`) are green; the API's full-AppModule HTTP e2e (`pnpm --filter api test:e2e`) and the web unit suite (`pnpm --filter web test`) also pass. The full-stack e2e suites additionally require a running Postgres (`docker compose up -d`) and the S3 storage suite requires AWS credentials.
