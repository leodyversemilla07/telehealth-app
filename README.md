# Telehealth App

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS v4, Base UI |
| **Backend** | NestJS 11, Express |
| **Database** | PostgreSQL 16 (Prisma ORM) |
| **Auth** | Better Auth (email/password, 2FA, lockout) |
| **Video** | LiveKit |
| **Real-time** | Socket.io (WebSocket) |
| **Email** | Nodemailer (local SMTP/Mailhog) |
| **Storage** | Local filesystem (S3-compatible in prod) |

## Quick Start

### Local Development

```bash
# Install dependencies
pnpm install

# Create env files from the templates (DATABASE_URL, secrets, etc.)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Start PostgreSQL (see docker-compose.yml)
docker compose up -d postgres

# Setup database
pnpm db:reset

# Start development
pnpm dev
```

- **Web:** http://localhost:3000
- **API:** http://localhost:3001
- **Swagger:** http://localhost:3001/api/docs

> Note: This project is currently configured for local development only. Deployment scripts and hosting configs have been removed.

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

| Route | Description |
|-------|-------------|
| `/sign-in`, `/sign-up` | Authentication, password reset, 2FA |
| `/patient/*` | Patient area (20 pages — dashboard, appointments, chat, records, prescriptions, symptoms, settings) |
| `/doctor/*` | Doctor area (18 pages — dashboard, consultations, chat, patients, records, schedule, settings) |
| `/admin/*` | Admin area (13 pages — dashboard, users, doctors, audit-logs, reports, settings) |

### API Endpoints (17 modules)

| Module | Description |
|--------|-------------|
| `/api/auth/*` | Authentication (2FA, lockout, verification) |
| `/api/doctors/*` | Doctor profiles & search |
| `/api/appointments/*` | Book, reschedule, cancel appointments |
| `/api/records/*` | Medical records, consultation notes, prescriptions |
| `/api/video/*` | Video consultation rooms (LiveKit) |
| `/api/chat/*` | Real-time messaging |
| `/api/notifications/*` | Notifications + preferences |
| `/api/reviews/*` | Doctor reviews & ratings |
| `/api/recommendations` | AI symptom-based doctor recommendation |
| `/api/availability/*` | Doctor schedules & time-off |
| `/api/admin/*` | Admin operations, audit logs, reports |
| `/api/storage/*` | File upload |

### Database Models (19 models)

- **Core:** User, Session, Account, Verification
- **Profiles:** PatientProfile, DoctorProfile, AvailabilitySchedule, TimeOff
- **Appointments:** Appointment, Consultation, Prescription
- **Communication:** Notification, NotificationPreference, PushSubscription, ChatMessage
- **Security:** ConsentLog, AuditLog, SecurityAlert, Review

## 🔐 Security Features

- ✅ Email verification required
- ✅ Two-factor authentication (TOTP with backup codes)
- ✅ Account lockout (5 failed attempts, configurable)
- ✅ Password complexity validation (min 8, upper, lower, number, special)
- ✅ Session rotation (7-day expiry, rotation every 24h)
- ✅ Rate limiting (20 req/min auth)
- ✅ Audit logging (NPC compliance)
- ✅ Security alerts (password change, etc.)
- ✅ PRC license verification + auto-reverification daily cron
- ✅ Notification preference controls (per-type toggles)

## Documentation

- [Software Requirements](./docs/SRS.md) — NPC compliance, features
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
- **Production compliance:** registering as a Personal Information Controller (PIC) and storing data in the Philippines (or equivalent jurisdiction) are deferred to the production-hardening milestone.
- **All SRS requirements** are implemented; `pnpm build`, `pnpm typecheck`, `pnpm lint`, and `pnpm test` all pass (199 tests, 25 suites).
