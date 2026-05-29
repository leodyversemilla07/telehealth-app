# AWS Deployment — Telehealth App (Next.js + NestJS)

Deploy to AWS **without Docker** using **Elastic Beanstalk** (Node.js platform).

## Architecture

```
Route 53
   └─ CloudFront
        ├─ api.yourdomain.com ──→ ALB ──→ EB (NestJS API)
        └─ app.yourdomain.com ──→ ALB ──→ EB (Next.js Web)
                                         └─ RDS (PostgreSQL)
```

## Prerequisites

```bash
# AWS CLI
aws configure

# EB CLI
pip install awsebcli

# Verify
aws sts get-caller-identity
eb --version
```

## Encryption at Rest (HIPAA §164.312(a)(2)(iv))

All ePHI data (patient records, diagnoses, prescriptions, chat messages) must be encrypted at rest.
RDS encryption must be enabled **at database creation time** — it cannot be added later.

### New RDS instance (recommended)

```bash
# Create RDS with encryption enabled
aws rds create-db-instance \
  --db-instance-identifier telehealth-app-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username dbuser \
  --master-user-password <secret> \
  --allocated-storage 20 \
  --storage-encrypted \
  --kms-key-id alias/aws/rds
```

### Migrate an existing unencrypted DB

RDS encryption can only be set at creation time. To encrypt an existing database:

```bash
# 1. Take a snapshot of the current DB
aws rds create-db-snapshot \
  --db-instance-identifier telehealth-app-db \
  --db-snapshot-identifier telehealth-app-db-snapshot

# 2. Wait for snapshot to complete, then copy it encrypted
aws rds copy-db-snapshot \
  --source-db-snapshot-identifier telehealth-app-db-snapshot \
  --target-db-snapshot-identifier telehealth-app-db-encrypted \
  --copy-tags \
  --kms-key-id alias/aws/rds

# 3. Restore from the encrypted snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier telehealth-app-db-encrypted \
  --db-snapshot-identifier telehealth-app-db-encrypted

# 4. Update DATABASE_URL in EB environment to point to the new instance
eb setenv DATABASE_URL=postgresql://dbuser:<secret>@telehealth-app-db-encrypted.xxxxxx.us-east-1.rds.amazonaws.com:5432/mydb
```

> **Note:** During the migration, the app will have read-only access to the old (unencrypted) instance while the encrypted copy is being restored. Plan for a brief maintenance window.

## Quick Start

### 1. Package the apps

```bash
pnpm run build

# Package both
./scripts/deploy.sh all
# → dist/deploy/api-deploy.zip
# → dist/deploy/web-deploy.zip
```

### 2. Create Elastic Beanstalk environments

**API environment:**

```bash
cd apps/api
eb init telehealth-app-api --platform "Node.js 22" --region us-east-1
eb create telehealth-app-api-prod \
  --elb-type application \
  --instance-type t3.small \
  --database.engine postgres \
  --database.instance db.t3.micro \
  --database.user dbuser \
  --database.password <secret>
eb open
```

**Web environment:**

```bash
cd apps/web
eb init telehealth-app-web --platform "Node.js 22" --region us-east-1
eb create telehealth-app-web-prod \
  --elb-type application \
  --instance-type t3.small
eb open
```

### 3. Configure environment variables

```bash
# API
eb setenv \
  NODE_ENV=production \
  PORT=3001 \
  BETTER_AUTH_URL=https://api.yourdomain.com \
  BETTER_AUTH_SECRET=<secure-secret> \
  CORS_ORIGIN=https://app.yourdomain.com

# Web
eb setenv \
  NODE_ENV=production \
  PORT=3000 \
  NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### 4. Deploy

```bash
# Upload API zip
cd apps/api
eb deploy --staged

# Upload Web zip
cd apps/web
eb deploy --staged
```

## Alternative: AWS CDK (Infrastructure as Code)

### API Lambda (NestJS as serverless function)

```bash
npm install -g aws-cdk
cdk init app --language=typescript
```

The NestJS API can run as a Lambda function:

```typescript
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import express from "express";
import { Handler } from "aws-lambda";
import serverlessExpress from "@codegenie/serverless-express";

let cachedServer: Handler;

export const handler: Handler = async (event, context) => {
  if (!cachedServer) {
    const expressApp = express();
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );
    app.enableCors();
    await app.init();
    cachedServer = serverlessExpress({ app: expressApp });
  }
  return cachedServer(event, context);
};
```

### Database — RDS PostgreSQL

```bash
aws rds create-db-instance \
  --db-instance-identifier telehealth-app-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username dbuser \
  --master-user-password <secret> \
  --allocated-storage 20
```

## CloudFront + Domain

```bash
# Create CloudFront distribution pointing to EB ALB
aws cloudfront create-distribution \
  --origin-domain-name <eb-alb>.elasticbeanstalk.com \
  --default-root-object /

# Then set Route 53 alias record:
#   api.yourdomain.com → CloudFront
#   app.yourdomain.com → CloudFront
```

## Monitoring

- **CloudWatch Logs** — logs from EB environments
- **Enhanced Health** — enabled via `.ebextensions/01-environment.config`
- **RDS Performance Insights** — for database monitoring

## Troubleshooting

| Issue                                     | Fix                                            |
| ----------------------------------------- | ---------------------------------------------- |
| `Cannot find module '@generated/...'`     | Rebuild with `pnpm run build` — 
`tsc-alias` resolves `@generated/` to relative paths in the built output |
| EB not picking up new version             | Run `eb deploy --staged`                       |
| Next.js cannot resolve workspace packages | Rebuild with `pnpm run build` before packaging |

---

_This deployment uses **zero Docker** — apps run directly on Amazon Linux 2023 via the Node.js platform._
