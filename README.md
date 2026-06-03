# Telehealth App

A telehealth platform connecting patients with licensed Philippine healthcare providers through video consultations, secure messaging, electronic prescriptions, and integrated health record management.

[![CI](https://github.com/your-username/telehealth-app/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/telehealth-app/actions/workflows/ci.yml)

## 🏗️ Architecture

```
telehealth-app/
├── apps/
│   ├── api/          # NestJS 11 REST API
│   └── web/          # Next.js 16 frontend
├── packages/
│   ├── shared/       # Zod schemas & TypeScript types
│   └── ui/           # shadcn/ui components
├── docs/
│   ├── DEPLOYMENT.md # Complete deployment guide
│   ├── SRS.md        # Software Requirements Specification
│   └── DESIGN-SYSTEM.md
└── .github/
    └── workflows/
        └── ci.yml    # CI/CD pipeline
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS v4, shadcn/ui |
| **Backend** | NestJS 11, Express |
| **Database** | PostgreSQL 16 (Prisma ORM) |
| **Auth** | Better Auth (email/password, 2FA, lockout) |
| **Video** | LiveKit |
| **Real-time** | Socket.io (WebSocket) |
| **Email** | AWS SES |
| **Storage** | AWS S3 |
| **Hosting** | AWS EC2 + RDS |

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
pnpm install

# Start PostgreSQL
docker compose up -d postgres

# Setup database
pnpm db:reset

# Start development
pnpm dev
```

- **Web:** http://localhost:3000
- **API:** http://localhost:3001
- **Swagger:** http://localhost:3001/api/docs

### Production

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for complete deployment guide.

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
| `/patient/*` | Patient dashboard (11 pages) |
| `/doctor/*` | Doctor dashboard (11 pages) |
| `/admin/*` | Admin dashboard (8 pages) |

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

## 🚢 Deployment

### CI/CD Pipeline

- **On Push to Main:** Auto-deploy to EC2
- **On Pull Request:** Run tests + lint

### Manual Deployment

```bash
# Deploy to EC2
ssh ec2-user@your-server
cd /home/ec2-user/telehealth-app
git pull
pnpm install
pnpm --filter api build
cd apps/web && NEXT_OUTPUT=standalone pnpm build
cd ../..
pm2 restart all
```

### Environment Variables

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md#environment-variables) for all required variables.

**Critical:**
```bash
BETTER_AUTH_URL=https://api.tele-health.app  # MUST be production URL!
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
DATABASE_URL=postgresql://...
```

## 📚 Documentation

- [Deployment Guide](./docs/DEPLOYMENT.md) — Complete EC2 deployment
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
