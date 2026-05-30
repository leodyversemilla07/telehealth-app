#!/usr/bin/env bash
set -euo pipefail

# ── EC2 Deployment Script for NestJS API ──
# Usage: ./scripts/ec2-deploy.sh [create|deploy|setup|all]

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEY_NAME="telehealth-key"
SECURITY_GROUP="telehealth-nestjs-sg"
INSTANCE_NAME="telehealth-nestjs-api"
AMI_ID="ami-0c55b159cbfafe1f0"  # Ubuntu 22.04 us-east-1
INSTANCE_TYPE="t3.small"
REGION="us-east-1"

create_key_pair() {
  echo "→ Creating key pair..."
  if aws ec2 describe-key-pairs --key-names "$KEY_NAME" --region "$REGION" &>/dev/null; then
    echo "   ✓ Key pair '$KEY_NAME' already exists"
  else
    aws ec2 create-key-pair \
      --key-name "$KEY_NAME" \
      --region "$REGION" \
      --query 'KeyMaterial' \
      --output text > "$ROOT/$KEY_NAME.pem"
    chmod 400 "$ROOT/$KEY_NAME.pem"
    echo "   ✓ Key pair saved to $ROOT/$KEY_NAME.pem"
  fi
}

create_security_group() {
  echo "→ Creating security group..."
  if aws ec2 describe-security-groups --group-names "$SECURITY_GROUP" --region "$REGION" &>/dev/null; then
    echo "   ✓ Security group '$SECURITY_GROUP' already exists"
  else
    SG_ID=$(aws ec2 create-security-group \
      --group-name "$SECURITY_GROUP" \
      --description "Security group for NestJS API" \
      --region "$REGION" \
      --query 'GroupId' \
      --output text)
    echo "   ✓ Created security group: $SG_ID"

    # Allow SSH
    aws ec2 authorize-security-group-ingress \
      --group-id "$SG_ID" \
      --protocol tcp \
      --port 22 \
      --cidr 0.0.0.0/0 \
      --region "$REGION"

    # Allow HTTP
    aws ec2 authorize-security-group-ingress \
      --group-id "$SG_ID" \
      --protocol tcp \
      --port 80 \
      --cidr 0.0.0.0/0 \
      --region "$REGION"

    # Allow HTTPS
    aws ec2 authorize-security-group-ingress \
      --group-id "$SG_ID" \
      --protocol tcp \
      --port 443 \
      --cidr 0.0.0.0/0 \
      --region "$REGION"

    # Allow NestJS port
    aws ec2 authorize-security-group-ingress \
      --group-id "$SG_ID" \
      --protocol tcp \
      --port 3001 \
      --cidr 0.0.0.0/0 \
      --region "$REGION"

    echo "   ✓ Security group rules configured"
  fi
}

launch_instance() {
  echo "→ Launching EC2 instance..."

  # Check if instance already exists
  EXISTING_ID=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=$INSTANCE_NAME" "Name=instance-state-name,Values=running" \
    --region "$REGION" \
    --query "Reservations[*].Instances[*].InstanceId" \
    --output text)

  if [[ -n "$EXISTING_ID" ]]; then
    echo "   ✓ Instance already running: $EXISTING_ID"
    PUBLIC_IP=$(aws ec2 describe-instances \
      --instance-ids "$EXISTING_ID" \
      --region "$REGION" \
      --query "Reservations[*].Instances[*].PublicIpAddress" \
      --output text)
    echo "   ✓ Public IP: $PUBLIC_IP"
    return
  fi

  INSTANCE_ID=$(aws ec2 run-instances \
    --image-id "$AMI_ID" \
    --instance-type "$INSTANCE_TYPE" \
    --key-name "$KEY_NAME" \
    --security-groups "$SECURITY_GROUP" \
    --region "$REGION" \
    --count 1 \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
    --query "Instances[*].InstanceId" \
    --output text)

  echo "   ✓ Instance launching: $INSTANCE_ID"

  # Wait for instance to be running
  echo "   → Waiting for instance to start..."
  aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$REGION"

  # Get public IP
  PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --region "$REGION" \
    --query "Reservations[*].Instances[*].PublicIpAddress" \
    --output text)

  echo "   ✓ Instance running: $PUBLIC_IP"
}

