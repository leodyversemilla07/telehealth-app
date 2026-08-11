# Telehealth — AWS Deployment Notes

Infrastructure provisioned via AWS CLI (see `provision.sh` steps in this repo's history):

| Resource | Value |
|---|---|
| EC2 | `t3.small` @ `<elastic-ip>` (Ubuntu 24.04, 30GB gp3) |
| RDS | `telehealth-db` — PostgreSQL 16.14, `db.t3.micro` |
| S3 | `telehealth-uploads-<ACCOUNT>` (ready; local disk used until presigned URLs are implemented) |
| IAM | `telehealth-ec2-role` / `telehealth-ec2-profile` (S3 access via instance profile) |
| Access | **SSM Session Manager** (port 22 inbound **closed**; key `~/.ssh/telehealth-prod.pem` kept for out-of-band emergency only) |
| Secrets | `~/telehealth-aws.env` (local only, NOT committed) |

## Topology

```
Browser ── HTTPS :443 (nginx, Let's Encrypt)
   │  tele-health.app → 127.0.0.1:3000 (Next.js) + proxied /api,/socket.io,/uploads → 3001
   │  api.tele-health.app → 127.0.0.1:3001 (NestJS direct, CORS + cross-subdomain cookies)
   └─► RDS (SSL) · S3 (via instance role) · LiveKit Cloud (wss://telehealth-app-ju7ll1wy.livekit.cloud)
```

Processes: `pm2` (`api`, `web`) + `pm2 startup` (auto-restart on reboot).

## Edge (nginx) — audited 2026-08-10

Config lives on the box only: `/etc/nginx/sites-enabled/telehealth` (3 server blocks: :80
redirect → 443, `tele-health.app`/`www` → :3000 + proxied `/api/`, `/socket.io`, `/uploads/` →
:3001, and `api.tele-health.app` → :3001). TLS via one Let's Encrypt cert (SANs cover all
three hostnames), renewed by `certbot.timer` (randomised 2×/day).

Verified + hardened on 2026-08-10 (backups in `/etc/nginx/backups/` before any edit):
- TLS 1.0/1.1 refused; 1.2 + 1.3 only, modern AEAD suites (ECDHE-ECDSA/RSA GCM + Chacha20).
- `server_tokens off;` + `proxy_hide_header X-Powered-By;` on every proxied block (was leaking
  `nginx/1.24.0 (Ubuntu)` and `Next.js`).
- http-block default `ssl_protocols` now TLSv1.2+ (was TLSv1/1.1 — inert because certbot's
  `options-ssl-nginx.conf` include overrode it per server, but a future block without the
  include would have inherited weak TLS).
