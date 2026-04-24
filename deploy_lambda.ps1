# Nebula Lambda Deployment Script (Windows PowerShell)

Write-Host "🚀 Starting Nebula Deployment to AWS Lambda..." -ForegroundColor Cyan

# 1. Configuration
$AWS_REGION = "ap-south-1"
$PROJECT_NAME = "trialForNebula"

# 2. Build Frontend
Write-Host "📦 Building Frontend..." -ForegroundColor Yellow
cd frontend
npm install
npm run build
cd ..

# 3. Terraform Initial/Apply (to get ECR URL)
Write-Host "🏗️ Preparing Infrastructure (ECR & S3)..." -ForegroundColor Yellow
$ROOT_DIR = Get-Location
cd terraform/lambda_deploy
terraform init
# Only create the ECR and S3 first so we can push to them
terraform apply -target=aws_ecr_repository.backend -target=aws_s3_bucket.frontend -var="db_password=trialForNebula" -auto-approve

$ECR_REPO = terraform output -raw ecr_repository_url
$S3_BUCKET = terraform output -raw s3_bucket_name
cd $ROOT_DIR

# 4. Build and Push Backend Image to ECR
Write-Host "🐳 Building Backend Container..." -ForegroundColor Yellow
cd backend
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO
docker build -t $PROJECT_NAME-backend -f Dockerfile.lambda .
docker tag $PROJECT_NAME-backend`:latest "$ECR_REPO`:latest"
docker push "$ECR_REPO`:latest"
cd ..

# 5. Sync Frontend to S3
Write-Host "🌐 Uploading Frontend to S3..." -ForegroundColor Yellow
aws s3 sync frontend/dist s3://$S3_BUCKET --delete

# 6. Final Terraform Apply (to update Lambda with new image)
Write-Host "🔄 Updating Lambda Function..." -ForegroundColor Yellow
cd terraform/lambda_deploy
terraform apply -var="db_password=trialForNebula" -auto-approve

$API_URL = terraform output -raw api_endpoint
$CDN_URL = terraform output -raw cloudfront_url
cd $ROOT_DIR

Write-Host "`n✅ Deployment Complete!" -ForegroundColor Green
Write-Host "🌍 Frontend: https://$CDN_URL"
Write-Host "⚙️ Backend: $API_URL"
