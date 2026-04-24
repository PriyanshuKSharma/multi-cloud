#!/bin/bash

# Nebula Lambda Deployment Script (Linux/macOS)
set -e # Exit on error

echo -e "\033[0;36m🚀 Starting Nebula Deployment to AWS Lambda...\033[0m"

# 1. Configuration
AWS_REGION="ap-south-1"
PROJECT_NAME="nebula-multicloud"
DB_PASSWORD="trialForNebula"

ensure_lambda_function_url_invoke_permission() {
  local function_name="$1"
  local policy
  local cli_output
  local python_bin

  echo -e "\033[0;33m🔐 Ensuring Lambda Function URL invoke permission...\033[0m"
  policy=$(aws lambda get-policy --function-name "$function_name" --output text 2>/dev/null || true)

  if [[ "$policy" != *'"Action":"lambda:InvokeFunction"'* ]]; then
    if cli_output=$(aws lambda add-permission \
      --function-name "$function_name" \
      --statement-id FunctionURLInvokeAllowPublicAccess \
      --action lambda:InvokeFunction \
      --principal "*" \
      --invoked-via-function-url \
      --output text 2>&1); then
      echo -e "\033[0;32m✅ Added public invoke permission for Function URL.\033[0m"
      return
    fi

    if [[ "$cli_output" == *"Unknown options: --invoked-via-function-url"* ]]; then
      if command -v python3 >/dev/null 2>&1; then
        python_bin=python3
      elif command -v python >/dev/null 2>&1; then
        python_bin=python
      else
        echo "Python is required for the Lambda permission fallback path." >&2
        return 1
      fi

      "$python_bin" - "$function_name" "$AWS_REGION" <<'PY'
import json
import sys
import urllib.error
import urllib.request

import boto3
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest

function_name = sys.argv[1]
region = sys.argv[2]
url = f"https://lambda.{region}.amazonaws.com/2015-03-31/functions/{function_name}/policy"
payload = {
    "Action": "lambda:InvokeFunction",
    "Principal": "*",
    "StatementId": "FunctionURLInvokeAllowPublicAccess",
    "InvokedViaFunctionUrl": True,
}

session = boto3.Session(region_name=region)
credentials = session.get_credentials()
if credentials is None:
    raise SystemExit("No AWS credentials available for Lambda permission fallback.")

body = json.dumps(payload).encode("utf-8")
request = AWSRequest(method="POST", url=url, data=body, headers={"Content-Type": "application/json"})
SigV4Auth(credentials.get_frozen_credentials(), "lambda", region).add_auth(request)
prepared = request.prepare()
http_request = urllib.request.Request(url, data=body, headers=dict(prepared.headers.items()), method="POST")

try:
    with urllib.request.urlopen(http_request, timeout=30) as response:
        print(response.read().decode("utf-8"))
except urllib.error.HTTPError as exc:
    print(exc.read().decode("utf-8"), file=sys.stderr)
    raise
PY
      echo -e "\033[0;32m✅ Added public invoke permission for Function URL via Python fallback.\033[0m"
      return
    fi

    echo "$cli_output" >&2
    return 1
  fi

  echo -e "\033[0;90mℹ️ Function URL invoke permission already present.\033[0m"
}

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

ensure_lambda_function_url_invoke_permission "${PROJECT_NAME}-api"

echo -e "\033[0;33m📡 Syncing files to S3...\033[0m"
aws s3 sync frontend/dist "s3://$S3_BUCKET" --delete

echo -e "\n\033[0;32m✅ Deployment Complete!\033[0m"
echo -e "🌍 Frontend: https://$CDN_URL"
echo -e "⚙️ Backend: $API_URL"
