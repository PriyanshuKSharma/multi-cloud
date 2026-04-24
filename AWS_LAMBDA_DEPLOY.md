# 🚀 Nebula AWS Lambda Deployment Guide

This document explains how to deploy the Nebula Multi-Cloud platform to **AWS Lambda** and **S3/CloudFront** using the provided Terraform and PowerShell scripts.

## 🏗️ Architecture Stack
- **Backend**: FastAPI (Python) on AWS Lambda via Mangum.
- **Frontend**: React 19 on S3 + CloudFront.
- **Database**: Amazon RDS PostgreSQL.
- **Storage**: Amazon ECR (for Lambda container image).

---

## 🛠️ Prerequisites
Before you begin, ensure you have the following installed:
1.  **AWS CLI**: [Install & Configure](https://aws.amazon.com/cli/)
2.  **Terraform**: [Install](https://developer.hashicorp.com/terraform/downloads)
3.  **Docker Desktop**: [Install](https://www.docker.com/products/docker-desktop/)
4.  **Node.js & npm**: (For building the frontend)

---

## 📂 Deployment Files
The following files were created to support this deployment:

| File | Description |
| :--- | :--- |
| `deploy_lambda.ps1` | Principal automation script (PowerShell). |
| `backend/handler.py` | Mangum wrapper for FastAPI. |
| `backend/Dockerfile.lambda` | Optimized Lambda container image. |
| `terraform/lambda_deploy/` | Terraform infrastructure (VPC, RDS, Lambda, S3, CDN). |

---

## 🚀 Deployment Steps

### 1. Configure AWS Credentials
Run this command to authenticate with your AWS account:
```powershell
aws configure
```

### 2. Update Database Credentials
Open `deploy_lambda.ps1` and ensure your `db_password` is set correctly in the terraform command:
```powershell
# In deploy_lambda.ps1
terraform apply -var="db_password=your_secure_password" -auto-approve
```

### 3. Run the Deployment
Execute the PowerShell script from the root directory:
```powershell
.\deploy_lambda.ps1
```

---

## 🔄 What happens during deployment?
1.  **Frontend Build**: Compiles your React app into `frontend/dist`.
2.  **Infrastructure Initialization**: Terraform creates the VPC, RDS instance, and ECR repository.
3.  **Backend Packaging**:
    *   Authenticates Docker with AWS ECR.
    *   Builds the backend using `Dockerfile.lambda`.
    *   Pushes the image to AWS.
4.  **Frontend Hosting**: Syncs the `dist` folder to an S3 bucket.
5.  **Final Update**: Terraform updates the Lambda function to use the newly pushed image and provides the final URLs.

---

## 🔗 Accessing the App
At the end of the script, you will receive two URLs:
- **Frontend URL**: `https://xxxxxxxx.cloudfront.net`
- **Backend API URL**: `https://xxxxxxxx.lambda-url.ap-south-1.on.aws/`

---

## ⚠️ Important Configuration
The Lambda function relies on environment variables for database connectivity. These are automatically managed by Terraform in `main.tf`.

If you need to update manual environment variables (like API keys), add them to the `environment` block in `terraform/lambda_deploy/main.tf` and re-run the script.
