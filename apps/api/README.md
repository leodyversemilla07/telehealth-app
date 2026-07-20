# Telehealth App — API

NestJS 11 REST API for the telehealth platform. Serves as the backend for `apps/web` and powers authentication, user management, provider/patient profiles, video consultations, real-time chat, and audit logging.

## Tech Stack

| Technology        | Purpose                               |
| ----------------- | ------------------------------------- |
| NestJS 11         | Application framework                 |
| PostgreSQL 16     | Primary database                      |
| Prisma ORM 7      | Database ORM + migrations             |
| Better Auth       | Authentication + RBAC + 2FA           |
| Zod               | Environment variable validation       |
| class-validator   | Request DTO validation                |
| Jest              | Unit + E2E testing                    |
| Swagger           | API documentation (OpenAPI)           |

## Getting Started

```bash
# From repo root
pnpm install
docker compose up -d postgres
pnpm db:reset
pnpm --filter api dev
```

The API runs at **http://localhost:3001** with Swagger docs at **http://localhost:3001/api/docs**.

## Project Structure

```
src/
├── app.controller.ts       # Health check endpoint
├── app.module.ts           # Root module (registers all modules)
├── app.service.ts          # Health check with DB connectivity
├── main.ts                 # Bootstrap (CORS, validation, Swagger)
├── auth/
│   └── auth.ts             # Better Auth configuration (OAuth, 2FA, session)
├── admin/                  # Admin user/doctor management, reports
├── appointments/           # Appointment CRUD, booking, cancellation, reschedule
├── audit-logs/             # Immutable admin action logs
├── availability/           # Doctor schedule & time-off management
├── chat/                   # Real-time messaging (Socket.io)
├── common/decorators/      # Shared decorators (@Public)
├── config/                 # Env validation, Swagger setup, throttler
├── consent/                # Privacy consent tracking (RA 10173)
├── doctors/                # Doctor profiles, registration, search
├── notifications/          # Notification CRUD, preferences, WebSocket gateway
├── patients/               # Patient profile CRUD
├── prisma/                 # PrismaService (database connection)
├── push/                   # Web push notification service
├── recommendations/        # AI doctor recommendation (NVIDIA NIM)
├── records/                # Medical records, prescriptions
├── retention/              # Data retention scheduling, PRC license verification cron
├── reviews/                # Doctor reviews & ratings
├── security-alerts/        # User security notifications
├── storage/                # File upload (local / S3)
├── users/                  # User CRUD, ban/unban, role management, sessions
└── video/                  # LiveKit video room management
```

## Environment Variables

| Variable                  | Required | Default                      | Description                       |
| ------------------------- | -------- | ---------------------------- | --------------------------------- |
| `DATABASE_URL`            | Yes      | -                            | PostgreSQL connection string      |
| `PORT`                    | No       | `3001`                       | API server port                   |
| `NODE_ENV`                | No       | `development`                | Environment                       |
| `BETTER_AUTH_SECRET`      | Yes      | -                            | Auth secret (min 32 chars)        |
| `BETTER_AUTH_URL`         | Yes      | -                            | Public API base URL               |
| `CORS_ORIGIN`             | No       | `http://localhost:3000,...`  | Allowed CORS origins              |
| `GITHUB_CLIENT_ID`        | No       | -                            | GitHub OAuth client ID            |
| `GITHUB_CLIENT_SECRET`    | No       | -                            | GitHub OAuth client secret        |
| `LIVEKIT_URL`             | No       | -                            | LiveKit server URL                |
| `LIVEKIT_API_KEY`         | No       | -                            | LiveKit API key                   |
| `LIVEKIT_API_SECRET`      | No       | -                            | LiveKit API secret                |
| `AWS_REGION`              | No       | -                            | S3 region (enables S3 storage)    |
| `AWS_ACCESS_KEY_ID`       | No       | -                            | S3 access key                     |
| `AWS_SECRET_ACCESS_KEY`   | No       | -                            | S3 secret key                     |
| `S3_BUCKET`               | No       | -                            | S3 bucket name                    |
| `S3_PUBLIC_URL`           | No       | -                            | S3 public URL (CloudFront / S3)   |

## API Routes

### Authentication (`/api/auth`) — Via Better Auth

- Sign in / Sign up (email + password)
- GitHub OAuth
- Password reset (forgot / reset)
- Change password
- 2FA enable / disable / verify

### Users (`/users`)

| Method | Path                        | Auth     | Description                |
| ------ | --------------------------- | -------- | -------------------------- |
| GET    | `/users/me`                 | Session  | Current user profile       |
| PATCH  | `/users/me`                 | Session  | Update name / image        |
| POST   | `/users/me/avatar`          | Session  | Upload avatar              |
| GET    | `/users/me/sessions`        | Session  | Active sessions            |
| DELETE | `/users/me/sessions/:id`    | Session  | Revoke session             |
| DELETE | `/users/me/sessions`        | Session  | Revoke other sessions      |
| GET    | `/users`                    | ADMIN    | List all users             |
| GET    | `/users/:id`                | ADMIN    | Get user by ID             |
| PATCH  | `/users/:id`                | ADMIN    | Update any user's profile  |
| POST   | `/users/:id/ban`            | ADMIN    | Ban user                   |
| DELETE | `/users/:id/ban`            | ADMIN    | Unban user                 |
| PATCH  | `/users/:id/role`           | ADMIN    | Set role                   |

