# AWS Deployment Guide — Telehealth App (Full Stack)

Complete guide for deploying the entire telehealth application on AWS — no external services like Vercel.

## Architecture

```
                    ┌─────────────────────────────────────────┐
                    │              AWS CLOUD                   │
                    ├─────────────────────────────────────────┤
                    │                                         │
   Users ──→  Route 53 (DNS)                                 │
                    │                                         │
                    ▼                                         │
              CloudFront (CDN + SSL)                         │
                    │                                         │
                    ▼                                         │
                    ALB (Load Balancer)                       │
                    │                                         │
                    ▼                                         │
            ┌───────────────┐                                │
            │  EB (Docker)  │                                │
            │  ┌─────────┐  │                                │
            │  │  Nginx  │  │                                │
            │  └────┬────┘  │                                │
            │       │       │                                │
            │  ┌────┴────┐  │                                │
            │  │         │  │                                │
            │  ▼         ▼  │                                │
            │ API        Web│                                │
            │ :3001     :3000│                               │
            └───────────────┘                                │
                    │                                        │
         ┌─────────┼─────────┐                              │
         │         │         │                              │
         ▼         ▼         ▼                              │
    RDS PostgreSQL  S3    SES (email)                       │
    (encrypted)  (ePHI)                                    │
                    │                                        │
                    └─────────────────────────────────────────┘
```

## Services & Costs

| Service | Specification | Monthly Cost |
|---------|---------------|--------------|
| **EB (Docker)** | t3.small | ~$15 |
| **RDS PostgreSQL** | db.t3.medium, 20GB, Multi-AZ | ~$30 |
| **ALB** | Application Load Balancer | ~$10 |
| **S3** | ePHI storage (< 5GB) | ~$1 |
| **CloudFront** | CDN (< 50GB transfer) | ~$5 |
| **SES** | Email (< 3,000/mo) | Free tier |
| **Route 53** | DNS | ~$1 |
| **ECR** | Container registry | Free tier |
| **Total** | | **~$60-80/month** |

## Prerequisites

```bash
# Install required tools
npm install -g pnpm
pip install awsebcli

# Configure AWS
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-1), Output (json)

# Verify installation
aws sts get-caller-identity
eb --version
docker --version
```

## Quick Deploy (Automated)

```bash
# Clone and navigate to project
cd telehealth-app

# Run automated deployment
chmod +x scripts/deploy-aws.sh
./scripts/deploy-aws.sh
```

The script will:
1. Create S3 bucket for file storage
2. Set up SSM parameters for secrets
3. Build and push Docker images (API, Web, Nginx)
4. Deploy to Elastic Beanstalk
5. Verify deployment

## Manual Deployment

### Step 1: Create S3 Bucket

```bash
aws s3api create-bucket --bucket telehealth-ephil-uploads --region us-east-1

aws s3api put-bucket-encryption --bucket telehealth-ephil-uploads \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"aws:kms"}}]}'

aws s3api put-public-access-block --bucket telehealth-ephil-uploads \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

### Step 2: Create RDS Database

```bash
aws rds create-db-instance \
  --db-instance-identifier telehealth-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 16 \
  --master-username telehealth_admin \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 20 \
  --storage-type gp3 \
  --storage-encrypted \
  --multi-az \
  --publicly-accessible false \
  --backup-retention-period 7
```

### Step 3: Setup Secrets (SSM Parameter Store)

```bash
# Generate secret
BETTER_AUTH_SECRET=$(openssl rand -base64 32)

# Create parameters
aws ssm put-parameter --name "/telehealth/DATABASE_URL" --value "postgresql://..." --type "SecureString"
aws ssm put-parameter --name "/telehealth/BETTER_AUTH_SECRET" --value "$BETTER_AUTH_SECRET" --type "SecureString"
aws ssm put-parameter --name "/telehealth/BETTER_AUTH_URL" --value "https://api.tele-health.app" --type "String"
aws ssm put-parameter --name "/telehealth/CORS_ORIGIN" --value "https://tele-health.app" --type "String"
```

### Step 4: Build & Push Docker Images

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 341738837383.dkr.ecr.us-east-1.amazonaws.com

# Build all images
docker build -t telehealth-api .
docker build -t telehealth-web -f apps/web/Dockerfile .
docker build -t telehealth-nginx -f proxy/Dockerfile proxy/

# Tag and push
ECR="341738837383.dkr.ecr.us-east-1.amazonaws.com"
docker tag telehealth-api:latest $ECR/telehealth-api:latest
docker tag telehealth-web:latest $ECR/telehealth-web:latest
docker tag telehealth-nginx:latest $ECR/telehealth-nginx:latest

docker push $ECR/telehealth-api:latest
docker push $ECR/telehealth-web:latest
docker push $ECR/telehealth-nginx:latest
```

