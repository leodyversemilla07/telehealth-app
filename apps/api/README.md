# Telehealth App — API

NestJS 11 REST API for the telehealth platform. Serves as the backend for `apps/web` and powers authentication, user management, provider/patient profiles, and audit logging.

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
├── audit-logs/             # Immutable admin action logs
├── common/decorators/      # Shared decorators (@Public)
├── config/                 # Env validation, Swagger setup, throttler
├── consent/                # Privacy consent tracking (RA 10173)
├── patients/               # Patient profile CRUD
├── prisma/                 # PrismaService (database connection)
├── providers/              # Provider registration, approval, search
├── security-alerts/        # User security notifications
├── storage/                # File upload (local / S3)
└── users/                  # User CRUD, ban/unban, role management, sessions
```

## Environment Variables

| Variable                  | Required | Default                      | Description                       |
| ------------------------- | -------- | ---------------------------- | --------------------------------- |
| `DATABASE_URL`            | ✅       | —                            | PostgreSQL connection string      |
| `PORT`                    | ❌       | `3001`                       | API server port                   |
| `NODE_ENV`                | ❌       | `development`                | Environment                       |
| `BETTER_AUTH_SECRET`      | ✅       | —                            | Auth secret (min 32 chars)        |
| `BETTER_AUTH_URL`         | ✅       | —                            | Public API base URL               |
| `CORS_ORIGIN`             | ❌       | `http://localhost:3000,...`  | Allowed CORS origins              |
| `GOOGLE_CLIENT_ID`        | ❌       | —                            | Google OAuth client ID            |
| `GOOGLE_CLIENT_SECRET`    | ❌       | —                            | Google OAuth client secret        |
| `GITHUB_CLIENT_ID`        | ❌       | —                            | GitHub OAuth client ID            |
| `GITHUB_CLIENT_SECRET`    | ❌       | —                            | GitHub OAuth client secret        |
| `AWS_REGION`              | ❌       | —                            | S3 region (enables S3 storage)    |
| `AWS_ACCESS_KEY_ID`       | ❌       | —                            | S3 access key                     |
| `AWS_SECRET_ACCESS_KEY`   | ❌       | —                            | S3 secret key                     |
| `S3_BUCKET`               | ❌       | —                            | S3 bucket name                    |
| `S3_PUBLIC_URL`           | ❌       | —                            | S3 public URL (CloudFront / S3)   |

## API Routes

### Authentication (`/api/auth`) — Via Better Auth

- Sign in / Sign up (email + password)
- Google OAuth, GitHub OAuth
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

### Providers (`/providers`)

| Method | Path                       | Auth       | Description                   |
| ------ | -------------------------- | ---------- | ----------------------------- |
| POST   | `/providers/register`      | Session    | Register as provider          |
| GET    | `/providers`               | Public     | Approved providers list       |
| GET    | `/providers/:id`           | Public     | Provider profile              |
| GET    | `/providers/admin/all`     | ADMIN      | All providers (incl. pending) |
| PATCH  | `/providers/:id/approve`   | ADMIN      | Approve provider (verify PRC) |
| PATCH  | `/providers/:id/reject`    | ADMIN      | Reject / unapprove provider   |

### Patients (`/patients`)

| Method | Path            | Auth    | Description             |
| ------ | --------------- | ------- | ----------------------- |
| GET    | `/patients/me`  | Session | Get patient profile     |
| PATCH  | `/patients/me`  | Session | Update patient profile  |

### Consent (`/consent`)

| Method | Path       | Auth    | Description                   |
| ------ | ---------- | ------- | ----------------------------- |
| POST   | `/consent` | Session | Record privacy consent        |
| GET    | `/consent` | Session | View consent history          |

### Audit Logs (`/audit-logs`)

| Method | Path          | Auth    | Description           |
| ------ | ------------- | ------- | --------------------- |
| GET    | `/audit-logs` | ADMIN   | List all audit logs   |

### Security Alerts (`/users/me/security-alerts`)

| Method | Path                                   | Auth    | Description              |
| ------ | -------------------------------------- | ------- | ------------------------ |
| GET    | `/users/me/security-alerts`            | Session | Current user's alerts    |
| POST   | `/users/me/security-alerts/read`       | Session | Mark all as read         |

## Database

### Models

| Model              | Description                              |
| ------------------ | ---------------------------------------- |
| `User`             | Users with role (PATIENT/PROVIDER/ADMIN), 2FA, ban status |
| `Session`          | Auth sessions with IP + user-agent       |
| `Account`          | OAuth account linking                    |
| `Verification`     | Email verification tokens                |
| `PatientProfile`   | Patient details (DOB, phone, PhilHealth), including health metrics (weight, height, and JSON-based history) |
| `ProviderProfile`  | Provider credentials (PRC, PDEA, pricing) and relationships with appointments and reviews |
| `ConsentLog`       | Privacy consent records (RA 10173)       |
| `AuditLog`         | Immutable admin action trail             |
| `SecurityAlert`    | Security event notifications             |
| `Review`           | Patient reviews and ratings for consultation sessions linked to doctors |

### Doctor Reviews & Ratings Aggregator
The `DoctorProfile` references an array of `Review` items. In `DoctorsService.findApproved()` and `DoctorsService.findOne()`, the NestJS backend dynamically computes:
- `averageRating`: The arithmetic mean of all numeric reviews, rounded to the nearest decimal.
- `totalReviews`: The exact length of the reviews list, allowing high-performance queries without redundant DB column overhead.

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
pnpm --filter api test        # Unit tests
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