### Doctors (`/doctors`)

| Method | Path                       | Auth       | Description                   |
| ------ | -------------------------- | ---------- | ----------------------------- |
| POST   | `/doctors/register`        | Session    | Register as doctor            |
| GET    | `/doctors`                 | Public     | Approved doctors list         |
| GET    | `/doctors/:id`             | Public     | Doctor profile                |
| GET    | `/doctors/admin/all`       | ADMIN      | All doctors (incl. pending)   |
| PATCH  | `/doctors/:id/approve`     | ADMIN      | Approve doctor (verify PRC)   |
| PATCH  | `/doctors/:id/reject`      | ADMIN      | Reject / unapprove doctor     |

### Patients (`/patients`)

| Method | Path            | Auth    | Description             |
| ------ | --------------- | ------- | ----------------------- |
| GET    | `/patients/me`  | Session | Get patient profile     |
| PATCH  | `/patients/me`  | Session | Update patient profile  |

### Availability (`/availability`)

| Method | Path                              | Auth       | Description                     |
| ------ | --------------------------------- | ---------- | ------------------------------- |
| GET    | `/availability/:doctorId`         | Public     | Doctor's weekly schedule        |
| GET    | `/availability/:doctorId/slots`   | Public     | Available slots for a date      |
| PUT    | `/availability`                   | DOCTOR     | Set weekly availability         |
| GET    | `/availability/mine`              | DOCTOR     | Get my availability             |
| POST   | `/availability/time-off`          | DOCTOR     | Block specific time             |
| GET    | `/availability/time-off`          | DOCTOR     | Get my time-off blocks          |
| DELETE | `/availability/time-off/:id`      | DOCTOR     | Remove a time-off entry         |

### Appointments (`/appointments`)

| Method | Path                          | Auth         | Description                     |
| ------ | ----------------------------- | ------------ | ------------------------------- |
| POST   | `/appointments`               | PATIENT      | Create appointment              |
| GET    | `/appointments`               | Session      | My appointments list            |
| GET    | `/appointments/:id`           | Session      | Appointment detail              |
| PATCH  | `/appointments/:id/status`    | DOCTOR/ADMIN | Update status                   |
| PATCH  | `/appointments/:id/cancel`    | Session      | Cancel appointment              |
| PATCH  | `/appointments/:id/reschedule`| PATIENT      | Reschedule appointment          |
| GET    | `/appointments/upcoming`      | Session      | Upcoming appointments           |
| GET    | `/appointments/history`       | Session      | Past appointments               |

### Medical Records (`/records`)

| Method | Path                                               | Auth    | Description                       |
| ------ | -------------------------------------------------- | ------- | --------------------------------- |
| GET    | `/records/consultations`                           | Session | My consultations list             |
| GET    | `/records/consultations/:id`                       | Session | Single consultation detail        |
| POST   | `/records/consultations`                           | DOCTOR  | Create consultation notes         |
| POST   | `/records/consultations/:id/prescriptions`         | DOCTOR  | Add prescription                  |
| GET    | `/records/prescriptions`                           | PATIENT | My prescriptions                  |

### Video Consultation (`/video`)

| Method | Path                          | Auth    | Description                     |
| ------ | ----------------------------- | ------- | ------------------------------- |
| POST   | `/video/rooms`                | Session | Create video room               |
| POST   | `/video/rooms/:roomName/join` | Session | Get token to join room          |
| PATCH  | `/video/rooms/:roomName/end`  | Session | End consultation                |
| GET    | `/video/rooms/:roomName`      | Session | Get room metadata               |

### Notifications (`/notifications`)

| Method | Path                              | Auth    | Description                     |
| ------ | --------------------------------- | ------- | ------------------------------- |
| GET    | `/notifications`                  | Session | List notifications              |
| GET    | `/notifications/unread-count`     | Session | Unread count                    |
| PATCH  | `/notifications/:id/read`         | Session | Mark as read                    |
| PATCH  | `/notifications/read-all`         | Session | Mark all as read                |
| GET    | `/notifications/preferences`      | Session | Get notification preferences    |
| PUT    | `/notifications/preferences`      | Session | Update notification preferences |

### Chat (`/chat`)

| Method | Path                          | Auth    | Description                     |
| ------ | ----------------------------- | ------- | ------------------------------- |
| GET    | `/chat/conversations`         | Session | List conversations              |
| GET    | `/chat/messages/:userId`      | Session | Get messages with user          |
| POST   | `/chat/messages`              | Session | Send message                    |
| POST   | `/chat/messages/:userId/read` | Session | Mark messages as read           |

### Reviews (`/reviews`)

