#!/usr/bin/env bash
set -euo pipefail

# ── RDS PostgreSQL Setup for Telehealth App ──
# Usage: ./scripts/ec2-rds.sh [create|status|connect]

REGION="us-east-1"
DB_IDENTIFIER="telehealth-db"
DB_CLASS="db.t3.micro"
DB_ENGINE="postgres"
DB_USER="telehealth"
DB_PASSWORD="${DB_PASSWORD:?Set DB_PASSWORD environment variable}"
DB_NAME="telehealth"
VPC_SECURITY_GROUP="telehealth-nestjs-sg"

create_rds() {
  echo "→ Creating RDS PostgreSQL instance..."

  # Get VPC security group ID
  SG_ID=$(aws ec2 describe-security-groups \
    --group-names "$VPC_SECURITY_GROUP" \
    --region "$REGION" \
    --query "SecurityGroups[*].GroupId" \
    --output text)

  if [[ -z "$SG_ID" ]]; then
    echo "   ✗ Security group '$VPC_SECURITY_GROUP' not found. Run ec2-deploy.sh first."
    exit 1
  fi

  # Check if DB already exists
  if aws rds describe-db-instances --db-instance-identifier "$DB_IDENTIFIER" --region "$REGION" &>/dev/null; then
    echo "   ✓ RDS instance already exists"
    show_status
    return
  fi

  # Create DB subnet group
  echo "   → Creating DB subnet group..."
  SUBNET_IDS=$(aws ec2 describe-subnets \
    --region "$REGION" \
    --query "Subnets[*].SubnetId" \
    --output text | tr '\t' ',')

  aws rds create-db-subnet-group \
    --db-subnet-group-name telehealth-subnet-group \
    --db-subnet-group-description "Subnet group for telehealth app" \
    --subnet-ids $(echo "$SUBNET_IDS" | tr ',' ' ') \
    --region "$REGION" 2>/dev/null || true

  # Create RDS instance
  echo "   → Creating PostgreSQL instance..."
  aws rds create-db-instance \
    --db-instance-identifier "$DB_IDENTIFIER" \
    --db-instance-class "$DB_CLASS" \
    --engine "$DB_ENGINE" \
    --engine-version "16" \
    --master-username "$DB_USER" \
    --master-user-password "$DB_PASSWORD" \
    --allocated-storage 20 \
    --storage-type gp3 \
    --storage-encrypted \
    --db-name "$DB_NAME" \
    --vpc-security-group-ids "$SG_ID" \
    --db-subnet-group-name telehealth-subnet-group \
    --backup-retention-period 7 \
    --multi-az \
    --region "$REGION" \
    --tags "Key=Name,Value=telehealth-database"

  echo "   → Waiting for RDS instance to be available..."
  aws rds wait db-instance-available --db-instance-identifier "$DB_IDENTIFIER" --region "$REGION"

  show_status
}

show_status() {
  echo "→ RDS Instance Status:"
  aws rds describe-db-instances \
    --db-instance-identifier "$DB_IDENTIFIER" \
    --region "$REGION" \
    --query "DBInstances[*].[DBInstanceIdentifier,DBInstanceStatus,Endpoint.Address,Endpoint.Port,MasterUsername,DBName]" \
    --output table
}

connect_info() {
  echo "→ Connection Information:"
  ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier "$DB_IDENTIFIER" \
    --region "$REGION" \
    --query "DBInstances[*].Endpoint.Address" \
    --output text)

  PORT=$(aws rds describe-db-instances \
    --db-instance-identifier "$DB_IDENTIFIER" \
    --region "$REGION" \
    --query "DBInstances[*].Endpoint.Port" \
    --output text)

  echo "   Host: $ENDPOINT"
  echo "   Port: $PORT"
  echo "   User: $DB_USER"
  echo "   Database: $DB_NAME"
  echo ""
  echo "   DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$ENDPOINT:$PORT/$DB_NAME"
}

case "${1:-status}" in
  create)
    create_rds
    ;;
  status)
    show_status
    ;;
  connect)
    connect_info
    ;;
  *)
    echo "Usage: $0 [create|status|connect]"
    exit 1
    ;;
esac