setup_instance() {
  echo "→ Setting up NestJS environment on instance..."

  PUBLIC_IP=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=$INSTANCE_NAME" "Name=instance-state-name,Values=running" \
    --region "$REGION" \
    --query "Reservations[*].Instances[*].PublicIpAddress" \
    --output text)

  if [[ -z "$PUBLIC_IP" ]]; then
    echo "   ✗ No running instance found. Run './scripts/ec2-deploy.sh create' first."
    exit 1
  fi

  # Create remote setup script
  cat > /tmp/setup-remote.sh << 'REMOTE_SCRIPT'
#!/bin/bash
set -euo pipefail

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install build essentials
sudo apt install -y build-essential git

# Install PM2 globally
sudo npm install -g pm2

# Install pnpm
sudo npm install -g pnpm

# Create app directory
sudo mkdir -p /var/app
sudo chown $(whoami) /var/app

echo "✓ Setup complete!"
echo "Node: $(node -v)"
echo "NPM: $(npm -v)"
echo "PM2: $(pm2 -v)"
REMOTE_SCRIPT

  scp -i "$ROOT/$KEY_NAME.pem" -o StrictHostKeyChecking=no /tmp/setup-remote.sh ubuntu@"$PUBLIC_IP":/tmp/
  ssh -i "$ROOT/$KEY_NAME.pem" -o StrictHostKeyChecking=no ubuntu@"$PUBLIC_IP" "bash /tmp/setup-remote.sh"

  echo "   ✓ Instance setup complete"
}

deploy_api() {
  echo "→ Deploying NestJS API..."

  PUBLIC_IP=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=$INSTANCE_NAME" "Name=instance-state-name,Values=running" \
    --region "$REGION" \
    --query "Reservations[*].Instances[*].PublicIpAddress" \
    --output text)

  if [[ -z "$PUBLIC_IP" ]]; then
    echo "   ✗ No running instance found. Run './scripts/ec2-deploy.sh create' first."
    exit 1
  fi

  # Build the API
  echo "   → Building API..."
  cd "$ROOT"
  pnpm run build

  # Package the API
  echo "   → Packaging API..."
  cd "$ROOT"
  bash scripts/deploy.sh api

  # Upload to instance
  echo "   → Uploading to instance..."
  scp -i "$ROOT/$KEY_NAME.pem" -o StrictHostKeyChecking=no \
    "$ROOT/dist/deploy/api-deploy.zip" ubuntu@"$PUBLIC_IP":/tmp/

  # Deploy on instance
  cat > /tmp/deploy-remote.sh << 'REMOTE_SCRIPT'
#!/bin/bash
set -euo pipefail

APP_DIR="/var/app/current"
DEPLOY_ZIP="/tmp/api-deploy.zip"

# Create app directory
sudo mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Extract deployment
sudo unzip -o "$DEPLOY_ZIP"
sudo chown -R $(whoami) .

# Install production dependencies
npm install --production

# Run Prisma migrations (if DATABASE_URL is set)
if [[ -n "${DATABASE_URL:-}" ]]; then
  npx prisma generate
  npx prisma migrate deploy
fi

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'ECOSYSTEM'
module.exports = {
  apps: [{
    name: 'telehealth-api',
    script: 'apps/api/dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/telehealth-api-error.log',
    out_file: '/var/log/telehealth-api-out.log',
    merge_logs: true,
    max_memory_restart: '1G'
  }]
};
ECOSYSTEM

# Start/restart with PM2
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -1 | sudo bash

echo "✓ API deployed and running!"
REMOTE_SCRIPT

  scp -i "$ROOT/$KEY_NAME.pem" -o StrictHostKeyChecking=no /tmp/deploy-remote.sh ubuntu@"$PUBLIC_IP":/tmp/
  ssh -i "$ROOT/$KEY_NAME.pem" -o StrictHostKeyChecking=no ubuntu@"$PUBLIC_IP" "bash /tmp/deploy-remote.sh"

  echo "   ✓ API deployed successfully!"
  echo "   → API available at: http://$PUBLIC_IP:3001"
  echo "   → Health check: http://$PUBLIC_IP:3001/api"
}