| Method | Path                          | Auth    | Description                     |
| ------ | ----------------------------- | ------- | ------------------------------- |
| GET    | `/reviews/doctors/:doctorId`  | Public  | Get doctor reviews              |
| POST   | `/reviews`                    | PATIENT | Submit review (post-consult)    |

### Recommendations (`/recommendations`)

| Method | Path                   | Auth    | Description                              |
| ------ | ---------------------- | ------- | ---------------------------------------- |
| POST   | `/recommendations`     | Public  | AI doctor recommendation (NVIDIA NIM)    |

### Consent (`/consent`)

| Method | Path       | Auth    | Description                   |
| ------ | ---------- | ------- | ----------------------------- |
| POST   | `/consent` | Session | Record privacy consent        |
| GET    | `/consent` | Session | View consent history          |

### Audit Logs (`/audit-logs`)

| Method | Path          | Auth    | Description           |
| ------ | ------------- | ------- | --------------------- |
| GET    | `/audit-logs` | ADMIN   | List all audit logs   |

### Security Alerts

| Method | Path                                   | Auth    | Description              |
| ------ | -------------------------------------- | ------- | ------------------------ |
| GET    | `/security-alerts`                     | Session | My security alerts       |

### Admin (`/admin`)

| Method | Path                              | Auth    | Description                     |
| ------ | --------------------------------- | ------- | ------------------------------- |
| GET    | `/admin/users`                    | ADMIN   | List all users                  |
| PATCH  | `/admin/users/:id/ban`            | ADMIN   | Ban user                        |
| PATCH  | `/admin/users/:id/role`           | ADMIN   | Change user role                |
| PATCH  | `/admin/doctors/:id/approve`      | ADMIN   | Approve doctor (verify PRC)     |
| PATCH  | `/admin/doctors/:id/reject`       | ADMIN   | Reject doctor                   |
| GET    | `/admin/appointments`             | ADMIN   | All appointments                |
| GET    | `/admin/audit-logs`               | ADMIN   | Audit trail (NPC compliance)    |
| GET    | `/admin/security-alerts`          | ADMIN   | Security alerts                 |
| GET    | `/admin/reports`                  | ADMIN   | Platform analytics/reports      |

### Storage (`/storage`)

| Method | Path              | Auth    | Description                          |
| ------ | ----------------- | ------- | ------------------------------------ |
| POST   | `/storage/upload` | Session | Upload file (profile photo, etc.)    |

## Database

### Models (19 models)

| Model                   | Description                              |
| ----------------------- | ---------------------------------------- |
| `User`                  | Users with role (PATIENT/DOCTOR/ADMIN), 2FA, ban status |
| `Session`               | Auth sessions with IP + user-agent       |
| `Account`               | OAuth account linking                    |
| `Verification`          | Email verification tokens                |
| `PatientProfile`        | Patient details (DOB, phone, PhilHealth), health metrics |
| `DoctorProfile`         | Doctor credentials (PRC, PDEA, pricing)  |
| `AvailabilitySchedule`  | Weekly schedule with time slots          |
| `TimeOff`               | Blocked time-off periods                 |
| `Appointment`           | Appointments with status, type, timing   |
| `Consultation`          | Post-consultation notes, diagnosis, plan |
| `Prescription`          | Medication name, dosage, instructions    |
| `Notification`          | Push notifications for all event types   |
| `NotificationPreference`| Per-type per-user notification toggles   |
| `PushSubscription`      | Web push subscription endpoints          |
| `ConsentLog`            | Privacy consent records (RA 10173)       |
| `AuditLog`              | Immutable admin action trail             |
| `SecurityAlert`         | Security event notifications             |
| `ChatMessage`           | Real-time messaging between users        |
| `Review`                | Patient reviews (1-5 rating) per appointment |

### Migrations

```bash
pnpm --filter api exec prisma migrate dev     # Create + apply (dev)
pnpm --filter api exec prisma migrate deploy  # Apply pending (prod)
pnpm --filter api exec prisma migrate reset   # Reset DB (dev)
pnpm --filter api exec prisma generate        # Regenerate client
```

Generated client outputs to `apps/api/generated/prisma/`.

## Testing

```bash
pnpm --filter api test        # Unit tests (199+ tests, 25 suites)
pnpm --filter api test:e2e    # E2E tests
pnpm --filter api test:cov    # Coverage report
```

## File Storage

- **Development**: Local filesystem under `uploads/`, served via `/uploads` static middleware
- **Production**: AWS S3 (or S3-compatible) when `AWS_REGION` and `S3_BUCKET` are set
- Allowed types: JPEG, PNG, WEBP
- Max file size: 2 MB

## Notes

- The API runs on port **3001** by default (not 3000) to avoid conflict with the Next.js web app
- Swagger is only available in non-production environments
- Database connection uses `@prisma/adapter-pg` (PgBouncer-compatible adapter)
- The project uses `module: "NodeNext"` with `tsc-alias` for path resolution in built output
- Video consultation requires `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` environment variables; without them endpoints return `403 Video consultation is not configured`
