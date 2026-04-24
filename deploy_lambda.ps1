# Nebula Full Project Deployment Script (Windows PowerShell)

Write-Host "🚀 Starting FULL Nebula Deployment (Lambda + Fargate)..." -ForegroundColor Cyan

# 1. Configuration
$AWS_REGION = "ap-south-1"
$PROJECT_NAME = "nebula-multicloud"
$DB_PASSWORD = "trialForNebula"

# 2. Stage 1: Create ECR Repositories (API & Worker)
Write-Host "🏗️ Stage 1: Preparing ECR Repositories..." -ForegroundColor Yellow
$ROOT_DIR = Get-Location
cd terraform/lambda_deploy
terraform init
terraform apply -target aws_ecr_repository.backend -target aws_ecr_repository.worker -target aws_s3_bucket.frontend -var "db_password=$DB_PASSWORD" -auto-approve
$ECR_REPO_API = terraform output -raw ecr_repository_url
$ECR_REPO_WORKER = "$($ECR_REPO_API.Replace('backend', 'worker'))"
cd $ROOT_DIR

# 3. Stage 2: Build and Push BOTH Images
Write-Host "🐳 Stage 2: Building & Pushing Containers..." -ForegroundColor Yellow
cd backend
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO_API

# Build API (Lambda)
Write-Host "📦 Building API Image..." -ForegroundColor Gray
docker buildx build --platform linux/amd64 -t "$ECR_REPO_API`:latest" --provenance=false --push -f Dockerfile.lambda .

# Build Worker (Fargate)
Write-Host "📦 Building Worker Image..." -ForegroundColor Gray
docker buildx build --platform linux/amd64 -t "$ECR_REPO_WORKER`:latest" --provenance=false --push -f Dockerfile.worker .
cd $ROOT_DIR

# 4. Stage 3: Deploy Backend Infrastructure (Lambda & Redis)
Write-Host "🏗️ Stage 3: Deploying Cloud Engine..." -ForegroundColor Yellow
cd terraform/lambda_deploy
# Note: This might take a few minutes for ElastiCache Redis to provision
terraform apply -target aws_elasticache_cluster.redis -target aws_lambda_function.api -target aws_lambda_function_url.api_url -var "db_password=$DB_PASSWORD" -auto-approve
$API_URL = terraform output -raw api_endpoint
cd $ROOT_DIR

# 5. Stage 4: Build Frontend
Write-Host "📦 Stage 4: Building Frontend..." -ForegroundColor Yellow
cd frontend
$env:VITE_API_URL = "$API_URL"
npm run build
cd $ROOT_DIR

# 6. Stage 5: Finalize Infrastructure (Fargate + CDN)
Write-Host "🌐 Stage 5: Finalizing Everything..." -ForegroundColor Yellow
cd terraform/lambda_deploy
terraform apply -var "db_password=$DB_PASSWORD" -auto-approve
$S3_BUCKET = terraform output -raw s3_bucket_name
$CDN_URL = terraform output -raw cloudfront_url
cd $ROOT_DIR

Write-Host "📡 Syncing Frontend to S3..." -ForegroundColor Yellow
aws s3 sync frontend/dist s3://$S3_BUCKET --delete

Write-Host "`n✅ FULL PROJECT DEPLOYED!" -ForegroundColor Green
Write-Host "🌍 Dashboard: https://$CDN_URL"
Write-Host "⚙️ API Engine: $API_URL"
Write-Host "🤖 Workers: Fargate Running"