set_env() {
  echo "→ Setting environment variables..."

  PUBLIC_IP=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=$INSTANCE_NAME" "Name=instance-state-name,Values=running" \
    --region "$REGION" \
    --query "Reservations[*].Instances[*].PublicIpAddress" \
    --output text)

  if [[ -z "$PUBLIC_IP" ]]; then
    echo "   ✗ No running instance found."
    exit 1
  fi

  # Create .env file on instance
  cat > /tmp/env-setup.sh << 'REMOTE_SCRIPT'
#!/bin/bash
APP_DIR="/var/app/current"
ENV_FILE="$APP_DIR/.env"

# Create .env file
sudo tee "$ENV_FILE" > /dev/null << 'ENV_CONTENT'
NODE_ENV=production
PORT=3001
# DATABASE_URL=postgresql://user:password@host:5432/dbname
# BETTER_AUTH_URL=https://api.yourdomain.com
# BETTER_AUTH_SECRET=your-secret-here
# CORS_ORIGIN=https://app.yourdomain.com
# LIVEKIT_URL=wss://your-livekit-server
# LIVEKIT_API_KEY=your-key
# LIVEKIT_API_SECRET=your-secret
ENV_CONTENT

sudo chown $(whoami) "$ENV_FILE"
chmod 600 "$ENV_FILE"

echo "✓ .env file created at $ENV_FILE"
echo "  Edit it with: nano $ENV_FILE"
REMOTE_SCRIPT

  scp -i "$ROOT/$KEY_NAME.pem" -o StrictHostKeyChecking=no /tmp/env-setup.sh ubuntu@"$PUBLIC_IP":/tmp/
  ssh -i "$ROOT/$KEY_NAME.pem" -o StrictHostKeyChecking=no ubuntu@"$PUBLIC_IP" "bash /tmp/env-setup.sh"

  echo "   ✓ Environment setup complete"
}

show_status() {
  echo "→ EC2 Instance Status:"
  aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=$INSTANCE_NAME" \
    --region "$REGION" \
    --query "Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress,InstanceType]" \
    --output table
}

# Main script
case "${1:-all}" in
  create)
    create_key_pair
    create_security_group
    launch_instance
    ;;
  setup)
    setup_instance
    ;;
  deploy)
    deploy_api
    ;;
  env)
    set_env
    ;;
  status)
    show_status
    ;;
  all)
    create_key_pair
    create_security_group
    launch_instance
    setup_instance
    deploy_api
    set_env
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "  ✓ Deployment Complete!"
    echo "═══════════════════════════════════════════════════════════════"
    show_status
    echo ""
    echo "  SSH: ssh -i $KEY_NAME.pem ubuntu@<PUBLIC_IP>"
    echo "  API: http://<PUBLIC_IP>:3001/api"
    echo ""
    echo "  Next steps:"
    echo "  1. Set up RDS PostgreSQL database"
    echo "  2. Edit .env on instance with database credentials"
    echo "  3. Restart API: ssh and run 'pm2 restart telehealth-api'"
    echo "═══════════════════════════════════════════════════════════════"
    ;;
  *)
    echo "Usage: $0 [create|setup|deploy|env|status|all]"
    exit 1
    ;;
esac
