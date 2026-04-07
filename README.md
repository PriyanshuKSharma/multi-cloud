# 🌌 Nebula: The Multi-Cloud Command Center

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=28&duration=2000&pause=1000&color=22D3EE&center=true&vCenter=true&width=1000&lines=%E2%98%81%EF%B8%8F+Multi-Cloud+Orchestration+%E2%9A%99%EF%B8%8F;%F0%9F%9F%A7+Amazon+Web+Services+(AWS);%F0%9F%9F%A6+Microsoft+Azure;%F0%9F%9F%A9+Google+Cloud+Platform+(GCP);%F0%9F%90%8B+Docker+%26+Containerization;%F0%9F%8F%97%EF%B8%8F+HashiCorp+Terraform;%E2%9A%A1+FastAPI+%26+Async+Python;%E2%9A%9B%EF%B8%8F+React+19+%26+Vite;%F0%9F%90%98+PostgreSQL+%26+Redis;%E2%9A%99%EF%B8%8F+Celery+Background+Workers" alt="Typing animation" />
</p>

<p align="center">
  <img src="https://skillicons.dev/icons?i=aws,azure,gcp,docker,terraform,fastapi,python,react,ts,postgres,redis,linux&theme=dark" alt="Nebula Tech Stack" />
  <img src="https://cdn.simpleicons.org/celery/37814A" alt="Celery" height="50" style="vertical-align: top; margin-left: -5px;" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Mainframe_Online-00F0FF?style=for-the-badge&logo=opsgenie&logoColor=white" alt="Status" />
  <img src="https://img.shields.io/badge/Security-AES_256_Encrypted-FF0055?style=for-the-badge&logo=dependabot&logoColor=white" alt="Security" />
  <img src="https://img.shields.io/badge/Engine-Terraform_1.5+-844FBA?style=for-the-badge&logo=terraform&logoColor=white" alt="Engine" />
</p>

---

## 📖 Project Manifesto

### **The Multi-Cloud Challenge**
As enterprises scale, infrastructure becomes fragmented across AWS, Azure, and GCP. Managing different consoles, creditial types, and billing models leads to **operational drift**, **security gaps**, and **cost transparency issues**.

### **The Nebula Solution**
Nebula is a research-driven, high-performance orchestration engine designed to democratize cloud operations. It provides a **Unified Control Plane** that abstracts complex provider APIs into a deterministic, single-pane-of-glass interface. 

<p align="center">
  <img src="docs/images/nebula_3d_banner.svg" alt="Nebula 3D Isometric Banner" width="100%" />
</p>


> *Nebula isn't just a dashboard—it's a mission-critical cockpit for the modern cloud architect.*

---

## 🚀 Innovative Features

### 🤖 **AI Copilot (Built-in Cognition)**
Never debug a "Terraform Apply" failure alone. Our integrated AI analyzes execution logs and cloud provider errors in real-time to provide:
- **Auto-Root Cause Analysis**: Identifies IAM, Quota, and Network conflicts.
- **One-Click Remediation**: Suggests valid configuration fixes based on provider-specific logic.

### 🛡️ **Military-Grade Security**
- **Credential Isolation**: Cloud secrets are encrypted using **Fernet AES-128 (CBC mode)** with HMAC. Plaintext keys never touch the persistence layer.
- **Stateless Authentication**: Hardened OAuth 2.0 and JWT implementation for secure cross-service communication.

### ⚡ **High-Concurrency Engine**
Leveraging a **Distributed Task Farm (Celery + Redis)**, Nebula manages resource-intensive cloud workflows in the background. A polling-optimized state machine provides live pulse updates to the React 19 UI.

---

## 🛠️ The Tech Arsenal

<div align="center">

