# Nebula Lambda Deployment Script (Windows PowerShell)

Write-Host "🚀 Starting Nebula Deployment to AWS Lambda..." -ForegroundColor Cyan

# 1. Configuration
$AWS_REGION = "ap-south-1"
$PROJECT_NAME = "nebula-multicloud"
$DB_PASSWORD = "trialForNebula"

# 2. Step One: Create ECR Repository (if not exists)
Write-Host "🏗️ Stage 1: Creating ECR Repository..." -ForegroundColor Yellow
$ROOT_DIR = Get-Location
cd terraform/lambda_deploy
terraform init
terraform apply -target aws_ecr_repository.backend -target aws_s3_bucket.frontend -var "db_password=$DB_PASSWORD" -auto-approve
$ECR_REPO = terraform output -raw ecr_repository_url
cd $ROOT_DIR

# 3. Stage 2: Build and Push Backend Image
Write-Host "🐳 Stage 2: Building & Pushing Backend Image..." -ForegroundColor Yellow
cd backend
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO
docker build -t $PROJECT_NAME-backend -f Dockerfile.lambda .
docker tag $PROJECT_NAME-backend`:latest "$ECR_REPO`:latest"
docker push "$ECR_REPO`:latest"
cd $ROOT_DIR

# 4. Stage 3: Create Backend Infrastructure (Lambda)
Write-Host "🏗️ Stage 3: Deploying Backend Infrastructure..." -ForegroundColor Yellow
cd terraform/lambda_deploy
terraform apply -target aws_lambda_function.api -target aws_lambda_function_url.api_url -var "db_password=$DB_PASSWORD" -auto-approve
$API_URL = terraform output -raw api_endpoint
cd $ROOT_DIR

# 5. Stage 4: Build Frontend with the correct API URL
Write-Host "📦 Stage 4: Building Frontend with API link: $API_URL" -ForegroundColor Yellow
cd frontend
# Set environment variable for Vite
$env:VITE_API_URL = "$API_URL"
npm install
npm run build
cd $ROOT_DIR

# 6. Stage 5: Finalize Infrastructure (S3 + CloudFront)
Write-Host "🌐 Stage 5: Uploading Frontend & Finalizing CDN..." -ForegroundColor Yellow
cd terraform/lambda_deploy
terraform apply -var "db_password=$DB_PASSWORD" -auto-approve
$S3_BUCKET = terraform output -raw s3_bucket_name
$CDN_URL = terraform output -raw cloudfront_url
cd $ROOT_DIR

Write-Host "📡 Syncing files to S3..." -ForegroundColor Yellow
aws s3 sync frontend/dist s3://$S3_BUCKET --delete

Write-Host "`n✅ Deployment Complete!" -ForegroundColor Green
Write-Host "🌍 Frontend: https://$CDN_URL"
Write-Host "⚙️ Backend: $API_URL"