- HSTS `max-age=63072000; includeSubDomains; preload`, nonce-based CSP, X-Frame-Options,
  nosniff, Referrer-Policy, Permissions-Policy all verified on the wire (web sets CSP in
  `apps/web/proxy.ts`; the API's helmet headers come from Nest). HTTP→HTTPS 301; `client_max_body_size 25m`.
- No nginx `limit_req` **by design**: app-layer throttling (global REST throttler + tRPC
  throttle middleware, keyed to the last XFF hop) already handles abuse; double-throttling
  at the edge would fight it.
- Backups of conf edits go to `/etc/nginx/backups/` (NOT `sites-enabled/` — nginx includes
  `sites-enabled/*`, a `.bak` there duplicates every server block and breaks `nginx -t` with
  "conflicting server name" warnings).

## Shell access (SSM, no SSH)

Port 22 inbound is revoked from `telehealth-web-sg` (2026-08-05); the SSM agent runs
via snap (`amazon-ssm-agent`, `AmazonSSMManagedInstanceCore` attached to
`telehealth-ec2-role`). Open a shell or run one-off commands without any inbound port:

```bash
# Interactive shell
aws ssm start-session --target i-0b020f89853c8d2f8

# One-off command
aws ssm send-command --instance-ids i-0b020f89853c8d2f8 \
  --document-name AWS-RunShellScript \
  --parameters 'commands=["whoami; uptime"]' \
  --output text

# SCP-style file copy (optional)
aws ssm send-command --instance-ids i-0b020f89853c8d2f8 \
  --document-name AWS-RunShellScript \
  --parameters 'commands=["sudo cat /var/log/telehealth-userdata.log"]'
```

To restore SSH in an emergency (key-only, key `telehealth-prod`):

```bash
aws ec2 authorize-security-group-ingress --group-id sg-0b7473a31d6033df6 \
  --protocol tcp --port 22 --cidr <your-ip>/32
```

## ⚠️ Critical config gotchas (learned the hard way)

1. **`BETTER_AUTH_URL` must be ORIGIN-ONLY** — `https://your-domain` NOT
   `https://your-domain/api`. Better Auth mounts routes at `basePath`
   (`/api/auth`) relative to baseURL's path; appending `/api` makes every
   auth route 404 (`/api/api/auth/*`). Dev default `http://localhost:3001`
   is origin-only, which is why it worked locally.

2. **RDS requires TLS** — `apps/api/src/prisma/prisma-client.ts` now auto-enables
   `ssl` for non-localhost hosts (Prisma CLI does this for migrations; the driver
   adapter needed explicit config). Health endpoint shows `database.healthy`.

3. **S3 via instance profile** — `apps/api/src/storage/s3.storage.ts` now falls
   back to the SDK default credential chain when `AWS_ACCESS_KEY_ID` is unset,
   so no keys live on the server.

4. **tRPC rate limiting is per proxy-trusted IP** — `ThrottleMiddleware` keys
   each window on the LAST `x-forwarded-for` hop (what nginx appends), falling
   back to `cf-connecting-ip` / `x-real-ip` / socket address. Before this,
   every client behind nginx shared one `127.0.0.1` bucket of 30/min for the
   whole site. Now 30 req/min per real client per procedure (override with
   `THROTTLE_LIMIT`); expired windows are pruned every 30s. Diagnosing a burst
   of `429`s: verify with `curl -H 'x-forwarded-for: 1.2.3.4'` against
   `http://localhost:3001` — the 31st request must 429. Note your own NAT may
   split traffic across several public IPs, so bursts from one workstation can
   legitimately not trip it.

5. **Email is Resend-only; no SMTP vars** — `apps/api/src/common/utils/email.ts`
   uses the Resend SDK exclusively, and `EMAIL_PROVIDER`/`SMTP_*` are read
   nowhere. On 2026-08-09 the dead `EMAIL_PROVIDER`, `SMTP_ENDPOINT`,
   `SMTP_PASS`, `SMTP_PORT`, `SMTP_USER` entries were removed from the prod
   `.env` (credential surface reduction; no restart needed — unused). The
   `.env` key-set otherwise matches `.env.example` (AWS access keys absent by
   design — S3 via instance profile).

## Production TODO (before real users)

- [x] Real domain + **Let's Encrypt** (certbot, single cert: tele-health.app, www, api; auto-renews)
- [x] Email via **Resend SDK** (free tier 3,000/mo, 100/day, domain `tele-health.app` verified in
      Resend: DKIM `resend._domainkey`, MX+SPF on `send.tele-health.app`)
      `RESEND_API_KEY=<Resend API key>`, `EMAIL_FROM="Telehealth App <noreply@tele-health.app>"`
      (⚠ `from` must be the verified domain — an IP in `from` gets a 550).
      (Key lives in the repo-root `.env`, NOT in git.) Transport = `resend.emails.send` in
      (in the repo-root `.env`, NOT in git). Transport = `resend.emails.send` in
      `apps/api/src/common/utils/email.ts` (no nodemailer/SMTP; `SMTP_*` vars are legacy, unused).
      Password reset verified end-to-end via Resend SDK (`POST /api/auth/request-password-reset` →
      accepted, logged `Email sent to …`).
      `requireEmailVerification: true` is **live** in `packages/auth/src/server.ts` — new signups must
      verify their email before they can sign in (verification email via Resend).
- [x] LiveKit Cloud (Build tier) — `LIVEKIT_URL/API_KEY/API_SECRET` in the repo-root `.env`;
      key is a **service-account key**; tokens signed server-side in `/api/video/join` (1h TTL);
      web gets URL+token from the join response (no rebuild). Credits: 5,000 WebRTC min/mo free,
      overage ~$0.0004/min. Credentials in the repo-root `.env` (project `telehealth-app-ju7ll1wy`).
- [x] S3 uploads enabled (PRIVATE objects, streamed through the API):
      `S3_BUCKET=telehealth-uploads-<ACCOUNT>` in the repo-root `.env`; objects are written
      with instance-profile creds and served via `GET /uploads/:key` (main.ts streams the
      GetObject body server-side). Stored URLs are unified to `${BETTER_AUTH_URL}/uploads/<key>`
      (commit `38ec18b`) so DB values work for local or S3 providers. Verified: upload →
      fetch 200 image/png through nginx, direct S3 URL → 403, ACL owner-only.
      No presigned URLs needed — objects never get a public URL, and avatars/attachments
      survive instance rebuilds.
- [ ] Upgrade to `t3.small` → paid after free-plan credits/6 months (~$33/mo total)

## Deploying code (server)

```bash
cd /opt/telehealth
git checkout -- apps/web/next-env.d.ts   # locally-regenerated, blocks pull
git pull --ff-only
pnpm install                            # root postinstall builds @telehealth/env + regenerates Prisma
set -a; source .env; set +a             # prisma CLI needs DATABASE_URL (schema lives in packages/db)
cd packages/db && pnpm exec prisma generate && pnpm exec prisma migrate deploy
cd /opt/telehealth && pnpm build && pm2 restart api web --update-env
```

## Database package (`packages/db`)

- Schema + migrations + seed live in `packages/db/prisma/` (single source of truth).
- **Docs-standard monorepo layout**: the generated client lives in
  `packages/db/generated/prisma` and is re-exported through the package
  boundary. Apps import `import { prisma } from "@telehealth/db"` — the API
  no longer imports the raw generated path. The package builds to `dist/`
  (Compiled Packages strategy; the API builds with tsc, not a bundler).
  Turbo `build.dependsOn: ["^build"]` compiles `@telehealth/db` before api.
- Root scripts: `pnpm migrate`, `pnpm db:reset`, `pnpm db:studio`, `pnpm seed`.
- Environment lives in the repo-root `.env` (loaded by `@telehealth/env/load`), so Prisma CLI
  resolves `DATABASE_URL` from there — no `packages/db/.env` or per-app `.env` needed; `source .env`
  at the root before running `migrate`/`studio`/`seed` if the shell needs it.
- On the server, remove the now-unused legacy client (`rm -rf apps/api/src/generated`)

## Auth package (`packages/auth`)

- **Security posture (full-codebase review, closed 2026-08-10)**: verified sound — Better Auth
  1.6.x (banned/locked → generic 401, password complexity, 2FA plugin, session rotation 24h,
  Secure + SameSite-Lax prod cookies, lockout 5/15min), tRPC AuthMiddleware + RolesMiddleware
  with 2FA enforcement on privileged roles, ownership checks on every traced flow, LiveKit
  participant-only 1h tokens, documents magic-byte allowlist + server-generated keys,
  nonce-based CSP, no XSS sinks. Three findings were closed in `eeee9f0` + the edge audit:
  1. **Seeded accounts verified absent from prod** (queried RDS: 0 rows for the seed emails).
     The seed's `NODE_ENV=production` refusal guard works; those creds exist only in the
     hermetic CI DB (`e2e.yml` spins its own throwaway `postgres:16-alpine`).
  2. **REST 2FA gap closed** — `Require2FaInterceptor` (`apps/api/src/common/interceptors/`,
     registered globally in `main.ts`) mirrors the tRPC rule: privileged-only REST routes
     (currently the 14 `@Roles(["ADMIN"])` routes) reject privileged sessions without 2FA
     with `403 TWO_FACTOR_REQUIRED` (same message as the tRPC path).
  3. **`/uploads` auth-gating** — the middleware now runs BEFORE `express.static` so non-avatar
     keys require a session in every storage mode (previously LocalStorage/dev served medical
     files unauthenticated). Prod always uses S3 (private bucket); avatars stay public.

### Codebase-analysis fixes (deployed `2dea97d`, 2026-08-11)

Ranked findings from the full-codebase analysis were all closed:

1. **Public doctor listing no longer leaks emails** — `PUBLIC_USER_SELECT` drops `email`;
   anonymous `doctors.list`/`doctors.byId` expose only name/image/rating. (Web's book page
   previously read `doctor.user.email` for an avatar fallback — removed.)
2. **License cron no longer spams** — `verifyDoctorLicenses` dedups "PRC License Expiring
   Soon" notifications (skips if one exists within ~5 months); an expired doctor's future
   BOOKED/CONFIRMED appointments are now CANCELLED with notifications to each patient and
   the doctor.
3. **Patient cancellation window closed** — `cancel()` blocks a patient once inside the
   notice window OR after the appointment started (one-sided `msUntilStart < window`
   check); doctors/admins can still cancel started appointments.
4. **`/uploads/:key` ownership checks** — `authorizeUploadsKey` (`apps/api/src/common/
   middleware/uploads-gate.ts`) verifies the session user is the document's patient,
   assigned doctor, or admin (mirrors `DocumentsService.assertAppointmentAccess`); unknown
   keys → 404 without probing S3 (no key-validity leak); forbidden → 403 before any storage
   read. Avatars stay public.
5. **Reschedule time-off check moved inside the transaction** (mirrors `create()`).
6. **Bans kill live sockets** — `banUser` emits `session:revoked` + force-disconnects the
   user's Socket.io connections (web client redirects to `/sign-in`).
7. **Slot accuracy** — `getAvailableSlots` filters slots against partial time-offs (no more
   whole-day hiding) and counts midnight-straddling appointments via overlap semantics.
8. **Audit-log values** — `updateStatus`/`cancel` capture the pre-transition status inside
   the transaction (no more "previous"); the hourly reminder cron isolates each recipient
   and always marks `reminderSentAt` (no duplicate reminders on partial failure).
9. **Composite indexes** — migration `20260811120000_add_composite_indexes` adds
   `Appointment(doctorId, status, startTime)` + `ChatMessage(senderId, receiverId)`
   (the June performance indexes were dropped by `20260729090937` — re-added).
   Applied to prod RDS 2026-08-11.
- Better Auth server config via `createAuth(deps)` factory — deps (prisma,
  email transport) are injected by the API (`apps/api/src/auth/auth.ts`).
- Client: `createTelehealthAuthClient(baseURL)` consumed by the web app
  (`apps/web/lib/auth-client.ts`, subpath `@telehealth/auth/client`).
- Password/lockout utilities live in `packages/auth` (`/password` subpath).
- **Client IP for audit/alert attribution**: `trustedClientIp()` reads only the
  LAST `x-forwarded-for` hop (or `x-real-ip` / `cf-connecting-ip`) — the values
  set by the upstream proxy. The client-supplied first hop is ignored, so a
  spoofed `X-Forwarded-For: <fake>` cannot forge audit/alert IPs. (Login
  lockout is keyed per-user, not per-IP.)
- The package is compiled to CJS (`dist/`); turbo builds it before api/web.
- ENV TIMING: the host must load `.env` before importing better-auth —
  `apps/api/src/main.ts` imports `dotenv/config` as its first line. Keep it
  that way when touching auth imports.

## Cost & backups (set up 2026-08-01; refreshed 2026-08-10)

- Budget `monthly-cost-budget` ($10/mo, 50%/100% alerts) + CloudWatch alarm `billing-10usd`
  → SNS topic `telehealth-billing-alerts` was removed 2026-08-08 (email subscription
  never confirmed; skip per project decision). Alerts are checked ad hoc via the
  Budgets console instead.
- AMI `telehealth-base-<date>` (no-reboot) + RDS manual snapshot `telehealth-db-<date>` —
  create fresh ones before major deploys; delete stale ones (≈$2/mo storage).
  Current pair (2026-08-10, prod at `eeee9f0`): `telehealth-base-20260810`
  (`ami-0ed1a95e792ee4581`) + `telehealth-db-20260810`. Older snapshot/AMI pair was
  deregistered/deleted (DB was empty; nothing referenced the old AMI — no launch
  templates or ASGs exist).
- RDS automated backups ON (daily 06:56–07:26 UTC window); retention is capped at 1 day
  by the AWS **free-tier restriction** (`FreeTierRestrictionError` when trying to raise
  it) — manual snapshots are the extra restore points while this account stays free-tier.
- 4 orphaned EIPs were released (2026-08-01); only the in-use EIP above remains.
  Production DB is empty (smoke-test users deleted) — ready for real signups.

## Alert email (TODO)

Ask the user for their email and subscribe it to `arn:aws:sns:us-east-1:<ACCOUNT>:telehealth-billing-alerts`
(via `aws sns subscribe`), then confirm the subscription link they receive.
