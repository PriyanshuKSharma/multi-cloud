# Multi-Cloud SaaS Orchestration Platform 🚀

## Overview

A **production-ready, enterprise-grade** multi-cloud management platform that provides **real-time insights** from AWS, Azure, and GCP. Built for final-year major project evaluation with **zero mocked data** - every metric comes directly from cloud provider APIs.

## 🌟 Key Features

### ✅ Real-Time Cloud Integration

- **AWS**: EC2, S3, VPC, Cost Explorer
- **Azure**: Virtual Machines, Storage Accounts, Resource Groups
- **GCP**: Compute Engine, Cloud Storage, VPC Networks

### ✅ Live Dashboard

- Real resource counts from all providers
- Active VM monitoring
- Storage bucket tracking
- Monthly cost estimation
- Provider health status
- Recent activity timeline

### ✅ Automated Synchronization

- Background sync every 10 minutes via Celery
- Manual sync trigger on-demand
- Smart caching for fast UI response
- Provider health monitoring

### ✅ Cost Analytics

- Real billing data from cloud providers
- Cost breakdown by provider
- Cost breakdown by service type
- Monthly cost comparison

### ✅ Infrastructure as Code

- Terraform integration for resource deployment
- Real-time deployment logs
- State tracking and drift detection

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Cloud Providers                          │
│         AWS          Azure          GCP                      │
└────────────┬─────────┬──────────────┬────────────────────────┘
             │         │              │
             ▼         ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│              Background Sync (Celery Beat)                   │
│         Every 10 minutes + Manual Trigger                    │
└────────────┬─────────┬──────────────┬────────────────────────┘
             │         │              │
             ▼         ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                PostgreSQL Database                           │
