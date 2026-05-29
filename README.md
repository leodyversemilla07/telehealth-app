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
| Frontend    | Next.js 16 + React 19 + Tailwind CSS v4 + shadcn/ui          |
| Backend     | NestJS 11 + Express                                           |
| Database    | PostgreSQL 16 (via Prisma ORM + `@prisma/adapter-pg`)        |
| Auth        | Better Auth (email/password, 2FA) |
| Validation  | Zod (shared) + class-validator (API)                          |
| API Client  | TanStack React Query v5                                       |
| Icons       | Lucide React                                                  |
| Linting     | Biome (linter + formatter)                                    |
| Monorepo    | Turborepo + pnpm workspaces                                   |
| Deployment  | Docker / AWS Elastic Beanstalk                                |

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
| doctor@example.com     | Set via sign-up   | PROVIDER |
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
- Available components: Badge, Button, Card, Dialog, Input, Label, Select, Separator, Sonner (toast)
- [Components JSON](./apps/web/components.json) for shadcn CLI

### `@workspace/shared` (`packages/shared`)
- Zod validation schemas (`signInSchema`, `signUpSchema`, `userSchema`, etc.)
- Shared TypeScript types (`UserDto`, `ProviderProfileDto`, etc.)
- Exported via subpath exports: `@workspace/shared/schemas/*`, `@workspace/shared/types/*`

## Premium Features

### 🌟 Doctor Ratings & Reviews
- **Average Ratings & Review Counts**: Mapped dynamically from patient reviews in both search and public profile views.
- **Credential Transparencies**: Star ratings displayed prominently on doctor discovery cards to establish immediate visual trust.

## Auth & Security

- **Better Auth** handles authentication with email/password and OAuth (Google, GitHub)
- **2FA** via TOTP authenticator apps (Google Authenticator, Authy) with backup codes
- **Session rotation** — 7-day expiry, refreshed every 24 hours
- **Rate limiting** — 30 requests/60s API-wide, 20 auth requests/minute
- **RBAC** — Three roles: `PATIENT`, `PROVIDER`, `ADMIN`
- **Security alerts** — Password changes, profile updates, session revocations trigger notifications
- **Audit logging** — All admin actions (bans, role changes) are immutably logged

## API Routes

### Authentication (`/api/auth`)
- Sign in / Sign up (email + password)
- OAuth (Google, GitHub)
- Password reset flow
- 2FA enable/disable/verify

### Users (`/users`)
- `GET /users/me` — Current user profile
- `PATCH /users/me` — Update profile
- `POST /users/me/avatar` — Upload avatar
- `GET /users/me/sessions` — Active sessions
- `DELETE /users/me/sessions/:id` — Revoke session
- Admin: list, get by ID, ban, unban, set role

### Providers (`/providers`)
- `POST /providers/register` — Register as provider
- `GET /providers` — List approved providers (public)
- `GET /providers/:id` — Provider profile (public)
- `PATCH /providers/:id/approve` — Admin approval
- `PATCH /providers/:id/reject` — Admin rejection

### Patients (`/patients`)
- `GET /patients/me` — Get patient profile
- `PATCH /patients/me` — Update patient profile

### Consent (`/consent`)
- `POST /consent` — Record privacy consent (RA 10173)
- `GET /consent` — View consent history

### Admin (`/audit-logs`, `/users/me/security-alerts`)
- Audit log with search and filtering
- Security alerts inbox

## Documentation

- **SRS**: [docs/SRS.md](./docs/SRS.md) — Full Software Requirements Specification covering Philippine regulatory compliance (RA 10173, DOH AO 2021-0037, PRC, PDEA, PhilHealth)

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