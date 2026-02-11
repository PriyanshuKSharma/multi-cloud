# Database Schema Documentation

## Table of Contents

1. [Overview](#1-overview)
2. [Entity Relationship Diagram](#2-entity-relationship-diagram)
3. [Tables](#3-tables)
4. [Relationships](#4-relationships)
5. [Indexes](#5-indexes)
6. [Migrations](#6-migrations)

---

## 1. Overview

**Database:** PostgreSQL 15  
**ORM:** SQLAlchemy 2.0  
**Migration Tool:** Alembic (planned) / Manual scripts (current)

**Schema Design Principles:**

- User isolation (all resources belong to a user)
- Encrypted credentials at rest
- Normalized structure with JSON metadata for flexibility
- Optimized indexes for common queries

---

## 2. Entity Relationship Diagram

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id (PK)         │
│ email           │◀──────────┐
│ hashed_password │           │
│ full_name       │           │
│ created_at      │           │
└─────────────────┘           │
                              │
                              │ user_id (FK)
                              │
        ┌─────────────────────┼─────────────────────┬──────────────────────┐
        │                     │                     │                      │
        │                     │                     │                      │
┌───────▼──────────┐  ┌───────▼──────────┐  ┌──────▼───────────┐  ┌──────▼───────────┐
│  credentials     │  │   resources      │  │ resource_        │  │   cost_data      │
│──────────────────│  │──────────────────│  │ inventory        │  │──────────────────│
│ id (PK)          │  │ id (PK)          │  │──────────────────│  │ id (PK)          │
│ user_id (FK)     │  │ user_id (FK)     │  │ id (PK)          │  │ user_id (FK)     │
│ provider         │  │ name             │  │ user_id (FK)     │  │ provider         │
│ name             │  │ provider         │  │ resource_id      │  │ service          │
│ access_key (enc) │  │ type             │  │ resource_name    │  │ resource_id      │
│ secret_key (enc) │  │ status           │  │ resource_type    │  │ cost             │
│ region           │  │ details          │  │ provider         │  │ currency         │
│ is_active        │  │ terraform_output │  │ region           │  │ date             │
│ created_at       │  │ created_at       │  │ status           │  │ billing_period   │
└──────────────────┘  │ updated_at       │  │ metadata (JSON)  │  │ metadata (JSON)  │
                      └──────────────────┘  │ created_at       │  │ created_at       │
                                            │ last_synced      │  └──────────────────┘
                                            └──────────────────┘
                                                    │
                                                    │ user_id (FK)
                                                    │
                                            ┌───────▼──────────┐
                                            │ provider_health  │
                                            │──────────────────│
                                            │ id (PK)          │
                                            │ user_id (FK)     │
                                            │ provider         │
                                            │ status           │
                                            │ response_time_ms │
                                            │ error_message    │
                                            │ last_check       │
                                            └──────────────────┘

                      ┌──────────────────┐
                      │ terraform_states │
                      │──────────────────│
                      │ id (PK)          │
                      │ resource_id (FK) │──┐
                      │ state_data (JSON)│  │
                      │ version          │  │
                      │ created_at       │  │
                      └──────────────────┘  │
                                            │
                                            └──▶ resources.id
```

---

## 3. Tables

### 3.1 users

**Purpose:** Store user accounts and authentication data.

| Column          | Type      | Constraints      | Description                   |
| --------------- | --------- | ---------------- | ----------------------------- |
| id              | INTEGER   | PRIMARY KEY      | Auto-incrementing user ID     |
| email           | VARCHAR   | UNIQUE, NOT NULL | User email (login identifier) |
| hashed_password | VARCHAR   | NOT NULL         | Bcrypt hashed password        |
| full_name       | VARCHAR   |                  | User's full name              |
| created_at      | TIMESTAMP | DEFAULT NOW()    | Account creation timestamp    |

**Indexes:**

- PRIMARY KEY on `id`
- UNIQUE INDEX on `email`

**Example Row:**

```sql
INSERT INTO users (email, hashed_password, full_name)
VALUES (
    'john@example.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7z1zeP4.Oi',
    'John Doe'
);
```

---

### 3.2 credentials

**Purpose:** Store encrypted cloud provider credentials.

| Column               | Type      | Constraints           | Description                       |
| -------------------- | --------- | --------------------- | --------------------------------- |
| id                   | INTEGER   | PRIMARY KEY           | Auto-incrementing credential ID   |
| user_id              | INTEGER   | FOREIGN KEY, NOT NULL | Reference to users.id             |
| provider             | VARCHAR   | NOT NULL              | 'aws', 'azure', or 'gcp'          |
| name                 | VARCHAR   |                       | User-friendly credential name     |
| access_key           | TEXT      |                       | Encrypted access key (AWS)        |
| secret_key           | TEXT      |                       | Encrypted secret key (AWS)        |
| tenant_id            | TEXT      |                       | Encrypted tenant ID (Azure)       |
| client_id            | TEXT      |                       | Encrypted client ID (Azure)       |
| client_secret        | TEXT      |                       | Encrypted client secret (Azure)   |
| subscription_id      | TEXT      |                       | Encrypted subscription ID (Azure) |
| service_account_json | TEXT      |                       | Encrypted SA JSON (GCP)           |
| project_id           | VARCHAR   |                       | GCP project ID                    |
| region               | VARCHAR   |                       | Default region                    |
| is_active            | BOOLEAN   | DEFAULT TRUE          | Whether credential is active      |
| created_at           | TIMESTAMP | DEFAULT NOW()         | Creation timestamp                |

**Indexes:**

- PRIMARY KEY on `id`
- INDEX on `user_id`
- INDEX on `provider`

**Example Row (AWS):**

```sql
INSERT INTO credentials (user_id, provider, name, access_key, secret_key, region)
VALUES (
    1,
    'aws',
    'AWS Production',
    'gAAAAABl...encrypted_access_key...==',
    'gAAAAABl...encrypted_secret_key...==',
    'us-east-1'
);
```

---

### 3.3 resource_inventory

**Purpose:** Cache of discovered cloud resources (VMs, storage, networks).

| Column        | Type      | Constraints           | Description                    |
| ------------- | --------- | --------------------- | ------------------------------ |
| id            | INTEGER   | PRIMARY KEY           | Auto-incrementing inventory ID |
| user_id       | INTEGER   | FOREIGN KEY, NOT NULL | Reference to users.id          |
| resource_id   | VARCHAR   | UNIQUE, NOT NULL      | Cloud provider resource ID     |
| resource_name | VARCHAR   |                       | Resource name/tag              |
| resource_type | VARCHAR   | NOT NULL              | 'vm', 'storage', 'network'     |
| provider      | VARCHAR   | NOT NULL              | 'aws', 'azure', 'gcp'          |
| region        | VARCHAR   |                       | Cloud region                   |
| status        | VARCHAR   |                       | 'running', 'stopped', 'active' |
| metadata      | JSON      |                       | Provider-specific details      |
| created_at    | TIMESTAMP | DEFAULT NOW()         | First discovered timestamp     |
| last_synced   | TIMESTAMP | DEFAULT NOW()         | Last sync timestamp            |

**Indexes:**

- PRIMARY KEY on `id`
- UNIQUE INDEX on `resource_id`
- INDEX on `user_id`
- INDEX on `resource_type`
- INDEX on `provider`
- INDEX on `status`
- INDEX on `last_synced`

**Example Row (AWS EC2):**

```sql
INSERT INTO resource_inventory (
    user_id, resource_id, resource_name, resource_type, provider, region, status, metadata
)
VALUES (
    1,
    'i-1234567890abcdef0',
    'web-server-01',
    'vm',
    'aws',
    'us-east-1',
    'running',
    '{
        "instance_type": "t3.medium",
        "public_ip": "54.123.45.67",
        "private_ip": "10.0.1.25",
        "vpc_id": "vpc-abc123",
        "subnet_id": "subnet-xyz789",
        "security_groups": ["sg-web-server"],
        "launch_time": "2024-01-15T10:30:00Z",
        "tags": {"Environment": "production", "Team": "backend"}
    }'::jsonb
);
```

---

### 3.4 cost_data

**Purpose:** Store billing/cost data from cloud providers.

| Column         | Type      | Constraints           | Description                     |
| -------------- | --------- | --------------------- | ------------------------------- |
| id             | INTEGER   | PRIMARY KEY           | Auto-incrementing cost ID       |
| user_id        | INTEGER   | FOREIGN KEY, NOT NULL | Reference to users.id           |
| provider       | VARCHAR   | NOT NULL              | 'aws', 'azure', 'gcp'           |
| service        | VARCHAR   |                       | Service name (EC2, S3, etc.)    |
| resource_id    | VARCHAR   |                       | Specific resource ID (optional) |
| cost           | DECIMAL   | NOT NULL              | Cost amount                     |
| currency       | VARCHAR   | DEFAULT 'USD'         | Currency code                   |
| date           | DATE      | NOT NULL              | Cost date                       |
| billing_period | VARCHAR   |                       | Billing period (YYYY-MM)        |
| metadata       | JSON      |                       | Additional cost details         |
| created_at     | TIMESTAMP | DEFAULT NOW()         | Record creation timestamp       |

**Indexes:**

- PRIMARY KEY on `id`
- INDEX on `user_id`
- INDEX on `provider`
- INDEX on `service`
- INDEX on `date`
- INDEX on `billing_period`

**Example Row:**

```sql
INSERT INTO cost_data (user_id, provider, service, cost, date, billing_period)
VALUES (
    1,
    'aws',
    'EC2',
    45.67,
    '2024-02-11',
    '2024-02'
);
```

---

### 3.5 provider_health

**Purpose:** Track cloud provider API health and connectivity.

| Column           | Type      | Constraints           | Description                        |
| ---------------- | --------- | --------------------- | ---------------------------------- |
| id               | INTEGER   | PRIMARY KEY           | Auto-incrementing health ID        |
| user_id          | INTEGER   | FOREIGN KEY, NOT NULL | Reference to users.id              |
| provider         | VARCHAR   | NOT NULL              | 'aws', 'azure', 'gcp'              |
| status           | VARCHAR   | NOT NULL              | 'healthy', 'degraded', 'error'     |
| response_time_ms | INTEGER   |                       | API response time in milliseconds  |
| error_message    | TEXT      |                       | Error details if status is 'error' |
| last_check       | TIMESTAMP | DEFAULT NOW()         | Last health check timestamp        |

**Indexes:**

- PRIMARY KEY on `id`
- INDEX on `user_id`
- INDEX on `provider`
- INDEX on `last_check`

**Example Row:**

```sql
INSERT INTO provider_health (user_id, provider, status, response_time_ms, last_check)
VALUES (
    1,
    'aws',
    'healthy',
    145,
    NOW()
);
```

---

### 3.6 resources

**Purpose:** Terraform-managed resources (provisioned infrastructure).

| Column           | Type      | Constraints           | Description                                                              |
| ---------------- | --------- | --------------------- | ------------------------------------------------------------------------ |
| id               | INTEGER   | PRIMARY KEY           | Auto-incrementing resource ID                                            |
| user_id          | INTEGER   | FOREIGN KEY, NOT NULL | Reference to users.id                                                    |
| name             | VARCHAR   | NOT NULL              | Resource name                                                            |
| provider         | VARCHAR   | NOT NULL              | 'aws', 'azure', 'gcp'                                                    |
| type             | VARCHAR   | NOT NULL              | 'vm', 'storage', 'network'                                               |
| status           | VARCHAR   | DEFAULT 'pending'     | 'pending', 'provisioning', 'active', 'failed', 'destroying', 'destroyed' |
| details          | TEXT      |                       | Human-readable description                                               |
| terraform_output | JSON      |                       | Terraform outputs and logs                                               |
| created_at       | TIMESTAMP | DEFAULT NOW()         | Creation timestamp                                                       |
| updated_at       | TIMESTAMP | DEFAULT NOW()         | Last update timestamp                                                    |

**Indexes:**

- PRIMARY KEY on `id`
- INDEX on `user_id`
- INDEX on `status`

**Example Row:**

```sql
INSERT INTO resources (user_id, name, provider, type, status, details, terraform_output)
VALUES (
    1,
    'web-server-prod',
    'aws',
    'vm',
    'active',
    't3.medium EC2 instance in us-east-1',
    '{
        "instance_id": "i-1234567890abcdef0",
        "public_ip": "54.123.45.67",
        "private_ip": "10.0.1.25",
        "logs": "Terraform apply completed successfully..."
    }'::jsonb
);
```

---

### 3.7 terraform_states

**Purpose:** Store Terraform state files for each deployment.

| Column      | Type      | Constraints           | Description                |
| ----------- | --------- | --------------------- | -------------------------- |
| id          | INTEGER   | PRIMARY KEY           | Auto-incrementing state ID |
| resource_id | INTEGER   | FOREIGN KEY, NOT NULL | Reference to resources.id  |
| state_data  | JSON      | NOT NULL              | Terraform state JSON       |
| version     | INTEGER   | DEFAULT 1             | State version number       |
| created_at  | TIMESTAMP | DEFAULT NOW()         | State creation timestamp   |

**Indexes:**

- PRIMARY KEY on `id`
- INDEX on `resource_id`

---

## 4. Relationships

### 4.1 One-to-Many Relationships

**users → credentials**

- One user can have multiple cloud credentials
- CASCADE DELETE: Deleting a user deletes all their credentials

**users → resources**

- One user can have multiple Terraform-managed resources
- CASCADE DELETE: Deleting a user deletes all their resources

**users → resource_inventory**

- One user can have multiple cached cloud resources
- CASCADE DELETE: Deleting a user deletes all their inventory

**users → cost_data**

- One user can have multiple cost records
- CASCADE DELETE: Deleting a user deletes all their cost data

**users → provider_health**

- One user can have multiple provider health records
- CASCADE DELETE: Deleting a user deletes all their health records

**resources → terraform_states**

- One resource can have multiple state versions
- CASCADE DELETE: Deleting a resource deletes all its states

---

## 5. Indexes

### 5.1 Query Optimization

**Common Queries:**

1. **Get user's resources:**

   ```sql
   SELECT * FROM resource_inventory WHERE user_id = 1;
   -- Uses INDEX on user_id
   ```

2. **Get running VMs:**

   ```sql
   SELECT * FROM resource_inventory
   WHERE user_id = 1 AND resource_type = 'vm' AND status = 'running';
   -- Uses INDEX on user_id, resource_type, status
   ```

3. **Get costs for current month:**

   ```sql
   SELECT * FROM cost_data
   WHERE user_id = 1 AND billing_period = '2024-02';
   -- Uses INDEX on user_id, billing_period
   ```

4. **Get recent activity:**
   ```sql
   SELECT * FROM resource_inventory
   WHERE user_id = 1
   ORDER BY last_synced DESC
   LIMIT 10;
   -- Uses INDEX on user_id, last_synced
   ```

---

## 6. Migrations

### 6.1 Initial Schema Creation

```sql
-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create credentials table
CREATE TABLE credentials (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    access_key TEXT,
    secret_key TEXT,
    tenant_id TEXT,
    client_id TEXT,
    client_secret TEXT,
    subscription_id TEXT,
    service_account_json TEXT,
    project_id VARCHAR(255),
    region VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_credentials_user_id ON credentials(user_id);
CREATE INDEX idx_credentials_provider ON credentials(provider);

-- Create resource_inventory table
CREATE TABLE resource_inventory (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id VARCHAR(255) UNIQUE NOT NULL,
    resource_name VARCHAR(255),
    resource_type VARCHAR(50) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    region VARCHAR(100),
    status VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    last_synced TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_resource_inventory_user_id ON resource_inventory(user_id);
CREATE INDEX idx_resource_inventory_resource_type ON resource_inventory(resource_type);
CREATE INDEX idx_resource_inventory_provider ON resource_inventory(provider);
CREATE INDEX idx_resource_inventory_status ON resource_inventory(status);
CREATE INDEX idx_resource_inventory_last_synced ON resource_inventory(last_synced);

-- Create cost_data table
CREATE TABLE cost_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    service VARCHAR(255),
    resource_id VARCHAR(255),
    cost DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    date DATE NOT NULL,
    billing_period VARCHAR(10),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cost_data_user_id ON cost_data(user_id);
CREATE INDEX idx_cost_data_provider ON cost_data(provider);
CREATE INDEX idx_cost_data_date ON cost_data(date);
CREATE INDEX idx_cost_data_billing_period ON cost_data(billing_period);

-- Create provider_health table
CREATE TABLE provider_health (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    response_time_ms INTEGER,
    error_message TEXT,
    last_check TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_provider_health_user_id ON provider_health(user_id);
CREATE INDEX idx_provider_health_provider ON provider_health(provider);
CREATE INDEX idx_provider_health_last_check ON provider_health(last_check);

-- Create resources table
CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    details TEXT,
    terraform_output JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_resources_user_id ON resources(user_id);
CREATE INDEX idx_resources_status ON resources(status);

-- Create terraform_states table
CREATE TABLE terraform_states (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    state_data JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_terraform_states_resource_id ON terraform_states(resource_id);
```

### 6.2 Running Migrations

```bash
# Using the migration script
cd backend
python -m app.db.migrate

# Or manually with psql
psql -U postgres -d multicloud -f migrations/001_initial_schema.sql
```

---

## Summary

The database schema provides:

- ✅ **User isolation** - All resources belong to a user
- ✅ **Encrypted credentials** - AES-256 encryption for sensitive data
- ✅ **Flexible metadata** - JSON columns for provider-specific details
- ✅ **Optimized queries** - Indexes on common query patterns
- ✅ **Referential integrity** - Foreign keys with CASCADE DELETE
- ✅ **Audit trail** - Timestamps for creation and updates

**Next:** See [TERRAFORM.md](./TERRAFORM.md) for infrastructure provisioning documentation.
