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

## Cost & backups (set up 2026-08-01)

- Budget `monthly-cost-budget` ($10/mo, 50%/100% alerts) + CloudWatch alarm `billing-10usd`
  → SNS topic `telehealth-billing-alerts` (arn saved in `~/telehealth-aws.env`; needs a
  confirmed email subscription to actually notify — subscribe via console or ask the dev).
- AMI `telehealth-base-<date>` (no-reboot) + RDS manual snapshot `telehealth-db-<date>` —
  create fresh ones before major deploys; delete stale ones (≈$2/mo storage).
- 4 orphaned EIPs were released (2026-08-01); only the in-use EIP above remains.
  Production DB is empty (smoke-test users deleted) — ready for real signups.

## Alert email (TODO)

Ask the user for their email and subscribe it to `arn:aws:sns:us-east-1:<ACCOUNT>:telehealth-billing-alerts`
(via `aws sns subscribe`), then confirm the subscription link they receive.
