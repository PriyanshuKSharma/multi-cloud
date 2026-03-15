# 🌌 Nebula: The Multi-Cloud Command Center

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=0A0A0A)](https://react.dev/)
[![Terraform](https://img.shields.io/badge/Terraform-1.5+-844FBA?style=for-the-badge&logo=terraform&logoColor=white)](https://www.terraform.io/)
[![License](https://img.shields.io/badge/License-Proprietary-555555?style=for-the-badge)](LICENSE)

Nebula is a high-performance, API-first orchestration engine designed to unify the fragmented multi-cloud landscape. It abstracts **AWS, Azure, and GCP** into a single control plane, enabling developers to provision, monitor, and troubleshoot infrastructure without leaving their cockpit.

---

## 🚀 Innovative Features for Modern Devs

### 🤖 Nebula AI Copilot (Built-in)

Troubleshoot deployment failures in real-time. Our integrated AI analyzes Terraform logs and provider errors to provide deterministic findings and one-click remediation steps.

- **Auto-Root Cause Analysis**: Scans `stderr` for IAM, Quota, and Credential issues.
- **Provider-Agnostic Intelligence**: Supports OpenAI, Gemini, Claude, and Custom LLM wrappers.

### 🛡️ Hardened Security Architecture

- **Fernet-Encrypted Vault**: Cloud credentials never touch the DB in plain text. We use AES-128 in CBC mode with HMAC for military-grade protection.
- **OAuth 2.0 & JWT**: Secure session management with role-based access control.

### ⚡ Async Provisioning Engine

Leveraging **Celery + Redis**, Nebula executes resource-intensive Terraform workflows in the background, providing live streaming status updates to the UI via a polling-optimized state machine.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph "The Cockpit (Frontend)"
        UI["React 19 + Vite"]
        Store["Context-Driven State"]
    end

    subgraph "The Engine (Backend)"
        API["FastAPI App (ASGI)"]
        Guard["JWT / Fernet Security"]
        Copilot["Nebula AI Assistant"]
    end

    subgraph "The Factory (Workers)"
        Redis["Redis (Broker)"]
        Queue["Celery Worker Farm"]
        Logic["Provisioning Logic"]
    end

    subgraph "Cloud Providers"
        AWS["AWS Provider"]
        AZ["Azure Provider"]
        GCP["GCP Provider"]
    end

    subgraph "Infrastructure"
        TF["Terraform Binary"]
        State["State Manager"]
    end

    UI <--> API
    API <--> Guard
    API <--> Copilot
    API --> Redis
    Redis --> Queue
    Queue --> Logic
    Logic --> TF
    TF --> State
    State <--> AWS & AZ & GCP
```

---

## 🛠️ Developer Interface (API Core)

Nebula is API-first. Every UI action is backed by a RESTful endpoint.

| Capability    | Method | Endpoint                  | Use Case                                 |
| :------------ | :----- | :------------------------ | :--------------------------------------- |
| **Cognition** | `POST` | `/assistant/query`        | Ask AI to troubleshoot a resource        |
| **Sync**      | `POST` | `/dashboard/sync/trigger` | Force cloud inventory refresh            |
| **Provision** | `POST` | `/resources/`             | Initiate Terraform workflow              |
| **Inventory** | `GET`  | `/inventory/vms`          | List cross-cloud virtual machines        |
| **Health**    | `GET`  | `/health`                 | Check service & background worker status |

---

## 🏎️ Rapid Deployment

### Initial Launch

```bash
git clone https://github.com/PriyanshuKSharma/multi-cloud.git
cp .env.example .env
docker compose up -d --build
```

### Smoke Test

Validate your installation instantly:

```bash
./test_apis.sh
```

---

## 📂 Engineering Layout

```text
multi-cloud/
├── backend/            # FastAPI + Celery Logic
│   ├── app/api/        # Modular Routers
│   ├── app/services/   # Cloud-Specific Sync Engines
│   └── app/tasks/      # Background Provisioning Tasks
├── frontend/           # React 19 + Framer Motion
│   ├── src/context/    # Theme and Auth Logic
│   └── src/pages/      # Dynamic Resource Management
├── terraform/          # Hardened Provider-Specific Modules
└── docs/              # In-depth Engineering Documentation
```

---

## 🗺️ Roadmap & Beyond

- [ ] Support for **Kubernetes Cluster Provisioning**.
- [ ] **AI Forecasting**: Predictive cost analysis based on usage patterns.
- [ ] **Drift Detection**: Automatic remediation of manual cloud changes.

---

### ⚖️ Legal & Trademarks

Distributed under a **Proprietary All-Rights-Reserved License**.
AWS, Azure, GCP, and other third-party marks are the property of their respective owners.
