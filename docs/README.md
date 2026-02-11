# Multi-Cloud SaaS Orchestration Platform - Complete Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Backend Documentation](#3-backend-documentation)
4. [Frontend Documentation](#4-frontend-documentation)
5. [Database Schema](#5-database-schema)
6. [API Reference](#6-api-reference)
7. [Cloud Provider Integration](#7-cloud-provider-integration)
8. [Terraform Integration](#8-terraform-integration)
9. [Celery & Background Jobs](#9-celery--background-jobs)
10. [Security & Secrets](#10-security--secrets)
11. [Deployment Guide](#11-deployment-guide)
12. [Development Guide](#12-development-guide)

---

## 1. Project Overview

### 1.1 Introduction

The **Multi-Cloud SaaS Orchestration Platform** is an enterprise-grade infrastructure management system that provides unified control over AWS, Azure, and GCP resources. It combines real-time cloud resource synchronization, Terraform-based infrastructure provisioning, cost analytics, and comprehensive monitoring in a single, intuitive interface.

### 1.2 Key Features

- ✅ **Multi-Cloud Resource Management** - Unified view of AWS, Azure, GCP resources
- ✅ **Real-Time Synchronization** - Automatic resource discovery every 10 minutes
- ✅ **Infrastructure as Code** - Terraform-based provisioning with state management
- ✅ **Cost Analytics** - Real billing data from cloud provider APIs
- ✅ **Provider Health Monitoring** - API connectivity and response time tracking
- ✅ **Live Deployment Logs** - Real-time Terraform plan/apply output
- ✅ **Secure Credential Management** - AES-256 encrypted cloud credentials
- ✅ **RESTful API** - Complete API for programmatic access
- ✅ **Modern UI** - React-based dashboard with real-time updates

### 1.3 Technology Stack

**Backend:**

- **Framework:** FastAPI (Python 3.11+)
- **Database:** PostgreSQL 15
- **Cache/Queue:** Redis 7
- **Task Queue:** Celery with Beat scheduler
- **ORM:** SQLAlchemy 2.0
- **Cloud SDKs:** boto3 (AWS), azure-sdk (Azure), google-cloud (GCP)
- **IaC:** Terraform 1.5+

**Frontend:**

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS 3
- **State Management:** TanStack Query (React Query)
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Icons:** Lucide React

**Infrastructure:**

- **Containerization:** Docker + Docker Compose
- **Web Server:** Uvicorn (ASGI)
- **Reverse Proxy:** Nginx (production)

### 1.4 Use Cases

1. **Multi-Cloud Resource Discovery** - Automatically discover and catalog all resources across AWS, Azure, and GCP
2. **Infrastructure Provisioning** - Deploy VMs, storage, and networks using Terraform templates
3. **Cost Optimization** - Track spending across providers and identify cost-saving opportunities
4. **Compliance Monitoring** - Audit resource configurations and track changes
5. **Disaster Recovery** - Maintain infrastructure state and enable quick recovery

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLOUD PROVIDERS                              │
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │
│  │     AWS      │    │    Azure     │    │     GCP      │         │
│  │              │    │              │    │              │         │
│  │ • EC2        │    │ • VMs        │    │ • Compute    │         │
│  │ • S3         │    │ • Storage    │    │ • Storage    │         │
│  │ • VPC        │    │ • VNet       │    │ • VPC        │         │
│  │ • Cost API   │    │ • Cost Mgmt  │    │ • Billing    │         │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘         │
│         │                   │                   │                  │
└─────────┼───────────────────┼───────────────────┼──────────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKGROUND SYNC LAYER                             │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Celery Beat Scheduler                      │  │
│  │              (Triggers sync every 10 minutes)                 │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                           │                                         │
│  ┌────────────────────────┴─────────────────────────────────────┐  │
│  │                    Celery Workers                             │  │
│  │                                                               │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │  │
│  │  │  AWS Sync    │  │ Azure Sync   │  │  GCP Sync    │       │  │
│  │  │  Service     │  │  Service     │  │  Service     │       │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘       │  │
│  │                                                               │  │
│  │  ┌──────────────────────────────────────────────────────┐    │  │
│  │  │         Terraform Provisioning Tasks              │    │  │
│  │  └──────────────────────────────────────────────────────┘    │  │
│  └───────────────────────────┬───────────────────────────────────┘  │
└────────────────────────────┬─┴──────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                    │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    PostgreSQL Database                        │  │
│  │                                                               │  │
│  │  • Users & Authentication                                     │  │
│  │  • Cloud Credentials (encrypted)                              │  │
│  │  • Resource Inventory (cached cloud resources)                │  │
│  │  • Cost Data (billing information)                            │  │
│  │  • Provider Health (API status)                               │  │
│  │  • Terraform States                                           │  │
│  │  • Deployment History                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                         Redis                                 │  │
│  │                                                               │  │
│  │  • Celery Task Queue                                          │  │
│  │  • Session Storage                                            │  │
│  │  • Cache Layer                                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API LAYER                                     │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    FastAPI Backend                            │  │
│  │                                                               │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │  │
│  │  │  Auth API      │  │ Dashboard API  │  │ Inventory API  │ │  │
│  │  │  /auth/*       │  │ /dashboard/*   │  │ /inventory/*   │ │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘ │  │
│  │                                                               │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │  │
│  │  │ Resources API  │  │  Billing API   │  │ Credentials API│ │  │
│  │  │ /resources/*   │  │  /billing/*    │  │ /credentials/* │ │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘ │  │
│  │                                                               │  │
│  │  • JWT Authentication                                         │  │
│  │  • Request Validation (Pydantic)                              │  │
│  │  • CORS Middleware                                            │  │
│  │  • Error Handling                                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                               │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    React Frontend                             │  │
│  │                                                               │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │  Dashboard  │  VMs  │  Storage  │  Deployments  │ Costs│  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                                                               │  │
│  │  • Real-time data updates (React Query)                      │  │
│  │  • WebSocket for live logs                                   │  │
│  │  • Responsive UI (Tailwind CSS)                              │  │
│  │  • Interactive charts (Recharts)                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow Diagram

```
┌─────────────┐
│   User      │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. HTTP Request
       ▼
┌─────────────────────────────────────────┐
│         FastAPI Backend                 │
│                                         │
│  2. Authenticate (JWT)                  │
│  3. Validate Request (Pydantic)         │
│  4. Query Database                      │
└──────┬──────────────────────────────────┘
       │
       │ 5. SQL Query
       ▼
┌─────────────────────────────────────────┐
│         PostgreSQL                      │
│                                         │
│  6. Fetch cached resource data          │
│     (from resource_inventory table)     │
└──────┬──────────────────────────────────┘
       │
       │ 7. Return data
       ▼
┌─────────────────────────────────────────┐
│         FastAPI Backend                 │
│                                         │
│  8. Format response (JSON)              │
│  9. Send HTTP response                  │
└──────┬──────────────────────────────────┘
       │
       │ 10. JSON Response
       ▼
┌─────────────┐
│   React     │
│  Frontend   │
│             │
│  11. Update UI with real data           │
└─────────────┘


BACKGROUND SYNC FLOW:
═════════════════════

┌─────────────────────────────────────────┐
│      Celery Beat Scheduler              │
│                                         │
│  Every 10 minutes:                      │
│  - Trigger sync_all_users_resources()   │
└──────┬──────────────────────────────────┘
       │
       │ Enqueue task
       ▼
┌─────────────────────────────────────────┐
│         Celery Worker                   │
│                                         │
│  For each user with credentials:        │
│  1. sync_aws_resources(user_id)         │
│  2. sync_azure_resources(user_id)       │
│  3. sync_gcp_resources(user_id)         │
└──────┬──────────────────────────────────┘
       │
       │ Call cloud APIs
       ▼
┌─────────────────────────────────────────┐
│      Cloud Provider APIs                │
│                                         │
│  AWS: EC2.describe_instances()          │
│  Azure: ComputeManagementClient.list()  │
│  GCP: compute.instances().list()        │
└──────┬──────────────────────────────────┘
       │
       │ Return resources
       ▼
┌─────────────────────────────────────────┐
│         Celery Worker                   │
│                                         │
│  Transform & normalize data             │
│  Upsert to database                     │
└──────┬──────────────────────────────────┘
       │
       │ SQL INSERT/UPDATE
       ▼
┌─────────────────────────────────────────┐
│         PostgreSQL                      │
│                                         │
│  resource_inventory table updated       │
│  - VMs, storage, networks               │
│  - Metadata, IPs, regions               │
│  - Last synced timestamp                │
└─────────────────────────────────────────┘
```

### 2.3 Component Interaction Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                  │
│                                                                   │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐            │
│  │ Dashboard  │───▶│ React Query│───▶│ Axios API  │            │
│  │ Component  │    │  (Cache)   │    │  Client    │            │
│  └────────────┘    └────────────┘    └──────┬─────┘            │
│                                              │                   │
└──────────────────────────────────────────────┼───────────────────┘
                                               │
                                               │ HTTP/JSON
                                               │
┌──────────────────────────────────────────────┼───────────────────┐
│                         BACKEND              │                   │
│                                              ▼                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │              FastAPI Application                       │     │
│  │                                                         │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │     │
│  │  │ Middleware   │  │   Routers    │  │  Dependencies│ │     │
│  │  │              │  │              │  │              │ │     │
│  │  │ • CORS       │  │ • /auth      │  │ • get_db()   │ │     │
│  │  │ • Auth       │  │ • /dashboard │  │ • get_user() │ │     │
│  │  │ • Logging    │  │ • /inventory │  │              │ │     │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │     │
│  │                                                         │     │
│  │  ┌──────────────────────────────────────────────────┐  │     │
│  │  │            Endpoint Handlers                     │  │     │
│  │  │                                                  │  │     │
│  │  │  def get_dashboard_stats(db, user):             │  │     │
│  │  │      stats = db.query(ResourceInventory)...     │  │     │
│  │  │      return stats                               │  │     │
│  │  └──────────────────────────────────────────────────┘  │     │
│  └─────────────────────────┬───────────────────────────────┘     │
│                            │                                     │
│                            ▼                                     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │              SQLAlchemy ORM                            │     │
│  │                                                         │     │
│  │  session.query(ResourceInventory)                      │     │
│  │         .filter(user_id == current_user.id)            │     │
│  │         .all()                                         │     │
│  └─────────────────────────┬───────────────────────────────┘     │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                      POSTGRESQL                                   │
│                                                                   │
│  Tables:                                                          │
│  • users                                                          │
│  • credentials                                                    │
│  • resource_inventory ◀── Main cache table                       │
│  • cost_data                                                      │
│  • provider_health                                                │
│  • terraform_states                                               │
│  • resources (Terraform deployments)                              │
└──────────────────────────────────────────────────────────────────┘


CELERY WORKER INTERACTION:
═══════════════════════════

┌──────────────────────────────────────────────────────────────────┐
│                      CELERY BEAT                                  │
│                                                                   │
│  Periodic Tasks (crontab):                                        │
│  • sync_all_users_resources() - Every 10 minutes                  │
│  • cleanup_old_logs() - Daily at midnight                         │
└────────────────────────┬──────────────────────────────────────────┘
                         │
                         │ Enqueue to Redis
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                         REDIS                                     │
│                                                                   │
│  Task Queue:                                                      │
│  • celery:tasks (pending tasks)                                   │
│  • celery:results (task results)                                  │
└────────────────────────┬──────────────────────────────────────────┘
                         │
                         │ Dequeue task
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                      CELERY WORKER                                │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐      │
│  │  @shared_task                                          │      │
│  │  def sync_aws_resources(user_id):                      │      │
│  │      credentials = get_credentials(user_id, 'aws')     │      │
│  │      ec2_client = boto3.client('ec2', ...)             │      │
│  │      instances = ec2_client.describe_instances()       │      │
│  │      for instance in instances:                        │      │
│  │          upsert_to_db(instance)                        │      │
│  └────────────────────────────────────────────────────────┘      │
│                                                                   │
│  Services:                                                        │
│  • aws_sync.py                                                    │
│  • azure_sync.py                                                  │
│  • gcp_sync.py                                                    │
└────────────────────────┬──────────────────────────────────────────┘
                         │
                         │ Write to DB
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                      POSTGRESQL                                   │
│                                                                   │
│  INSERT INTO resource_inventory (...)                             │
│  ON CONFLICT (resource_id) DO UPDATE ...                          │
└──────────────────────────────────────────────────────────────────┘
```

### 2.4 Request Flow Example

**Example: User views Dashboard**

```
1. User opens browser → http://localhost:5173

2. React app loads → Dashboard.tsx component mounts

3. useQuery hook triggers:
   queryFn: () => api.get('/dashboard/stats')

4. Axios sends HTTP GET request:
   GET http://localhost:8000/dashboard/stats
   Headers: { Authorization: "Bearer eyJ0eXAi..." }

5. FastAPI receives request:
   - CORS middleware: Allow origin
   - Auth middleware: Verify JWT token
   - Extract user from token

6. Route handler executes:
   @router.get("/dashboard/stats")
   def get_dashboard_stats(db: Session, user: User):
       # Query database
       total_resources = db.query(ResourceInventory)
                          .filter_by(user_id=user.id)
                          .count()

       active_vms = db.query(ResourceInventory)
                     .filter_by(user_id=user.id, type='vm', status='running')
                     .count()

       # ... more queries

       return DashboardStatsResponse(
           total_resources=total_resources,
           active_vms=active_vms,
           ...
       )

7. SQLAlchemy executes SQL:
   SELECT COUNT(*) FROM resource_inventory
   WHERE user_id = 1;

8. PostgreSQL returns results

9. FastAPI formats response:
   {
     "total_resources": 47,
     "active_vms": 12,
     "total_storage": 8,
     ...
   }

10. Response sent to frontend

11. React Query caches response

12. Dashboard component re-renders with real data

13. UI updates:
    - Metric cards show: 47 resources, 12 VMs, etc.
    - Charts render with cost data
    - Provider health indicators update
```

---

## 3. Backend Documentation

See [BACKEND.md](./BACKEND.md) for detailed backend documentation.

---

## 4. Frontend Documentation

See [FRONTEND.md](./FRONTEND.md) for detailed frontend documentation.

---

## 5. Database Schema

See [DATABASE.md](./DATABASE.md) for complete database schema documentation.

---

## 6. API Reference

See [API.md](./API.md) for complete API reference.

---

## 7. Cloud Provider Integration

See [CLOUD_PROVIDERS.md](./CLOUD_PROVIDERS.md) for cloud provider integration details.

---

## 8. Terraform Integration

See [TERRAFORM.md](./TERRAFORM.md) for Terraform integration documentation.

---

## 9. Celery & Background Jobs

See [CELERY.md](./CELERY.md) for Celery and background job documentation.

---

## 10. Security & Secrets

See [SECURITY.md](./SECURITY.md) for security and secrets management documentation.

---

## 11. Deployment Guide

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions.

---

## 12. Development Guide

See [DEVELOPMENT.md](./DEVELOPMENT.md) for development setup and guidelines.

---

## Quick Links

- [Architecture Overview](#2-architecture)
- [API Reference](./API.md)
- [Database Schema](./DATABASE.md)
- [Development Guide](./DEVELOPMENT.md)
- [Deployment Guide](./DEPLOYMENT.md)

---

**Last Updated:** February 2026  
**Version:** 1.0.0  
**Maintained by:** Multi-Cloud Platform Team
