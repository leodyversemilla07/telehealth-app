#!/bin/bash
set -e

# AWS Deployment Script for Next.js + NestJS Monorepo

# Configuration
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text)}
AWS_REGION=${AWS_REGION:-us-east-1}
ECR_API_REPO=next-monorepo-api
ECR_WEB_REPO=next-monorepo-web
CLUSTER_NAME=next-monorepo-cluster
SERVICE_API=api
SERVICE_WEB=web

echo "Building and pushing Docker images..."

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Build and push API
docker build -t ${ECR_API_REPO}:latest -f apps/api/Dockerfile .
docker tag ${ECR_API_REPO}:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_API_REPO}:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_API_REPO}:latest

# Build and push Web
docker build -t ${ECR_WEB_REPO}:latest -f apps/web/Dockerfile .
docker tag ${ECR_WEB_REPO}:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_WEB_REPO}:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_WEB_REPO}:latest

echo "Updating ECS services..."
aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_API --force-new-deployment
aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_WEB --force-new-deployment

echo "Deployment complete!"