| **Frontend** | **Backend** | **Infrastructure** | **DevOps** |
| :--- | :--- | :--- | :--- |
| ![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB) | ![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat-square&logo=fastapi) | ![AWS](https://img.shields.io/badge/AWS-232F3E?style=flat-square&logo=amazon-aws) | ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker) |
| ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript) | ![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white) | ![Azure](https://img.shields.io/badge/Azure-0089D6?style=flat-square&logo=microsoft-azure) | ![Terraform](https://img.shields.io/badge/Terraform-7B42BC?style=flat-square&logo=terraform) |
| ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite) | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql) | ![GCP](https://img.shields.io/badge/GCP-4285F4?style=flat-square&logo=google-cloud) | ![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis) |
| | ![Celery](https://img.shields.io/badge/Celery-37814A?style=flat-square&logo=celery&logoColor=white) | | |

</div>

### **Deep-Dive: The Nebula Tech Arsenal (Technical Details)**

#### **🎨 Frontend: The Cockpit**
- **⚛️ React 19 & Vite**: nebula leverages **React 19's concurrent rendering** capabilities to maintain a responsive UI during heavy data synchronization. **Vite** is utilized for its Lightning-fast Hot Module Replacement (HMR) and optimized build pipeline, ensuring a frictionless developer experience.
- **💅 Tailwind CSS & Framer Motion**: Provides a highly-customizable design system with **glassmorphism** aesthetics. We use Framer Motion for micro-animations that signal state changes from the multi-cloud backend.

#### **⚙️ Backend: The Orchestration Engine**
- **⚡ FastAPI (Python 3.11+)**: Chosen for its native **async/await** support and Pydantic-driven data validation. It acts as the ASGI entry point, providing high-concurrency handling for cloud resource management and AI interactions.
- **🧠 AI Copilot Core**: A specialized module that interfaces with LLMs (OpenAI/Gemini) to perform **log-semantic analysis**. It translates cryptic Terraform or Cloud Provider errors into human-understandable remediation paths.

#### **🏭 Async & Background Logic**
- **⚙️ Celery & Redis**: Nebula implements a **distributed task worker architecture**. Redis serves as a high-speed message broker, while Celery handles periodic cloud inventory synchronization (via Celery Beat) and idempotent infrastructure provisioning tasks.
- **🚄 Real-time State Polling**: Instead of static loads, the frontend implements an **optimized polling state machine** that communicates with the Backend to reflect the live status of background provisioning.

#### **🐘 Persistence & Security**
- **📊 PostgreSQL 15**: The primary relational engine. It stores complex cloud resource topologies, deployment history, and user metadata with optimized indexing for cross-cloud inventory searches.
- **🛡️ Fernet AES-128 Guard**: A security-first implementation where cloud provider credentials (API Keys, Secrets) are **encrypted at the application layer** before storage. We utilize salted CBC mode with HMAC for integrity verification.

#### **🏗️ Infrastructure & DevOps**
- **🏗️ Terraform (v1.5+)**: The core IaC engine. Nebula dynamically generates Terraform configuration files, manages **tfstate** files within a secured backend, and streams execution logs directly to the UI.
- **🐋 Docker & Compose**: Ensures environment parity across "Dev, Stage, and Prod". The entire stack is containerized, facilitating rapid deployment and consistent behavior across different host environments.

---

## 🏗️ Technical Architecture

```mermaid
graph TD
    subgraph "🌌 NEBULA COCKPIT (Frontend)"
        UI["React 19 + Vite"]
        Store["State Machine"]
    end

    subgraph "⚙️ ORCHESTRATION ENGINE (Backend)"
        API["FastAPI (ASGI)"]
        Guard["Fernet Guard"]
        AI["AI Copilot"]
    end

    subgraph "🏭 WORKER FARM (Execution)"
        Redis(("Redis Broker"))
        Worker["Celery Node"]
        TF["Terraform Binary"]
    end

    UI <--> API
    API <--> Guard
    API <--> AI
    API --> Redis
    Redis --> Worker
    Worker --> TF
    
    TF --- AWS["AWS Cloud"]
    TF --- AZ["Azure Cloud"]
    TF --- GCP["GCP Cloud"]

    style UI fill:#1a1a2e,stroke:#00f0ff,stroke-width:2px,color:#fff
    style API fill:#1a1a2e,stroke:#7000ff,stroke-width:2px,color:#fff
    style Worker fill:#1a1a2e,stroke:#ff0055,stroke-width:2px,color:#fff
    style Redis fill:#00f0ff,stroke:#fff,stroke-width:2px,color:#000
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

## 🏁 Execution Protocol (Launch)

```bash
# 1. Initialize the Mainframe
git clone https://github.com/PriyanshuKSharma/multi-cloud.git
cp .env.example .env

# 2. Deploy via Docker
docker compose up -d --build

# 3. Synchronize Cloud Inventory
./scripts/test_apis.sh
```

---

## 🗂️ Engineering Layout

```text
multi-cloud/
├── 🧠 backend/         # FastAPI, Celery, AI Logic
├── 🎨 frontend/        # React 19, Tailwind, Context
├── 🏗️ terraform/       # Provider Modules
├── 📜 docs/            # Technical Specifications
└── 🛠️ scripts/          # Automation & Diagnostics
```

---

## 🗺️ Future Protocol (Roadmap)
- [ ] **K8s Nexus**: Automated Kubernetes Cluster Provisioning across Hybrid Clouds.
- [ ] **Cost Forecasting**: Predictive ML models for usage and billing patterns.
- [ ] **Dynamic Drift Detection**: Automatic remediation of manual out-of-band changes.

---

### ⚖️ Legal & Trademarks
Distributed under a **Proprietary All-Rights-Reserved License**. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
AWS, Azure, GCP, and other third-party marks are the property of their respective owners.

<p align="right">
  <i>Maintained by the Nebula Core Team</i>
</p>
