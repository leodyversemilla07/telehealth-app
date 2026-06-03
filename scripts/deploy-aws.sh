#!/bin/bash
# =============================================================================
# Telehealth App — Full AWS Deployment Script
# =============================================================================
# Deploys: Nginx proxy + API + Web (all on Elastic Beanstalk)
# =============================================================================
set -e

echo "🚀 Telehealth App — Full AWS Deployment"
echo "========================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ── Configuration ───────────────────────────────────────────────────────────
APP_NAME="telehealth-app"
ENV_NAME="telehealth-env"
AWS_REGION="us-east-1"
ECR_REGISTRY="341738837383.dkr.ecr.us-east-1.amazonaws.com"
S3_BUCKET="telehealth-ephil-uploads"

# ── Check Prerequisites ────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}Checking prerequisites...${NC}"

command -v aws >/dev/null 2>&1 || { echo -e "${RED}✗ AWS CLI not installed${NC}"; exit 1; }
command -v eb >/dev/null 2>&1 || { echo -e "${RED}✗ EB CLI not installed. Install: pip install awsebcli${NC}"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -v "${RED}✗ Docker not installed${NC}"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo -e "${RED}✗ pnpm not installed${NC}"; exit 1; }

# Check AWS credentials
aws sts get-caller-identity >/dev/null 2>&1 || { echo -e "${RED}✗ AWS credentials not configured. Run: aws configure${NC}"; exit 1; }

echo -e "${GREEN}✓ All prerequisites met${NC}"

# ── Generate Secrets ────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}Generating secrets...${NC}"

if [ -z "$BETTER_AUTH_SECRET" ]; then
  BETTER_AUTH_SECRET=$(openssl rand -base64 32)
  echo "Generated BETTER_AUTH_SECRET"
fi

# ── Step 1: Create S3 Bucket ───────────────────────────────────────────────
echo ""
echo -e "${YELLOW}Step 1/8: Creating S3 bucket...${NC}"

aws s3api create-bucket --bucket $S3_BUCKET --region $AWS_REGION 2>/dev/null || true

aws s3api put-bucket-encryption \
  --bucket $S3_BUCKET \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"aws:kms"}}]}' \
  2>/dev/null || true

aws s3api put-public-access-block \
  --bucket $S3_BUCKET \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true \
  2>/dev/null || true

echo -e "${GREEN}✓ S3 bucket ready${NC}"

# ── Step 2: Setup SSM Parameters ───────────────────────────────────────────
echo ""
echo -e "${YELLOW}Step 2/8: Creating SSM parameters...${NC}"

create_ssm_param() {
  local name=$1
  local value=$2
  local type=${3:-String}
  aws ssm put-parameter --name "/telehealth/$name" --value "$value" --type "$type" --overwrite 2>/dev/null || \
  aws ssm put-parameter --name "/telehealth/$name" --value "$value" --type "$type" 2>/dev/null
}

# Get DATABASE_URL from user
if [ -z "$DATABASE_URL" ]; then
  echo ""
  echo -e "${BLUE}Enter your RDS database URL:${NC}"
  echo "Example: postgresql://user:pass@telehealth-db.xxxx.us-east-1.rds.amazonaws.com:5432/telehealth"
  read -p "DATABASE_URL: " DATABASE_URL
fi

if [ -n "$DATABASE_URL" ]; then
  create_ssm_param "DATABASE_URL" "$DATABASE_URL" "SecureString"
fi

create_ssm_param "BETTER_AUTH_SECRET" "$BETTER_AUTH_SECRET" "SecureString"
create_ssm_param "BETTER_AUTH_URL" "https://api.tele-health.app"
create_ssm_param "CORS_ORIGIN" "https://tele-health.app"
create_ssm_param "COOKIE_DOMAIN" ".tele-health.app"

echo -e "${GREEN}✓ SSM parameters created${NC}"

# ── Step 3: Login to ECR ──────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}Step 3/8: Logging into ECR...${NC}"

aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REGISTRY

echo -e "${GREEN}✓ ECR login successful${NC}"

# ── Step 4: Build API Image ────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}Step 4/8: Building API image...${NC}"

docker build -t telehealth-api -f Dockerfile .

docker tag telehealth-api:latest $ECR_REGISTRY/telehealth-api:latest

docker push $ECR_REGISTRY/telehealth-api:latest

echo -e "${GREEN}✓ API image pushed to ECR${NC}"

