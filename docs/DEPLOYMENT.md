# 🚀 Deployment Guide — Telehealth App

Complete guide for deploying the telehealth application to production.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Environment Variables](#environment-variables)
4. [Database Setup (RDS)](#database-setup)
5. [EC2 Setup (API + Web)](#ec2-setup)
6. [Nginx Configuration](#nginx-configuration)
7. [SSL Certificates](#ssl-certificates)
8. [PM2 Configuration](#pm2-configuration)
9. [Email Setup (SES)](#email-setup)
10. [File Storage (S3)](#file-storage)
11. [Domain Configuration](#domain-configuration)
12. [Monitoring & Maintenance](#monitoring)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRODUCTION ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Users ──→ Route 53 / CloudFlare ──→ EC2 Instance              │
│                                              │                   │
│                                    ┌─────────┴─────────┐       │
│                                    │      Nginx        │       │
│                                    │   (SSL + Proxy)   │       │
│                                    └─────────┬─────────┘       │
│                                              │                   │
│                         ┌────────────────────┴───────────────┐ │
│                         │                                    │ │
│                         ▼                                    ▼ │
│               tele-health.app                     api.tele-health.app │
│               (Next.js :3000)                     (NestJS :3001) │
│                         │                                    │ │
│                         └────────────────┬───────────────────┘ │
│                                          │                      │
│                                          ▼                      │
│                               ┌─────────────────┐              │
│                               │   RDS PostgreSQL │              │
│                               │   (Managed DB)   │              │
│                               └─────────────────┘              │
│                                                                  │
│   External Services:                                             │
│   ├── AWS SES (Email)                                           │
│   ├── AWS S3 (File Storage)                                     │
│   └── LiveKit (Video Calls)                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Local Machine
- [ ] AWS CLI installed and configured
- [ ] SSH key pair for EC2
- [ ] Domain name configured

### AWS Account
- [ ] EC2 instance launched (Amazon Linux 2023)
- [ ] RDS PostgreSQL instance created
- [ ] S3 bucket created for file storage
- [ ] SES verified for email sending
- [ ] Security groups configured

---

## Environment Variables

### Required Variables

```bash
# ── Database ──────────────────────────────────────────────────
DATABASE_URL=postgresql://username:password@your-rds-host:5432/telehealth

# ── Server ────────────────────────────────────────────────────
PORT=3001
NODE_ENV=production

# ── Better Auth (CRITICAL!) ──────────────────────────────────
BETTER_AUTH_URL=https://api.tele-health.app
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>

# ── CORS ──────────────────────────────────────────────────────
CORS_ORIGIN=https://tele-health.app
COOKIE_DOMAIN=.tele-health.app

# ── Email (AWS SES) ──────────────────────────────────────────
EMAIL_PROVIDER=ses
EMAIL_FROM=Telehealth Platform <noreply@tele-health.app>
SMTP_ENDPOINT=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-access-key
SMTP_PASS=your-ses-secret-key

# ── File Storage (AWS S3) ────────────────────────────────────
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET=telehealth-ephil-uploads
S3_PUBLIC_URL=https://your-cloudfront-domain.cloudfront.net

# ── Video (LiveKit) ──────────────────────────────────────────
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# ── Session ──────────────────────────────────────────────────
SESSION_EXPIRY_SECONDS=604800

# ── Web Push (VAPID) ─────────────────────────────────────────
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=mailto:admin@tele-health.app
```

### Generate BETTER_AUTH_SECRET

```bash
openssl rand -base64 32
```

---

## Database Setup

### 1. Create RDS Instance

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

### 2. Configure Security Group

Allow inbound PostgreSQL (5432) from EC2 security group:

```bash
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 5432 \
  --source-group sg-ec2-xxxxx
```

### 3. Run Migrations

```bash
# SSH into EC2
cd /home/ec2-user/telehealth-app
npx prisma migrate deploy
```

---

## EC2 Setup

### 1. Launch Instance

- **AMI:** Amazon Linux 2023
- **Instance Type:** t3.medium (2 vCPU, 4 GB RAM)
- **Key Pair:** Your SSH key
- **Security Group:** Allow ports 80, 443, 22

### 2. Connect via SSH

```bash
ssh -i your-key.pem ec2-user@your-ec2-public-ip
```

### 3. Install Dependencies

```bash
# System update
sudo yum update -y

# Node.js 22
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo yum install -y nodejs

# PM2 (process manager)
sudo npm install -g pm2

# Nginx
sudo yum install -y nginx

# Certbot (SSL)
sudo yum install -y certbot python3-certbot-nginx

# Git
sudo yum install -y git

# pnpm
sudo npm install -g pnpm
```

### 4. Clone & Build

```bash
# Clone repository
cd /home/ec2-user
git clone https://github.com/your-username/telehealth-app.git
cd telehealth-app

# Install dependencies
pnpm install

# Build API
pnpm --filter api build

# Build Web (standalone mode for production)
cd apps/web
NEXT_OUTPUT=standalone pnpm build
cd ../..
```

### 5. Setup Environment

```bash
# Create .env file
nano .env
# Paste your environment variables (see Environment Variables section)

# Copy .env to web app
cp .env apps/web/.env.local
```

---

## Nginx Configuration

### Create Config File

```bash
sudo nano /etc/nginx/conf.d/telehealth.conf
```

### Paste Configuration

```nginx
# ── Upstreams ─────────────────────────────────────────────────
upstream web_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

upstream api_backend {
    server 127.0.0.1:3001;
    keepalive 32;
}

# ── Frontend Server ───────────────────────────────────────────
server {
    listen 80;
    server_name tele-health.app www.tele-health.app;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy settings
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;

    location / {
        proxy_pass http://web_backend;
    }

    # Socket.io (WebSocket)
    location /socket.io {
        proxy_pass http://web_backend;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}

# ── API Server ────────────────────────────────────────────────
server {
    listen 80;
    server_name api.tele-health.app;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Proxy settings
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;

    location / {
        proxy_pass http://api_backend;
    }

    # Socket.io (WebSocket)
    location /socket.io {
        proxy_pass http://api_backend;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # File uploads
    client_max_body_size 10M;
}
```

### Test & Restart

```bash
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## SSL Certificates

### Install Certificates

```bash
# Frontend
sudo certbot --nginx -d tele-health.app -d www.tele-health.app

# API
sudo certbot --nginx -d api.tele-health.app
```

### Auto-Renewal

```bash
sudo systemctl enable certbot-renew.timer
sudo systemctl start certbot-renew.timer
```

### Verify Auto-Renewal

```bash
sudo certbot renew --dry-run
```

---

## PM2 Configuration

### Create Ecosystem File

```bash
nano /home/ec2-user/telehealth-app/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'telehealth-api',
      script: 'apps/api/dist/src/main.js',
      cwd: '/home/ec2-user/telehealth-app',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/home/ec2-user/logs/api-error.log',
      out_file: '/home/ec2-user/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '500M',
    },
    {
      name: 'telehealth-web',
      script: 'apps/web/.next/standalone/apps/web/server.js',
      cwd: '/home/ec2-user/telehealth-app',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
      error_file: '/home/ec2-user/logs/web-error.log',
      out_file: '/home/ec2-user/logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '300M',
    },
  ],
};
```

### Start Services

```bash
# Create logs directory
mkdir -p /home/ec2-user/logs

# Start all services
cd /home/ec2-user/telehealth-app
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save

# Setup auto-start on boot
pm2 startup
# Follow the instructions printed by the command
```

### PM2 Commands

```bash
# Status
pm2 status

# Logs
pm2 logs telehealth-api
pm2 logs telehealth-web

# Restart
pm2 restart telehealth-api
pm2 restart telehealth-web

# Stop
pm2 stop telehealth-api

# Monitor
pm2 monit

# Reload (zero-downtime)
pm2 reload telehealth-api
```

---

## Email Setup (AWS SES)

### 1. Verify Domain

```bash
aws ses verify-domain-identity --domain tele-health.app
```

Add the TXT record to your DNS.

### 2. Add DKIM Records

```bash
aws ses verify-domain-dkim --domain tele-health.app
```

Add the 3 CNAME records to your DNS.

### 3. Request Production Access

By default, SES is in sandbox mode (can only send to verified emails).

1. Go to AWS Console → SES → Account dashboard
2. Click "Request production access"
3. Fill out the form
4. Wait for approval (usually 24-48 hours)

---

## File Storage (AWS S3)

### 1. Create S3 Bucket

```bash
aws s3api create-bucket \
  --bucket telehealth-ephil-uploads \
  --region us-east-1
```

### 2. Enable Encryption

```bash
aws s3api put-bucket-encryption \
  --bucket telehealth-ephil-uploads \
  --server-side-encryption-configuration '{
    "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "aws:kms"}}]
  }'
```

### 3. Block Public Access

```bash
aws s3api put-public-access-block \
  --bucket telehealth-ephil-uploads \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

### 4. Create IAM User for S3 Access

```bash
# Create user
aws iam create-user --user-name telehealth-s3-user

# Create access key
aws iam create-access-key --user-name telehealth-s3-user

# Attach policy
aws iam put-user-policy \
  --user-name telehealth-s3-user \
  --policy-name telehealth-s3-access \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::telehealth-ephil-uploads/*"
    }]
  }'
```

---

## Domain Configuration

### Route 53 (AWS)

```bash
# Create hosted zone
aws route53 create-hosted-zone --name tele-health.app --caller-reference $(date +%s)

# Add A record for frontend (EC2 Elastic IP)
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "tele-health.app",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "YOUR_EC2_ELASTIC_IP"}]
      }
    }]
  }'

# Add A record for API (same EC2)
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.tele-health.app",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "YOUR_EC2_ELASTIC_IP"}]
      }
    }]
  }'
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Check API
curl -s https://api.tele-health.app/

# Check Frontend
curl -s https://tele-health.app/
```

### View Logs

```bash
# PM2 logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
```

### Database Backups

RDS automatically backs up your database. To restore:

```bash
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier telehealth-db \
  --target-db-instance-identifier telehealth-db-restored \
  --restore-time "2024-01-01T00:00:00Z"
```

### SSL Certificate Renewal

Certbot auto-renews. Check status:

```bash
sudo certbot certificates
```

---

## Troubleshooting

### API returns 502 Bad Gateway

```bash
# Check if API is running
pm2 status

# Check API logs
pm2 logs telehealth-api

# Restart API
pm2 restart telehealth-api
```

### Email verification links not working

```bash
# Check BETTER_AUTH_URL
echo $BETTER_AUTH_URL

# Should be: https://api.tele-health.app
# If not, update .env and restart
```

### CORS errors

```bash
# Check CORS_ORIGIN in .env
grep CORS_ORIGIN .env

# Should include: https://tele-health.app
```

### Database connection failed

```bash
# Test connection
psql $DATABASE_URL

# Check security group allows EC2
```

---

## Cost Summary

| Service | Specification | Monthly Cost |
|---------|---------------|--------------|
| **EC2** | t3.medium | ~$30 |
| **RDS** | db.t3.medium, 20GB | ~$30 |
| **S3** | < 5GB | ~$1 |
| **SES** | < 3,000 emails | ~$1 |
| **Route 53** | 1 hosted zone | ~$1 |
| **Elastic IP** | 1 static IP | ~$4 |
| **Total** | | **~$67** |

---

## Quick Reference

### Start Services
```bash
pm2 start ecosystem.config.js
pm2 save
```

### Restart Services
```bash
pm2 restart all
```

### View Status
```bash
pm2 status
```

### View Logs
```bash
pm2 logs
```

### Deploy Updates
```bash
cd /home/ec2-user/telehealth-app
git pull
pnpm install
pnpm --filter api build
cd apps/web && NEXT_OUTPUT=standalone pnpm build
cd ../..
pm2 restart all
```

---

## Support

For issues, check:
1. PM2 logs: `pm2 logs`
2. Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. API health: `curl https://api.tele-health.app/`
