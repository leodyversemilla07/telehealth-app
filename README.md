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

### Frontend Pages (53 pages)

| Route | Description |
|-------|-------------|
| `/sign-in`, `/sign-up` | Authentication |
| `/patient/*` | Patient area (19 pages) |
| `/doctor/*` | Doctor area (17 pages) |
| `/admin/*` | Admin area (12 pages) |

### API Endpoints (21 modules)

| Module | Description |
|--------|-------------|
| `/api/auth/*` | Authentication (2FA, lockout, verification) |
| `/api/doctors/*` | Doctor profiles & search |
| `/api/appointments/*` | Book & manage appointments |
| `/api/records/*` | Medical records & prescriptions |
| `/api/video/*` | Video consultation rooms |
| `/api/chat/*` | Real-time messaging |
| `/api/admin/*` | Admin operations |

### Database Models (18 models)

- **Core:** User, Session, Account, Verification
- **Profiles:** PatientProfile, DoctorProfile, AvailabilitySchedule, TimeOff
- **Appointments:** Appointment, Consultation, Prescription
- **Communication:** Notification, PushSubscription, ChatMessage
- **Security:** ConsentLog, AuditLog, SecurityAlert, Review

## 🔐 Security Features

- ✅ Email verification required
- ✅ Two-factor authentication (TOTP)
- ✅ Account lockout (5 failed attempts)
- ✅ Password complexity validation
- ✅ Session rotation (7-day expiry)
- ✅ Rate limiting (20 req/min auth)
- ✅ Audit logging (NPC compliance)
- ✅ Security alerts

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
- **Everything else** in the SRS scope is implemented; `pnpm build`, `pnpm typecheck`, `pnpm lint`, and `pnpm test` all pass.
