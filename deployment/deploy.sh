#!/bin/bash

# Nebula Lambda Deployment Script (Linux/macOS)
set -e # Exit on error

echo -e "\033[0;36m🚀 Starting Nebula Deployment to AWS Lambda...\033[0m"

# 1. Configuration
AWS_REGION="ap-south-1"
PROJECT_NAME="nebula-multicloud"
DB_PASSWORD="trialForNebula"

# 2. Step One: Create ECR Repository
echo -e "\033[0;33m🏗️ Stage 1: Creating ECR Repository...\033[0m"
ROOT_DIR=$(pwd)
cd terraform/lambda_deploy
terraform init
terraform apply -target aws_ecr_repository.backend -target aws_s3_bucket.frontend -var "db_password=$DB_PASSWORD" -auto-approve
ECR_REPO=$(terraform output -raw ecr_repository_url)
cd "$ROOT_DIR"

# 3. Stage 2: Build and Push Backend Image (Forcing Legacy Format)
echo -e "\033[0;33m🐳 Stage 2: Building & Pushing Backend Image...\033[0m"
cd backend
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin "$ECR_REPO"

# Use buildx for AWS compatibility
docker buildx build --platform linux/amd64 -t "$ECR_REPO:latest" --provenance=false --push -f Dockerfile.lambda .
cd "$ROOT_DIR"

# 4. Stage 3: Create Backend Infrastructure (Lambda)
echo -e "\033[0;33m🏗️ Stage 3: Deploying Backend Infrastructure...\033[0m"
cd terraform/lambda_deploy
terraform apply -target aws_lambda_function.api -target aws_lambda_function_url.api_url -var "db_password=$DB_PASSWORD" -auto-approve
API_URL=$(terraform output -raw api_endpoint)
cd "$ROOT_DIR"

# 5. Stage 4: Build Frontend
echo -e "\033[0;33m📦 Stage 4: Building Frontend with API link: $API_URL\033[0m"
cd frontend
export VITE_API_URL="$API_URL"
npm install
npm run build
cd "$ROOT_DIR"

# 6. Stage 5: Finalize Infrastructure
echo -e "\033[0;33m🌐 Stage 5: Uploading Frontend & Finalizing CDN...\033[0m"
cd terraform/lambda_deploy
terraform apply -var "db_password=$DB_PASSWORD" -auto-approve
S3_BUCKET=$(terraform output -raw s3_bucket_name)
CDN_URL=$(terraform output -raw cloudfront_url)
cd "$ROOT_DIR"

echo -e "\033[0;33m📡 Syncing files to S3...\033[0m"
aws s3 sync frontend/dist "s3://$S3_BUCKET" --delete

echo -e "\n\033[0;32m✅ Deployment Complete!\033[0m"
echo -e "🌍 Frontend: https://$CDN_URL"
echo -e "⚙️ Backend: $API_URL"
