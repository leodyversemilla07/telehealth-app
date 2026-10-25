# Telehealth App — API

NestJS 12 (Express 5) API for the telehealth platform. Serves as the backend
for `apps/web` and powers authentication, user management, provider/patient
profiles, appointments, video consultations, real-time chat, AI
recommendations, and audit logging.

The HTTP surface is hybrid: domain modules are being migrated onto typed
**tRPC** procedures at `/api/trpc`, while **REST** controllers remain for
auth-adjacent and streaming/third-party modules. Both share the same DI
container, services, and Better Auth session. See
[API Surface](#api-surface) below.

## Tech Stack

| Technology      | Purpose                                        |
| --------------- | ---------------------------------------------- |
| NestJS 12       | Application framework                          |
| Express 5       | HTTP adapter                                   |
| PostgreSQL 16   | Primary database                               |
| Prisma ORM 7    | Database ORM + migrations (`@telehealth/db`)   |
| Better Auth     | Authentication + RBAC + 2FA                    |
| nestjs-trpc     | Typed RPC layer (`@trpc/server` v11)           |
| Zod             | tRPC contracts + environment validation        |
| class-validator | REST request DTO validation                    |
| Redis           | Rate limiting, Socket.IO adapter, domain cache |
| Socket.IO       | Real-time notifications + chat                 |
| LiveKit         | Video consultation rooms                       |
| Resend          | Transactional email                            |
| Jest            | Unit + E2E testing                             |
| Swagger         | API documentation (OpenAPI, non-production)    |

## Getting Started

```bash
# From repo root
pnpm install
pnpm db:reset
pnpm --filter api dev
```

The API runs at **http://localhost:3001** with Swagger docs at
**http://localhost:3001/api/docs** (non-production only).

## Project Structure

```
src/
├── app.controller.ts       # Health check endpoint
├── app.module.ts           # Root module (registers all modules)
├── app.service.ts          # Health check with DB connectivity
├── create-app.ts           # App factory (helmet, filters, uploads gate, Socket.IO)
├── main.ts                 # Bootstrap (loads env, calls create-app + listen)
├── auth/auth.ts            # Better Auth instance wired to Prisma + email
├── admin/                  # Admin user/doctor management, reports
├── appointments/           # Booking lifecycle + hourly reminder cron
├── audit-logs/             # Admin action logs
├── availability/           # Doctor schedule & time-off management
├── chat/                   # Real-time messaging (Socket.IO)
├── common/                 # Cache, filters, interceptors, middleware, utils
├── config/                 # Env validation, Swagger setup, throttler
├── consent/                # Privacy consent tracking
├── doctors/                # Doctor profiles, registration, search
├── documents/              # Private medical document upload & streaming
├── notifications/          # Notification CRUD, preferences, Socket.IO service
├── patients/               # Patient profile CRUD
├── prisma/                 # PrismaService (composition over @telehealth/db)
├── push/                   # Web push notification service
├── recommendations/        # AI doctor recommendation (NVIDIA NIM)
├── records/                # Medical records, prescriptions
├── redis/                  # Throttler storage, Socket.IO adapter, cache backend
├── retention/              # Retention purge + PRC license verification cron
├── reviews/                # Doctor reviews & ratings
├── security-alerts/        # User security notifications
├── storage/                # File storage abstraction (local / S3)
├── trpc/                   # tRPC module, middlewares, generated AppRouter
├── users/                  # Profile, avatar, sessions, account deletion
└── video/                  # LiveKit video room management
```

## API Surface

### tRPC (`/api/trpc`)

Routers live beside their domain as `*.router.ts`; zod contracts in
`*.contracts.ts` are the single source of truth for inputs. Middlewares:
throttle → logging → domain-error (global), plus per-procedure
`AuthMiddleware` / `RolesMiddleware`. The generated client contract is
committed at `src/trpc/generated/server.ts` and regenerated with
`pnpm --filter api trpc:generate` (CI fails on drift).

| Router          | Highlights                                                                        |
| --------------- | --------------------------------------------------------------------------------- |
| `appointments`  | create, findMine/upcoming/history, findOne, updateStatus, cancel, reschedule      |
| `availability`  | set/get schedule, time-off CRUD, public available slots                           |
| `doctors`       | public list/detail, register, myProfile, updateMyProfile                          |
| `documents`     | documents by appointment                                                          |
| `notifications` | list, unreadCount, preferences, markRead/all                                      |
| `patients`      | me, updateMe                                                                      |
| `records`       | create consultation, byAppointment, myRecords/prescriptions, doctor patient views |
| `reviews`       | create, byDoctor, myReviews, hasReviewed                                          |

### REST (`/api/*`)

| Module                   | Description                                                    |
| ------------------------ | -------------------------------------------------------------- |
| `/api/auth/*`            | Authentication via Better Auth (sign-in/up, reset, 2FA, OAuth) |
| `/api/users/*`           | Profile, avatar, sessions, account deletion                    |
| `/api/video/*`           | Join/end LiveKit consultation rooms                            |
| `/api/chat/*`            | Conversations, messages, read state                            |
| `/api/documents/*`       | Upload, list, and stream private medical documents             |
| `/api/recommendations/*` | AI symptom checker + doctor recommendation (patient)           |
| `/api/consent/*`         | Privacy consent records                                        |
| `/api/push/*`            | Web push subscription registration                             |
| `/api/security-alerts/*` | User-facing security alerts                                    |
| `/api/audit-logs/*`      | Admin audit trail                                              |
| `/api/admin/*`           | Admin users/doctors/reports/dashboard                          |

## Environment Variables

The API loads the workspace-root `.env` / `.env.local` (via
`@telehealth/env/load`) as its first import. The full validated schema lives
in `src/config/env.validation.ts`; key variables:

| Variable                         | Required | Default                     | Description                           |
| -------------------------------- | -------- | --------------------------- | ------------------------------------- |
| `DATABASE_URL`                   | Yes      | -                           | PostgreSQL connection string          |
| `PORT`                           | No       | `3001`                      | API server port                       |
| `NODE_ENV`                       | No       | `development`               | Environment                           |
| `BETTER_AUTH_SECRET`             | Yes      | -                           | Auth secret (min 32 chars)            |
| `BETTER_AUTH_URL`                | No       | `http://localhost:3001`     | Public API base URL                   |
| `CORS_ORIGIN`                    | No       | `http://localhost:3000,...` | Allowed CORS origins                  |
| `COOKIE_DOMAIN`                  | Prod     | -                           | Session cookie domain                 |
| `REDIS_URL`                      | No       | -                           | Enables shared limits/cache/Socket.IO |
| `THROTTLE_LIMIT`                 | No       | `30`                        | Requests per 60s window               |
| `RESEND_API_KEY`                 | Prod     | -                           | Email delivery (required in prod)     |
| `EMAIL_FROM`                     | No       | -                           | From address for outbound email       |
| `GOOGLE_CLIENT_ID/SECRET`        | No       | -                           | Enables Google OAuth when both set    |
| `APPLE_CLIENT_ID/SECRET`         | No       | -                           | Enables Apple OAuth when both set     |
| `LIVEKIT_URL/API_KEY/API_SECRET` | No       | -                           | Video consultations (403 when absent) |
| `NIM_API_KEY`                    | No       | -                           | NVIDIA NIM AI recommendations         |
| `VAPID_PUBLIC_KEY/PRIVATE_KEY`   | No       | -                           | Web push                              |
| `AWS_REGION`                     | No       | -                           | S3 region (enables S3 storage)        |
| `AWS_ACCESS_KEY_ID`              | No       | -                           | S3 access key                         |
| `AWS_SECRET_ACCESS_KEY`          | No       | -                           | S3 secret key                         |
| `S3_BUCKET`                      | No       | -                           | S3 bucket name (private objects)      |
| `CANCELLATION_WINDOW_HOURS`      | No       | `24`                        | Patient cancellation notice period    |

## Database

The schema, migrations, seed, and shared PrismaClient live in the
`@telehealth/db` workspace package:
- Schema: `packages/db/prisma/schema.prisma`
- Migrations: `packages/db/prisma/migrations`
- Generated client: `packages/db/generated/prisma` (re-exported via `@telehealth/db`)

21 models: `User`, `Session`, `Account`, `Verification`, `twoFactor`,
`PatientProfile`, `DoctorProfile`, `AvailabilitySchedule`, `TimeOff`,
`Appointment`, `MedicalDocument`, `Consultation`, `Prescription`,
`Notification`, `NotificationPreference`, `PushSubscription`, `ConsentLog`,
`AuditLog`, `SecurityAlert`, `ChatMessage`, `Review`.

```bash
# From repo root
pnpm migrate        # prisma migrate deploy
pnpm db:reset       # reset + seed (dev)
pnpm seed           # seed only
pnpm db:studio      # Prisma Studio

# Or scope to the db package
pnpm --filter @telehealth/db exec prisma migrate dev
pnpm --filter @telehealth/db exec prisma generate
```

## Testing

```bash
pnpm --filter api test        # Unit + service-level specs
pnpm --filter api test:e2e    # HTTP e2e (full AppModule, mocked Prisma)
pnpm --filter api test:e2e:db # Full-stack e2e against real Postgres/Redis
pnpm --filter api test:cov    # Coverage report (gated)
```

## File Storage

- **Development**: local filesystem under `uploads/`. Avatar keys are public;
  every other key is streamed through the authenticated `/uploads/:key`
  handler. The unauthenticated `express.static` fallback is **dev-only**.
- **Production**: private S3 bucket; reads streamed server-side via the API.
- Allowed types: JPEG, PNG, WEBP, PDF (magic-byte validated)
- Max file size: 10 MB

## Notes

- Runs on port **3001** by default (Next.js uses 3000)
- Swagger is only available in non-production environments
- Uses `@prisma/adapter-pg` (PgBouncer-compatible)
- Video requires `LIVEKIT_*`; without them endpoints return
  `403 Video consultation is not configured`
- AI recommendations return `503` when `NIM_API_KEY` is absent
