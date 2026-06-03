# Telehealth App

A telehealth platform connecting patients with licensed Philippine healthcare providers through video consultations, secure messaging, electronic prescriptions, and integrated health record management.

Built with a **monorepo architecture** using Turborepo + pnpm workspaces. Deployed on **AWS**.

## Architecture

```
telehealth-app/
├── apps/
│   ├── api/          # NestJS 11 REST API (port 3001)
│   └── web/          # Next.js 16 frontend (port 3000)
├── packages/
│   ├── shared/       # Shared Zod schemas & TypeScript types
│   ├── ui/           # shadcn/ui component library + Tailwind CSS v4
│   └── typescript-config/
├── proxy/
│   └── nginx.conf    # Reverse proxy config
├── docs/
│   ├── SRS.md        # Software Requirements Specification
│   └── AWS-DEPLOYMENT.md
└── scripts/
    └── deploy-aws.sh # AWS deployment script
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 + React 19 + Tailwind CSS v4 + shadcn/ui |
| **Backend** | NestJS 11 + Express |
| **Database** | PostgreSQL 16 (Prisma ORM) |
| **Auth** | Better Auth (email/password, 2FA, lockout) |
| **Video** | LiveKit |
| **AI** | NVIDIA NIM |
| **Real-time** | Socket.io (WebSocket) |
| **Storage** | AWS S3 |
| **Email** | AWS SES |
| **Hosting** | AWS Elastic Beanstalk + RDS + S3 |

## Prerequisites

- **Node.js** >= 22
- **pnpm** >= 11
- **Docker** (for local development)
- **AWS CLI** (for deployment)

## Quick Start (Local Development)

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL
docker compose up -d postgres

# 3. Setup database
pnpm db:reset

# 4. Start development
pnpm dev
```

- **Web app**: http://localhost:3000
- **API**: http://localhost:3001
- **Swagger docs**: http://localhost:3001/api/docs

## Deployment (AWS)

```bash
# Automated deployment
./scripts/deploy-aws.sh
```

Or see [docs/AWS-DEPLOYMENT.md](./docs/AWS-DEPLOYMENT.md) for manual steps.

## Workspace Commands

### Development
```bash
pnpm dev                # Run all apps
pnpm --filter web dev   # Web only
pnpm --filter api dev   # API only
```

### Build
```bash
pnpm build              # Build all
pnpm --filter web build # Web only
pnpm --filter api build # API only
```

### Database
```bash
pnpm db:start           # Start PostgreSQL
pnpm db:stop            # Stop PostgreSQL
pnpm db:reset           # Reset + migrate + seed
pnpm migrate            # Apply migrations
```

### Quality
```bash
pnpm typecheck          # TypeScript check
pnpm lint               # Lint
pnpm format             # Format
```

### Testing
```bash
pnpm --filter api test  # API tests (Jest)
pnpm --filter web test  # Web tests (Vitest)
```

## Features

### Patient
- Account with email verification
- Profile management
- Browse/search doctors
- AI symptom checker
- Book appointments
- Video consultations
- Medical records
- In-app chat

### Doctor
- Registration with PRC license
- Profile & credentials
- Schedule management
- Consultations & notes
- Prescriptions
- Patient records
- In-app chat

### Security
- Better Auth (email/password, 2FA)
- Account lockout (5 failed attempts)
- Session rotation (7-day expiry)
- Rate limiting
- Audit logging
- Security alerts

### Admin
- User management
- Doctor approval
- Audit logs
- Reports

## API Routes

| Route | Description |
|-------|-------------|
| `/api/auth/*` | Authentication (sign in/up, verify, reset, 2FA) |
| `/api/doctors/*` | Doctor profiles & search |
| `/api/appointments/*` | Book/manage appointments |
| `/api/records/*` | Medical records & prescriptions |
| `/api/video/*` | Video consultation rooms |
| `/api/chat/*` | Messaging |
| `/api/notifications/*` | Notifications |
| `/api/admin/*` | Admin operations |

## Documentation

- [Software Requirements Specification](./docs/SRS.md)
- [AWS Deployment Guide](./docs/AWS-DEPLOYMENT.md)

## Environment Variables

See [apps/api/.env.example](./apps/api/.env.example) for required variables.

**Critical for production:**
```
BETTER_AUTH_URL=https://api.tele-health.app  # MUST be production URL!
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
DATABASE_URL=postgresql://...
CORS_ORIGIN=https://tele-health.app
COOKIE_DOMAIN=.tele-health.app
```
