# 🌌 Nebula: The Multi-Cloud Command Center

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg" alt="AWS logo" height="44" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg" alt="Microsoft Azure logo" height="44" />
  <img src="https://cdn.simpleicons.org/googlecloud/4285F4" alt="Google Cloud logo" height="44" />
  <img src="https://cdn.simpleicons.org/docker/2496ED" alt="Docker logo" height="44" />
  <img src="https://cdn.simpleicons.org/terraform/844FBA" alt="Terraform logo" height="44" />
  <img src="https://cdn.simpleicons.org/fastapi/009688" alt="FastAPI logo" height="44" />
  <img src="https://cdn.simpleicons.org/react/61DAFB" alt="React logo" height="44" />
  <img src="https://cdn.simpleicons.org/postgresql/4169E1" alt="PostgreSQL logo" height="44" />
  <img src="https://cdn.simpleicons.org/redis/DC382D" alt="Redis logo" height="44" />
  <img src="https://cdn.simpleicons.org/celery/37814A" alt="Celery logo" height="44" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.11+ badge" />
  <img src="https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI backend badge" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=0A0A0A" alt="React 19 badge" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 5 badge" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL 15 badge" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis 7 badge" />
  <img src="https://img.shields.io/badge/Terraform-1.5+-844FBA?style=for-the-badge&logo=terraform&logoColor=white" alt="Terraform 1.5+ badge" />
  <img src="https://img.shields.io/badge/DOI-10.56975%2Fijcrt.v14i4.305033-blue?style=for-the-badge&logo=doi&logoColor=white" alt="DOI badge" />
  <img src="https://img.shields.io/badge/Research-Published-success?style=for-the-badge&logo=read-the-docs&logoColor=white" alt="Research Published badge" />
</p>

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

## 🎓 Scientific Foundation

Nebula is more than just a tool; it is a peer-reviewed research project exploring the boundaries of cloud orchestration and infrastructure-as-code.

> [!NOTE] > **Research Paper:** _Nebula: A Multi-Cloud Provisioning and Orchestration Engine_ > **Published in:** International Journal of Creative Research Thoughts (IJCRT)
> **Volume:** 14 | **Issue:** 4 | **Date:** April 2026
>
> 🔗 [View Full Paper](http://www.ijcrt.org/viewfull.php?&p_id=IJCRT2604384) | 📄 [DOI: 10.56975/ijcrt.v14i4.305033](https://doi.org/10.56975/ijcrt.v14i4.305033)

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

```mermaid
flowchart LR
    UI[React + Vite Frontend] --> API[FastAPI API]
    API --> PG[(PostgreSQL)]
    API --> REDIS[(Redis)]
    API --> CW[Celery Worker]
    CW --> AWS[AWS APIs]
    CW --> AZ[Azure APIs]
    CW --> GCP[GCP APIs]
    CW --> TF[Terraform Modules]
```

Core backend routers:

- `auth`, `credentials`, `dashboard`, `inventory`, `billing`
- `resources`, `projects`, `deployments`, `blueprints`

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
./scripts/test_apis.sh
```

---

## 📂 Engineering Layout

## Repository Layout

```text
multi-cloud/
|-- backend/
|   |-- app/
|   |   |-- api/endpoints/
|   |   |-- core/
|   |   |-- db/
|   |   |-- models/
|   |   |-- schemas/
|   |   |-- services/
|   |   `-- tasks/
|   |-- main.py
|   `-- requirements.txt
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- context/
|   |   |-- pages/
|   |   `-- api/
|   `-- package.json
|-- terraform/modules/
|-- docs/
|-- scripts/
|-- docker-compose.yml
`-- docker-compose.prod.yml
```

---

## 🗺️ Roadmap & Beyond

- [ ] Support for **Kubernetes Cluster Provisioning**.
- [ ] **AI Forecasting**: Predictive cost analysis based on usage patterns.
- [ ] **Drift Detection**: Automatic remediation of manual cloud changes.

---

### ⚖️ Legal & Trademarks

Distributed under a **Proprietary All-Rights-Reserved License**. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
AWS, Azure, GCP, and other third-party marks are the property of their respective owners.
