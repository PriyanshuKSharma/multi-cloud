# API Reference

## Base URL

```
Development: http://localhost:8000
Production: https://api.your-domain.com
```

## Authentication

All API endpoints (except `/auth/*`) require authentication using JWT Bearer tokens.

**Header Format:**

```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Getting a Token:**

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=yourpassword"
```

**Response:**

```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

---

## Endpoints

### Authentication

#### POST `/auth/signup`

Create a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "John Doe"
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "created_at": "2024-02-11T10:30:00Z"
}
```

#### POST `/auth/login`

Login and receive access token.

**Request Body:** (form-urlencoded)

```
username=user@example.com
password=securepassword123
```

**Response:** `200 OK`

```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

#### GET `/auth/me`

Get current user information.

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "created_at": "2024-02-11T10:30:00Z"
}
```

---

### Dashboard

#### GET `/dashboard/stats`

Get comprehensive dashboard statistics.

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

```json
{
  "total_resources": 47,
  "active_vms": 12,
  "total_storage": 8,
  "total_networks": 5,
  "estimated_monthly_cost": 1247.5,
  "provider_breakdown": [
    { "provider": "aws", "count": 25, "vms": 8, "storage": 5 },
    { "provider": "azure", "count": 15, "vms": 3, "storage": 2 },
    { "provider": "gcp", "count": 7, "vms": 1, "storage": 1 }
  ],
  "cost_by_provider": [
    { "provider": "aws", "cost": 580.0 },
    { "provider": "azure", "cost": 420.0 },
    { "provider": "gcp", "cost": 247.5 }
  ],
  "cost_by_service": [
    { "service": "compute", "cost": 890.0 },
    { "service": "storage", "cost": 245.5 },
    { "service": "network", "cost": 112.0 }
  ],
  "region_distribution": [
    { "region": "us-east-1", "count": 18 },
    { "region": "eu-west-1", "count": 12 },
    { "region": "us-central1", "count": 7 }
  ],
  "provider_health": [
    {
      "provider": "aws",
      "status": "healthy",
      "response_time_ms": 145,
      "last_check": "2024-02-11T21:45:00Z",
      "error_message": null
    },
    {
      "provider": "azure",
      "status": "healthy",
      "response_time_ms": 230,
      "last_check": "2024-02-11T21:45:00Z",
      "error_message": null
    },
    {
      "provider": "gcp",
      "status": "degraded",
      "response_time_ms": 1200,
      "last_check": "2024-02-11T21:45:00Z",
      "error_message": "High latency detected"
    }
  ],
  "recent_activity": [
    {
      "resource_name": "web-server-01",
      "provider": "aws",
      "type": "vm",
      "status": "running",
      "region": "us-east-1",
      "last_synced": "2024-02-11T21:43:00Z"
    }
  ],
  "last_updated": "2024-02-11T21:45:00Z"
}
```

#### POST `/dashboard/sync/trigger`

Trigger manual resource synchronization.

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

```json
{
  "message": "Sync triggered successfully",
  "task_id": "abc123-def456-ghi789"
}
```

---

### Inventory

#### GET `/inventory/vms`

List all virtual machines with optional filtering.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**

- `provider` (optional): Filter by provider (`aws`, `azure`, `gcp`)
- `region` (optional): Filter by region
- `status` (optional): Filter by status (`running`, `stopped`, `terminated`)
- `skip` (optional, default: 0): Pagination offset
- `limit` (optional, default: 100): Page size

**Example:**

