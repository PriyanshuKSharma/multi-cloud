# Container Registry Guides

This document provides step-by-step instructions for authenticating with and pushing container images to both **Azure Container Registry (ACR)** and **AWS Elastic Container Registry (ECR)**.

---

## 1. Azure Container Registry (ACR)

### Prerequisites

- **Azure CLI** installed.
- **Docker** installed and running.

### Authentication

1. **Azure Login**:

   ```bash
   az login
   ```

   _If you encounter MFA issues or are in a terminal-only environment, use:_

   ```bash
   az login --use-device-code
   ```

2. **ACR Login**:
   ```bash
   az acr login --name <your-registry-name>
   ```
   _Example:_ `az acr login --name frontendnebula17pks`

### Pull, Tag, and Push

1. **Pull a sample image**:

   ```bash
   docker pull mcr.microsoft.com/mcr/hello-world
   ```

2. **Tag the image for your registry**:

   ```bash
   docker tag mcr.microsoft.com/mcr/hello-world <registry-name>.azurecr.io/<repository-name>:<tag>
   ```

   _Example:_ `docker tag mcr.microsoft.com/mcr/hello-world frontendnebula17pks.azurecr.io/samples/hello-world:v1`

3. **Push the image**:
   ```bash
   docker push <registry-name>.azurecr.io/<repository-name>:<tag>
   ```

### Troubleshooting

- **Unauthorized Errors**: Ensure you have `AcrPush` permissions. Run `az acr login` again.
- **MFA Required**: Ensure the tenant is correct. Use `az login --tenant <tenant-id>`.

---

## 2. AWS Elastic Container Registry (ECR)

### Prerequisites

- **AWS CLI** installed and configured (`aws configure`).
- **Docker** installed and running.

### Authentication

1. **Retrieve the login password and authenticate Docker**:
   ```bash
   aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.<region>.amazonaws.com
   ```
   _Replace `<region>` (e.g., `us-east-1`) and `<aws_account_id>` with your credentials._

### Image Operations

1. **Create a repository (if it doesn't exist)**:

   ```bash
   aws ecr create-repository --repository-name <repository-name> --region <region>
   ```

2. **Tag your local image**:

   ```bash
   docker tag <local-image>:<tag> <aws_account_id>.dkr.ecr.<region>.amazonaws.com/<repository-name>:<tag>
   ```

3. **Push the image**:
   ```bash
   docker push <aws_account_id>.dkr.ecr.<region>.amazonaws.com/<repository-name>:<tag>
   ```

### Permissions

- Ensure your IAM user has the `AmazonEC2ContainerRegistryFullAccess` policy or equivalent permissions to interact with ECR.

---

## Comparison Summary

| Feature          | Azure ACR           | AWS ECR                               |
| :--------------- | :------------------ | :------------------------------------ |
| **Auth Command** | `az acr login`      | `aws ecr get-login-password`          |
| **Registry URL** | `<name>.azurecr.io` | `<id>.dkr.ecr.<region>.amazonaws.com` |
| **CLI Tool**     | Azure CLI           | AWS CLI                               |
