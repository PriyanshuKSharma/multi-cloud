# 🌌 Nebula: AWS Serverless & Containerized Deployment Guide

This guide documents the production-grade architecture of Nebula, leveraging a hybrid **Serverless (Lambda)** and **Containerized (Fargate)** orchestration engine on AWS Mumbai (`ap-south-1`).

---

## 🏗️ System Architecture

Nebula is deployed using a "Best-of-Both-Worlds" strategy:

| Component | Service | Rationale |
| :--- | :--- | :--- |
| **API Control Plane** | AWS Lambda | Scales to infinity, zero cost when idle, no server management. |
| **Orchestration Workers** | AWS Fargate | Handles long-running Terraform provisioning tasks (bypass Lambda's 15m limit). |
| **Task Broker** | ElastiCache Redis | High-speed communication between API and Workers. |
| **Database** | Amazon RDS (Postgres) | Persistent storage for users, credentials, and state. |
| **Frontend Content** | Amazon S3 + CloudFront | Global edge delivery with military-grade security (OAC). |

---

## 🚀 Deployment Operations

We use a unified deployment script that handles the complex dependency order automatically.

### **1. Windows (PowerShell)**
```powershell
.\deploy_lambda.ps1
```

### **2. Linux/macOS (Bash)**
```bash
./deployment/deploy.sh
```

---

## 🛠️ Deployment Lifecycle

The deployment is executed in 6 orchestrated stages:

1.  **Stage 1: ECR Provisioning** - Initializes AWS container registries for the API and Worker.
2.  **Stage 2: Cross-Architecture Build** - Builds Docker images using `buildx` for `linux/amd64` compatibility.
3.  **Stage 3: Cloud Engine Setup** - Provisions RDS, ElastiCache, and the Lambda function.
4.  **Stage 4: Unified Frontend Build** - Injects the live API URL into the React build process.
5.  **Stage 5: Final Infrastructure Update** - Spawns the Fargate Worker service and CloudFront CDN.
6.  **Stage 6: Global Asset Sync** - Syncs the production React build to S3.

---

## 🛡️ Security & Access Control

- **Function isolation**: All compute resources reside in a private VPC.
- **Gateway security**: The API is exposed via a **Function URL** with CORS protection.
- **Credential Protection**: Database and Service credentials are managed via Terraform environment variables.
- **Static Security**: S3 assets are private; access is strictly granted only to CloudFront via **Origin Access Control (OAC)**.

> [!IMPORTANT]
> Since October 2025, new public AWS Lambda Function URLs require both `lambda:InvokeFunctionUrl` and `lambda:InvokeFunction` permissions. The deployment scripts now add the second permission automatically to prevent `403 AccessDeniedException` responses from the Function URL.

---

## 📈 Monitoring & Maintenance

### **Viewing Logs**
- **API Logs**: Amazon CloudWatch -> Log Groups -> `/aws/lambda/nebula-multicloud-api`
- **Worker Logs**: Amazon CloudWatch -> Log Groups -> `/ecs/nebula-multicloud-worker`

### **Scaling**
- To increase the number of parallel workers, update the `desired_count` in `terraform/lambda_deploy/main.tf` and re-run the script.

---

> [!TIP]
> Always run the deployment script from the **Project Root** to ensure paths for Docker and Terraform are resolved correctly.