```
GET /inventory/vms?provider=aws&status=running&limit=10
```

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "resource_id": "i-1234567890abcdef0",
    "resource_name": "web-server-01",
    "resource_type": "vm",
    "provider": "aws",
    "region": "us-east-1",
    "status": "running",
    "metadata": {
      "instance_type": "t3.medium",
      "public_ip": "54.123.45.67",
      "private_ip": "10.0.1.25",
      "vpc_id": "vpc-abc123",
      "subnet_id": "subnet-xyz789",
      "security_groups": ["sg-web-server"],
      "launch_time": "2024-01-15T10:30:00Z",
      "cost_per_hour": 0.0416,
      "tags": {
        "Environment": "production",
        "Team": "backend"
      }
    },
    "created_at": "2024-01-15T10:30:00Z",
    "last_synced": "2024-02-11T21:40:00Z"
  }
]
```

#### GET `/inventory/storage`

List all storage resources (buckets, containers).

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**

- `provider` (optional)
- `region` (optional)
- `skip` (optional)
- `limit` (optional)

**Response:** `200 OK`

```json
[
  {
    "id": 10,
    "resource_id": "s3-my-bucket-prod",
    "resource_name": "my-bucket-prod",
    "resource_type": "storage",
    "provider": "aws",
    "region": "us-east-1",
    "status": "active",
    "metadata": {
      "bucket_type": "s3",
      "creation_date": "2024-01-10T08:00:00Z",
      "storage_class": "STANDARD",
      "versioning": true
    },
    "created_at": "2024-01-10T08:00:00Z",
    "last_synced": "2024-02-11T21:40:00Z"
  }
]
```

#### GET `/inventory/networks`

List all network resources (VPCs, VNets, Networks).

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

```json
[
  {
    "id": 20,
    "resource_id": "vpc-abc123",
    "resource_name": "production-vpc",
    "resource_type": "network",
    "provider": "aws",
    "region": "us-east-1",
    "status": "active",
    "metadata": {
      "cidr_block": "10.0.0.0/16",
      "subnets": ["subnet-xyz789", "subnet-abc456"],
      "route_tables": ["rtb-123456"],
      "internet_gateway": "igw-789012"
    },
    "created_at": "2024-01-05T12:00:00Z",
    "last_synced": "2024-02-11T21:40:00Z"
  }
]
```

#### GET `/inventory/{id}`

Get detailed information about a specific resource.

**Headers:** `Authorization: Bearer {token}`

**Path Parameters:**

- `id`: Resource ID

**Response:** `200 OK`

```json
{
  "id": 1,
  "resource_id": "i-1234567890abcdef0",
  "resource_name": "web-server-01",
  "resource_type": "vm",
  "provider": "aws",
  "region": "us-east-1",
  "status": "running",
  "metadata": {
    "instance_type": "t3.medium",
    "public_ip": "54.123.45.67",
    "private_ip": "10.0.1.25",
    "vpc_id": "vpc-abc123",
    "subnet_id": "subnet-xyz789",
    "security_groups": ["sg-web-server"],
    "launch_time": "2024-01-15T10:30:00Z",
    "cost_per_hour": 0.0416,
    "tags": {
      "Environment": "production",
      "Team": "backend"
    }
  },
  "created_at": "2024-01-15T10:30:00Z",
  "last_synced": "2024-02-11T21:40:00Z"
}
```

---

### Billing

#### GET `/billing/costs`

Get cost data with grouping options.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**

- `start_date` (optional): Start date (YYYY-MM-DD)
- `end_date` (optional): End date (YYYY-MM-DD)
- `group_by` (optional): Group by `provider`, `service`, or `day`

**Example:**

```
GET /billing/costs?start_date=2024-02-01&end_date=2024-02-11&group_by=provider
```

**Response:** `200 OK`

```json
{
  "total_cost": 1247.5,
  "currency": "USD",
  "period": {
    "start": "2024-02-01",
    "end": "2024-02-11"
  },
  "breakdown": [
    {
      "provider": "aws",
      "cost": 580.0,
      "services": [
        { "service": "EC2", "cost": 350.0 },
        { "service": "S3", "cost": 150.0 },
        { "service": "VPC", "cost": 80.0 }
      ]
    },
    {
      "provider": "azure",
      "cost": 420.0,
      "services": [
        { "service": "Virtual Machines", "cost": 300.0 },
        { "service": "Storage", "cost": 120.0 }
      ]
    },
    {
      "provider": "gcp",
      "cost": 247.5,
      "services": [
        { "service": "Compute Engine", "cost": 180.0 },
        { "service": "Cloud Storage", "cost": 67.5 }
      ]
    }
  ]
}
```

#### GET `/billing/summary`

Get monthly cost summary.

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

```json
{
  "current_month": {
    "period": "2024-02",
    "total_cost": 1247.5,
    "days_elapsed": 11,
    "projected_cost": 3400.0
  },
  "last_month": {
    "period": "2024-01",
    "total_cost": 1150.0
  },
  "change": {
    "absolute": 97.5,
    "percentage": 8.48
  }
}
```

---

### Resources (Terraform)

#### GET `/resources/`

List all Terraform-managed resources.

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "web-server-prod",
    "provider": "aws",
    "type": "vm",
    "status": "active",
    "details": "t3.medium EC2 instance in us-east-1",
    "terraform_output": {
      "instance_id": "i-1234567890abcdef0",
      "public_ip": "54.123.45.67",
      "private_ip": "10.0.1.25"
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:35:00Z"
  }
]
```

#### POST `/resources/`

Create a new resource using Terraform.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**

```json
{
  "name": "web-server-prod",
  "provider": "aws",
  "type": "vm",
  "configuration": {
    "instance_type": "t3.medium",
    "ami": "ami-0c55b159cbfafe1f0",
    "region": "us-east-1",
    "vpc_id": "vpc-abc123",
    "subnet_id": "subnet-xyz789",
    "key_name": "my-key-pair",
    "security_groups": ["sg-web-server"]
  }
}
```

**Response:** `202 Accepted`