│   ResourceInventory | CostData | ProviderHealth             │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                  FastAPI Backend                             │
│   /dashboard/stats | /inventory/* | /billing/*              │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                  React Frontend                              │
│   Dashboard | Resource Lists | Cost Charts                  │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Cloud provider accounts (AWS/Azure/GCP)
- Cloud credentials with appropriate permissions

### 1. Start All Services

```bash
# Clone and navigate to project
cd multi-cloud

# Start all services with Docker Compose
docker-compose up -d --build
```

This will start:

- **Backend API** (FastAPI) - http://localhost:8000
- **Frontend** (React + Vite) - http://localhost:5173
- **PostgreSQL** - localhost:5432
- **Redis** - localhost:6379
- **Celery Worker** (background sync)
- **Celery Beat** (scheduler)

### 2. Access the Application

Open your browser and navigate to:

- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs
- **API Health**: http://localhost:8000/health

### 3. Setup Cloud Credentials

1. **Create an account** or login
2. Navigate to **Settings** page
3. Add credentials for your cloud providers:

**AWS:**

- Access Key ID
- Secret Access Key
- Region (e.g., us-east-1)

**Azure:**

- Tenant ID
- Client ID
- Client Secret
- Subscription ID

**GCP:**

- Service Account JSON
- Project ID

### 4. Sync Resources

**Option A: Automatic Sync**

- Wait 10 minutes for the first automatic sync

**Option B: Manual Sync**

- Click the **"Sync Now"** button on the Dashboard
- Watch the sync progress in real-time

### 5. View Real Data

After sync completes, you'll see:

- ✅ Real resource counts
- ✅ Active VMs from your cloud accounts
- ✅ Storage buckets
- ✅ Cost data
- ✅ Provider health status
- ✅ Recent activity

## 📊 Dashboard Features

### Metric Cards

- **Total Resources**: Count of all resources across providers
- **Active VMs**: Running virtual machines
- **Storage Buckets**: S3, Blob Storage, Cloud Storage
- **Monthly Cost**: Estimated cost from billing APIs

### Provider Health

- Real-time API connectivity status
- Response time monitoring
- Error messages if connection fails
- Color-coded indicators (green/yellow/red)

### Cost Charts

- **Cost by Provider**: Bar chart showing spending per provider
- **Cost by Service**: Pie chart showing breakdown by service type

### Recent Activity

- Timeline of last 5 synced resources
- Resource type and provider badges
- Sync timestamps

## 🛠️ Technology Stack

### Backend

- **Framework**: FastAPI
- **Database**: PostgreSQL
- **Task Queue**: Celery + Redis
- **Cloud SDKs**: boto3 (AWS), azure-sdk (Azure), google-cloud (GCP)
- **ORM**: SQLAlchemy

### Frontend

- **Framework**: React + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Infrastructure

- **Containerization**: Docker + Docker Compose
- **IaC**: Terraform
- **Reverse Proxy**: Nginx (production)

## 📁 Project Structure

```
multi-cloud/
├── backend/
│   ├── app/
│   │   ├── models/              # Database models
│   │   │   ├── resource_inventory.py  # NEW: Resource cache
│   │   │   ├── resource.py            # Terraform resources
│   │   │   ├── user.py
│   │   │   └── credential.py
│   │   ├── services/            # Cloud provider integrations
│   │   │   ├── aws_sync.py      # NEW: AWS SDK
│   │   │   ├── azure_sync.py    # NEW: Azure SDK
│   │   │   ├── gcp_sync.py      # NEW: GCP SDK
│   │   │   └── terraform_runner.py
│   │   ├── tasks/               # Background jobs
│   │   │   ├── sync_tasks.py    # NEW: Periodic sync
│   │   │   └── terraform_tasks.py
│   │   ├── api/endpoints/       # REST API endpoints
│   │   │   ├── dashboard.py     # NEW: Dashboard stats
│   │   │   ├── inventory.py     # NEW: Resource inventory
│   │   │   ├── billing.py       # NEW: Cost data
│   │   │   ├── auth.py
│   │   │   ├── resources.py
│   │   │   └── credentials.py
│   │   ├── db/
│   │   │   ├── base.py
│   │   │   └── migrate.py       # NEW: DB migration
│   │   ├── worker.py            # Celery worker
│   │   └── main.py              # FastAPI app
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx    # UPDATED: Real data
│   │   │   ├── Login.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── CostCharts.tsx
│   │   │   ├── ResourceList.tsx
│   │   │   └── ...
│   │   └── api/
│   │       └── axios.ts
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── test_apis.sh              # NEW: API test script
└── README.md                 # This file
```

## 🔌 API Endpoints

### Dashboard

- `GET /dashboard/stats` - Get all dashboard metrics
- `POST /dashboard/sync/trigger` - Trigger manual sync

### Inventory

- `GET /inventory/vms?provider=aws&region=us-east-1` - List VMs
- `GET /inventory/storage?provider=azure` - List storage
- `GET /inventory/networks` - List networks
- `GET /inventory/{id}` - Get resource details

### Billing

- `GET /billing/costs?group_by=provider` - Get cost data
- `GET /billing/summary` - Monthly cost summary

### Resources (Terraform)

- `GET /resources/` - List deployed resources
- `POST /resources/` - Deploy new resource
- `DELETE /resources/{id}` - Destroy resource

### Authentication

- `POST /auth/signup` - Create account
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user

## 🧪 Testing

### Run API Tests

```bash
./test_apis.sh
```

### Manual API Testing

```bash
# Health check
curl http://localhost:8000/health

# Get dashboard stats (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/dashboard/stats

# Trigger manual sync
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/dashboard/sync/trigger
```

### View API Documentation

Open http://localhost:8000/docs for interactive Swagger UI

## 📝 Development

### Backend Development

```bash
cd backend

# Create virtual environment
python -m venv multi-venv
source multi-venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migration
python -m app.db.migrate

# Start development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Celery Workers (for background sync)

```bash
# Terminal 1: Start Celery worker
celery -A app.worker worker --loglevel=info

# Terminal 2: Start Celery Beat (scheduler)
celery -A app.worker beat --loglevel=info
```

## 🔐 Security

- JWT-based authentication
- Encrypted credential storage (AES-256)
- User isolation for multi-tenancy
- Rate limiting on provider APIs
- CORS configuration
- Environment variable management

## 🚦 Monitoring

### Check Service Status

```bash
docker-compose ps
```

### View Logs

```bash
# Backend logs
docker logs multi-cloud-backend-1 -f

# Celery worker logs
docker logs multi-cloud-celery_worker-1 -f

# Frontend logs
docker logs multi-cloud-frontend-1 -f
```

### Database Access

```bash
docker exec -it multi-cloud-db-1 psql -U postgres -d multicloud
```

## 🎯 Use Cases

1. **Multi-Cloud Resource Management**
   - View all resources across AWS, Azure, GCP in one place
   - Monitor resource status and health
   - Track costs across providers

2. **Infrastructure Deployment**
   - Deploy VMs and storage via Terraform
   - Track deployment status
   - View real-time logs

3. **Cost Optimization**
   - Analyze spending by provider and service
   - Compare monthly costs
   - Identify cost trends

4. **Provider Health Monitoring**
   - Real-time API connectivity status
   - Response time tracking
   - Automated health checks

## 🏆 Project Highlights

### For Final-Year Project Evaluation

✅ **Real-World Application**: Solves actual multi-cloud management challenges

✅ **Production-Ready**: Enterprise-grade architecture with proper error handling

✅ **No Mocked Data**: Every metric comes from real cloud provider APIs

✅ **Modern Tech Stack**: React, FastAPI, Docker, Celery, PostgreSQL

✅ **Scalable Design**: Background workers, caching, microservices-ready

✅ **Security**: JWT auth, encrypted credentials, user isolation

✅ **Documentation**: Comprehensive README, API docs, code comments

✅ **Testing**: API tests, health checks, monitoring

## 🤝 Contributing

This is a final-year major project. For questions or suggestions, please contact the project team.

## 📄 License

This project is created for academic purposes as part of a final-year major project.

## 🙏 Acknowledgments

- Cloud provider SDKs: AWS boto3, Azure SDK, Google Cloud SDK
- FastAPI framework
- React and Vite
- Celery for distributed task processing
- PostgreSQL database

---

## 📞 Support

For issues or questions:

1. Check the logs: `docker-compose logs`
2. View API docs: http://localhost:8000/docs
3. Test APIs: `./test_apis.sh`

---

**Built with ❤️ for Multi-Cloud Management**

_Last Updated: February 2026_