### Step 5: Deploy to Elastic Beanstalk

```bash
# Initialize (first time only)
eb init telehealth-app --platform docker --region us-east-1

# Set environment variables
eb setenv \
  ECR_REGISTRY=341738837383.dkr.ecr.us-east-1.amazonaws.com \
  BETTER_AUTH_URL=https://api.tele-health.app \
  BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET \
  DATABASE_URL="postgresql://..." \
  CORS_ORIGIN="https://tele-health.app" \
  COOKIE_DOMAIN=".tele-health.app" \
  EMAIL_PROVIDER=ses \
  AWS_REGION=us-east-1 \
  S3_BUCKET=telehealth-ephil-uploads

# Deploy
eb deploy
```

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `BETTER_AUTH_URL` | **CRITICAL** - Production API URL | ✅ |
| `BETTER_AUTH_SECRET` | Session encryption key | ✅ |
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `CORS_ORIGIN` | Allowed frontend domains | ✅ |
| `COOKIE_DOMAIN` | Cross-subdomain cookies | ✅ |
| `EMAIL_PROVIDER` | `ses` or `gmail` | ✅ |
| `SMTP_ENDPOINT` | SES SMTP host | If SES |
| `SMTP_USER` | SMTP username | ✅ |
| `SMTP_PASS` | SMTP password | ✅ |
| `S3_BUCKET` | File storage bucket | ✅ |
| `AWS_REGION` | AWS region | ✅ |
| `LIVEKIT_URL` | Video call server | For video |
| `LIVEKIT_API_KEY` | LiveKit API key | For video |
| `LIVEKIT_API_SECRET` | LiveKit secret | For video |

## ⚠️ Critical Configuration

### Email Verification Links

**This was the bug that caused your rejection!**

If `BETTER_AUTH_URL` is not set correctly, email verification links will be broken.

```
❌ WRONG:  BETTER_AUTH_URL=http://localhost:3001
✅ CORRECT: BETTER_AUTH_URL=https://api.tele-health.app
```

### Cross-Domain Cookies

For authentication to work between `tele-health.app` and `api.tele-health.app`:

```
COOKIE_DOMAIN=.tele-health.app  # Note the leading dot!
```

## Monitoring & Debugging

```bash
# Check environment status
eb status

# View health report
eb health

# Tail logs
eb logs

# SSH into instance
eb ssh

# Print all environment variables
eb printenv

# Test API health
curl -s https://api.tele-health.app/
```

## Troubleshooting

### Email links not working
1. Check `BETTER_AUTH_URL` = `https://api.tele-health.app`
2. Verify SES domain is verified
3. Check EB environment: `eb printenv | grep BETTER`

### CORS errors
1. Verify `CORS_ORIGIN` includes `https://tele-health.app`
2. Check API logs for rejected origins

### Database connection failed
1. Check RDS security group allows EB
2. Verify `DATABASE_URL` format
3. Ensure RDS and EB are in same VPC

### 502 Bad Gateway
1. Check container health: `eb health`
2. View application logs: `eb logs`
3. SSH and check containers: `eb ssh` → `docker ps`

## Security Checklist

- [ ] RDS encryption enabled
- [ ] S3 bucket encryption enabled
- [ ] S3 public access blocked
- [ ] Secrets in SSM (not in code)
- [ ] IAM roles for EB (not access keys)
- [ ] HTTPS enforced (ALB + CloudFront)
- [ ] Security groups restrictive
- [ ] SES domain verified with DKIM
- [ ] `BETTER_AUTH_URL` set correctly

## Redeployment

When you push changes to main:

```bash
# Build and push new images
docker build -t telehealth-api .
docker build -t telehealth-web -f apps/web/Dockerfile .

ECR="341738837383.dkr.ecr.us-east-1.amazonaws.com"
docker tag telehealth-api:latest $ECR/telehealth-api:latest
docker tag telehealth-web:latest $ECR/telehealth-web:latest
docker push $ECR/telehealth-api:latest
docker push $ECR/telehealth-web:latest

# Deploy
eb deploy
```

Or use the automated script:
```bash
./scripts/deploy-aws.sh
```