```json
{
  "id": 1,
  "name": "web-server-prod",
  "provider": "aws",
  "type": "vm",
  "status": "provisioning",
  "task_id": "abc123-def456-ghi789",
  "message": "Resource provisioning started"
}
```

#### GET `/resources/{id}`

Get resource details.

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

```json
{
  "id": 1,
  "name": "web-server-prod",
  "provider": "aws",
  "type": "vm",
  "status": "active",
  "details": "t3.medium EC2 instance in us-east-1",
  "terraform_output": {
    "instance_id": "i-1234567890abcdef0",
    "public_ip": "54.123.45.67",
    "private_ip": "10.0.1.25",
    "logs": "Terraform apply completed successfully..."
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:35:00Z"
}
```

#### DELETE `/resources/{id}`

Destroy a Terraform-managed resource.

**Headers:** `Authorization: Bearer {token}`

**Response:** `202 Accepted`

```json
{
  "message": "Resource destruction started",
  "task_id": "xyz789-abc123-def456"
}
```

---

### Credentials

#### GET `/credentials/`

List all cloud credentials.

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "provider": "aws",
    "name": "AWS Production Account",
    "region": "us-east-1",
    "is_active": true,
    "created_at": "2024-01-10T08:00:00Z"
  },
  {
    "id": 2,
    "provider": "azure",
    "name": "Azure Main Subscription",
    "region": "eastus",
    "is_active": true,
    "created_at": "2024-01-12T09:00:00Z"
  }
]
```

#### POST `/credentials/`

Add new cloud credentials.

**Headers:** `Authorization: Bearer {token}`

**Request Body (AWS):**

```json
{
  "provider": "aws",
  "name": "AWS Production Account",
  "access_key": "AKIAIOSFODNN7EXAMPLE",
  "secret_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "region": "us-east-1"
}
```

**Request Body (Azure):**

```json
{
  "provider": "azure",
  "name": "Azure Main Subscription",
  "tenant_id": "12345678-1234-1234-1234-123456789012",
  "client_id": "87654321-4321-4321-4321-210987654321",
  "client_secret": "your-client-secret",
  "subscription_id": "abcdefgh-abcd-abcd-abcd-abcdefghijkl"
}
```

**Request Body (GCP):**

```json
{
  "provider": "gcp",
  "name": "GCP Main Project",
  "service_account_json": "{\"type\":\"service_account\",...}",
  "project_id": "my-gcp-project-123456"
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "provider": "aws",
  "name": "AWS Production Account",
  "region": "us-east-1",
  "is_active": true,
  "created_at": "2024-02-11T22:00:00Z"
}
```

#### DELETE `/credentials/{id}`

Delete cloud credentials.

**Headers:** `Authorization: Bearer {token}`

**Response:** `204 No Content`

---

## Error Responses

### 400 Bad Request

```json
{
  "detail": "Invalid request data"
}
```

### 401 Unauthorized

```json
{
  "detail": "Not authenticated"
}
```

### 403 Forbidden

```json
{
  "detail": "Not enough permissions"
}
```

### 404 Not Found

```json
{
  "detail": "Resource not found"
}
```

### 422 Unprocessable Entity

```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### 500 Internal Server Error

```json
{
  "detail": "Internal server error"
}
```

---

## Rate Limiting

- **Authentication endpoints:** 5 requests per minute
- **Dashboard endpoints:** 60 requests per minute
- **Other endpoints:** 100 requests per minute

---

## Pagination

List endpoints support pagination with `skip` and `limit` parameters:

```
GET /inventory/vms?skip=0&limit=20
```

**Response Headers:**

```
X-Total-Count: 47
X-Page-Size: 20
X-Page-Number: 1
```

---

## WebSocket Endpoints

### `/ws/deployments/{deployment_id}/logs`

Stream live Terraform deployment logs.

**Connection:**

```javascript
const ws = new WebSocket("ws://localhost:8000/ws/deployments/1/logs");

ws.onmessage = (event) => {
  console.log("Log:", event.data);
};
```

**Messages:**

```
[2024-02-11 22:00:00] Initializing Terraform...
[2024-02-11 22:00:03] Planning infrastructure changes...
[2024-02-11 22:00:05] Plan: 3 to add, 0 to change, 0 to destroy
[2024-02-11 22:00:07] Applying changes...
[2024-02-11 22:00:15] aws_instance.web: Creating...
[2024-02-11 22:00:45] aws_instance.web: Creation complete
[2024-02-11 22:00:48] Apply complete! Resources: 3 added
```

---

## Interactive API Documentation

Visit http://localhost:8000/docs for interactive Swagger UI documentation where you can:

- View all endpoints
- Test API calls
- See request/response schemas
- Authenticate and try endpoints

---

**Last Updated:** February 2026
