# AWS Deployment Guide

## Architecture

- **API** - NestJS container (port 3001)
- **Web** - Next.js container (port 3000)
- **PostgreSQL** - RDS instance
- **Load Balancer** - ALB routing traffic to containers
- **ECR** - Docker image registry

## Prerequisites

1. AWS CLI configured with appropriate permissions
2. Terraform installed
3. Docker installed

## Setup

```bash
# 1. Copy environment file
cp aws/env.example aws/.env
# Edit with your values

# 2. Deploy infrastructure
cd aws/terraform
terraform init
terraform apply

# 3. Push initial images
./scripts/deploy.sh
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `AWS_ACCOUNT_ID` | Your AWS account ID |
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Stored in SSM Parameter Store |

## Security

- `BETTER_AUTH_SECRET` should be stored in AWS SSM Parameter Store
- Use IAM roles for ECS tasks
- Enable CloudWatch logging
- Configure WAF on ALB for production