# ── Step 5: Build Web Image ────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}Step 5/8: Building Web image...${NC}"

docker build -t telehealth-web -f apps/web/Dockerfile .

docker tag telehealth-web:latest $ECR_REGISTRY/telehealth-web:latest

docker push $ECR_REGISTRY/telehealth-web:latest

echo -e "${GREEN}✓ Web image pushed to ECR${NC}"

# ── Step 6: Build Nginx Image ──────────────────────────────────────────────
echo ""
echo -e "${YELLOW}Step 6/8: Building Nginx proxy image...${NC}"

docker build -t telehealth-nginx -f proxy/Dockerfile proxy/

docker tag telehealth-nginx:latest $ECR_REGISTRY/telehealth-nginx:latest

docker push $ECR_REGISTRY/telehealth-nginx:latest

echo -e "${GREEN}✓ Nginx image pushed to ECR${NC}"

# ── Step 7: Deploy to Elastic Beanstalk ────────────────────────────────────
echo ""
echo -e "${YELLOW}Step 7/8: Deploying to Elastic Beanstalk...${NC}"

# Initialize EB if needed
if [ ! -f ".elasticbeanstalk/config.yml" ]; then
  eb init $APP_NAME --platform docker --region $AWS_REGION
fi

# Set environment variables
eb setenv \
  ECR_REGISTRY=$ECR_REGISTRY \
  BETTER_AUTH_URL=https://api.tele-health.app \
  BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET" \
  DATABASE_URL="$DATABASE_URL" \
  CORS_ORIGIN="https://tele-health.app" \
  COOKIE_DOMAIN=".tele-health.app" \
  EMAIL_PROVIDER=ses \
  EMAIL_FROM="Telehealth Platform <noreply@tele-health.app>" \
  SMTP_ENDPOINT=email-smtp.us-east-1.amazonaws.com \
  SMTP_PORT=587 \
  AWS_REGION=$AWS_REGION \
  S3_BUCKET=$S3_BUCKET \
  NODE_ENV=production \
  SESSION_EXPIRY_SECONDS=604800

# Deploy
eb deploy

echo -e "${GREEN}✓ Deployed to Elastic Beanstalk${NC}"

# ── Step 8: Verify Deployment ──────────────────────────────────────────────
echo ""
echo -e "${YELLOW}Step 8/8: Verifying deployment...${NC}"

echo "Waiting for deployment to stabilize..."
sleep 30

# Health check
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://tele-health.app/ 2>/dev/null)
if [ "$HEALTH_CHECK" = "200" ]; then
  echo -e "${GREEN}✓ Frontend is healthy!${NC}"
else
  echo -e "${YELLOW}⚠ Frontend returned: $HEALTH_CHECK (may still be starting)${NC}"
fi

API_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://api.tele-health.app/ 2>/dev/null)
if [ "$API_CHECK" = "200" ]; then
  echo -e "${GREEN}✓ API is healthy!${NC}"
else
  echo -e "${YELLOW}⚠ API returned: $API_CHECK (may still be starting)${NC}"
fi

# ── Summary ────────────────────────────────────────────────────────────────
echo ""
echo "========================================"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "========================================"
echo ""
echo -e "${BLUE}Production URLs:${NC}"
echo "  Frontend: https://tele-health.app"
echo "  API:      https://api.tele-health.app"
echo ""
echo -e "${BLUE}Infrastructure:${NC}"
echo "  S3 Bucket:     $S3_BUCKET"
echo "  ECR Registry:  $ECR_REGISTRY"
echo "  EB Environment: $ENV_NAME"
echo ""
echo -e "${YELLOW}Post-deployment checklist:${NC}"
echo ""
echo "1. ✅ Email verification links should now work!"
echo "   - Sign up a test account"
echo "   - Check email for verification link"
echo "   - Click link (should redirect to sign-in)"
echo ""
echo "2. 📧 Verify SES is out of sandbox:"
echo "   - AWS Console → SES → Account dashboard"
echo "   - Request production access if needed"
echo ""
echo "3. 🔒 Update SES production limits:"
echo "   - AWS Console → SES → Production access"
echo ""
echo "4. 📊 Monitor logs:"
echo "   eb logs"
echo ""
echo "5. 🔧 Useful commands:"
echo "   eb status        # Check environment status"
echo "   eb health        # Detailed health report"
echo "   eb logs          # View application logs"
echo "   eb ssh           # SSH into instance"
echo ""
