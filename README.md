# Next Monorepo (Next.js + NestJS + shadcn/ui)

This repository is a monorepo containing a Next.js frontend (`apps/web`), a NestJS API (`apps/api`), and shared packages (`packages/*`). It uses pnpm workspaces and Turbo for task orchestration.

Prerequisites

- Node >= 20
- pnpm (as the package manager)

Quick start

1. Install dependencies from the repository root:

```bash
pnpm install
```

2. Run development across the monorepo (Turbo):

```bash
pnpm dev
```

3. Build everything:

```bash
pnpm build
```

Run a single project

- Web (Next.js app):

```bash
pnpm --filter web dev
pnpm --filter web build
pnpm --filter web start
```

- API (NestJS):

```bash
pnpm --filter api start:dev
pnpm --filter api build
pnpm --filter api start:prod
```

Common workspace commands

- Type check all projects:

```bash
pnpm -w run typecheck
```

- Run lint/format checks (biome is used in this repo):

```bash
pnpm -w run lint
pnpm -w run format:check
```

Testing

- Run API tests:

```bash
pnpm --filter api test
```

Notes

- This repo transpiles the `@workspace/ui` package for Next. See `apps/web/next.config.mjs`.
- Prisma client for the API is generated under `apps/api/generated/prisma` when running `prisma generate`.
- On Windows you may see Git warnings about LF ↔ CRLF conversions; these are line-ending warnings and expected on Windows.

If you'd like, I can add a short `CONTRIBUTING.md` or an `ANALYSIS.md` summarizing architecture and next steps.
