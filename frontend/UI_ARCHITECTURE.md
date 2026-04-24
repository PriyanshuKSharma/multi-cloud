# Multi-Cloud SaaS Platform - UI Architecture

## 📋 Navigation Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                      GLOBAL LAYOUT                               │
│                                                                  │
│  ┌────────────────┐  ┌──────────────────────────────────────┐  │
│  │                │  │         TOP NAVIGATION BAR            │  │
│  │                │  │  • Project Selector                   │  │
│  │   SIDEBAR      │  │  • Global Search                      │  │
│  │   NAVIGATION   │  │  • Notifications                      │  │
│  │                │  │  • User Menu                          │  │
│  │  • Dashboard   │  └──────────────────────────────────────┘  │
│  │  • Projects    │                                             │
│  │  • Resources   │  ┌──────────────────────────────────────┐  │
│  │    - VMs       │  │                                       │  │
│  │    - Storage   │  │                                       │  │
│  │    - Networks  │  │        MAIN CONTENT AREA             │  │
│  │  • Deployments │  │                                       │  │
│  │  • Cost        │  │                                       │  │
│  │  • Accounts    │  │                                       │  │
│  │  • Activity    │  │                                       │  │
│  │  • Blueprints  │  │                                       │  │
│  │  • Settings    │  │                                       │  │
│  │                │  └──────────────────────────────────────┘  │
│  └────────────────┘                                             │
└─────────────────────────────────────────────────────────────────┘
```

## 🗂️ Complete Page Structure

### **1. Authentication & Onboarding**

- `/login` - Login page
- `/signup` - Registration page
- `/forgot-password` - Password recovery
- `/onboarding` - First-time setup wizard

### **2. Core Application**

- `/` - Dashboard (Overview)
- `/projects` - Projects list
- `/projects/:id` - Project detail

### **3. Cloud Accounts**

- `/accounts` - Cloud accounts management
- `/accounts/connect` - Connect new cloud account

### **4. Resources**

- `/resources/vms` - Virtual Machines list
- `/resources/vms/:id` - VM detail page
- `/resources/vms/create` - Create VM wizard
- `/resources/storage` - Storage resources
- `/resources/storage/:id` - Storage detail
- `/resources/storage/create` - Create storage
- `/resources/networks` - Network resources
- `/resources/networks/:id` - Network detail

### **5. Deployments**

- `/deployments` - Terraform deployments list
- `/deployments/:id` - Deployment detail with logs
- `/deployments/:id/retry` - Retry failed deployment

### **6. Cost & Billing**

- `/billing` - Cost overview
- `/billing/breakdown` - Detailed cost breakdown
- `/billing/budgets` - Budget management

### **7. Activity & Audit**

- `/activity` - Activity timeline
- `/audit` - Audit logs

### **8. Blueprints**

- `/blueprints` - Infrastructure templates
- `/blueprints/:id` - Template detail
- `/blueprints/:id/deploy` - Deploy template

### **9. Settings**

- `/settings/profile` - User profile
- `/settings/security` - Security settings
- `/settings/ssh-keys` - SSH key management
- `/settings/api-tokens` - API token management
- `/settings/preferences` - User preferences

## 🎨 Component Library

### **Layout Components**

- `AppLayout` - Main application shell
- `Sidebar` - Left navigation sidebar
- `Topbar` - Top navigation bar
- `PageHeader` - Page title and actions
- `PageContainer` - Content wrapper

### **Navigation Components**

- `NavItem` - Sidebar navigation item
- `NavGroup` - Grouped navigation items
- `Breadcrumbs` - Breadcrumb navigation
- `ProjectSwitcher` - Project dropdown selector
- `GlobalSearch` - Search modal

### **Data Display Components**

- `MetricCard` - Dashboard metric cards
- `ResourceCard` - Resource summary cards
- `DataTable` - Sortable, filterable tables
- `StatusBadge` - Status indicators
- `ProviderIcon` - Cloud provider logos
- `RegionBadge` - Region indicators
- `CostDisplay` - Formatted cost display

### **Chart Components**

- `LineChart` - Time-series charts
- `BarChart` - Comparison charts
- `PieChart` - Distribution charts
- `AreaChart` - Trend charts
- `SparkLine` - Inline mini charts

### **Form Components**

- `Input` - Text input
- `Select` - Dropdown select
- `MultiSelect` - Multi-select dropdown
- `Checkbox` - Checkbox input
- `Radio` - Radio button
- `Switch` - Toggle switch
- `DatePicker` - Date selection
- `CodeEditor` - Code/JSON editor

### **Feedback Components**

- `Modal` - Modal dialogs
- `ConfirmDialog` - Confirmation dialogs
- `Toast` - Toast notifications
- `Alert` - Alert messages
- `LoadingSpinner` - Loading indicators
- `Skeleton` - Skeleton loaders
- `EmptyState` - Empty state placeholders
- `ErrorBoundary` - Error boundaries

### **Resource Components**

- `VMCard` - VM resource card
- `VMDetailPanel` - VM details
- `VMActionsMenu` - VM actions (start/stop/destroy)
- `StorageCard` - Storage resource card
- `NetworkCard` - Network resource card
- `DeploymentCard` - Deployment card
- `LogViewer` - Live log streaming panel
- `TerraformStateViewer` - Terraform state display

### **Utility Components**

- `CopyButton` - Copy to clipboard
- `RefreshButton` - Manual refresh trigger
- `FilterBar` - Resource filtering
- `Pagination` - Table pagination
- `SortHeader` - Sortable table headers

## 📊 Dashboard Page Design

### **Widgets & Data Sources**

#### **1. Hero Metrics (Top Row)**

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Total        │ Active VMs   │ Storage      │ Monthly Cost │
│ Resources    │              │ Resources    │              │
│              │              │              │              │
│   47         │    12        │     8        │  $1,247.50   │
│   +5 today   │  ↑ 2 running │  ↓ 1 bucket  │  ↑ 8.5%     │
└──────────────┴──────────────┴──────────────┴──────────────┘

API: GET /dashboard/stats
Data: total_resources, active_vms, total_storage, estimated_monthly_cost
```

#### **2. Provider Distribution (Left Column)**

```
┌─────────────────────────────────────┐
│  Multi-Cloud Resource Distribution  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Pie Chart                 │   │
│  │   • AWS: 25 (53%)          │   │
│  │   • Azure: 15 (32%)        │   │
│  │   • GCP: 7 (15%)           │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘

API: GET /dashboard/stats
Data: provider_breakdown
```

#### **3. Cost Trends (Right Column)**

```
┌─────────────────────────────────────┐
│  Cost Trends (Last 30 Days)        │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Area Chart                │   │
│  │   Daily cost over time      │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘

API: GET /billing/costs?group_by=day
Data: daily cost breakdown
```

#### **4. Provider Health Status**

```
┌─────────────────────────────────────┐
│  Cloud Provider Health              │
│                                     │
│  AWS      ● Healthy    145ms       │
│  Azure    ● Healthy    230ms       │
│  GCP      ⚠ Degraded   1200ms      │
└─────────────────────────────────────┘

API: GET /dashboard/stats
Data: provider_health
```

#### **5. Recent Activity Feed**

```
┌─────────────────────────────────────┐
│  Recent Activity                    │
│                                     │
│  ● web-server-01 (AWS)             │
│    Running • us-east-1             │
│    2 minutes ago                   │
│                                     │
│  ● db-server-prod (Azure)          │
│    Stopped • eastus                │
│    15 minutes ago                  │
└─────────────────────────────────────┘

API: GET /dashboard/stats
Data: recent_activity
```

#### **6. Active Deployments**

```
┌─────────────────────────────────────┐
│  Active Deployments                 │
│                                     │
│  web-infra-prod                    │
│  ▓▓▓▓▓▓▓▓░░ 80% • Applying...     │
│                                     │
│  storage-backup                     │
│  ▓▓▓░░░░░░░ 30% • Planning...     │
└─────────────────────────────────────┘

API: GET /resources?status=provisioning
Data: Active Terraform jobs
```

## 🖥️ VM Management Page Design

### **VM List View**

```
┌─────────────────────────────────────────────────────────────┐
│  Virtual Machines                        [+ Create VM]      │
│                                                              │
│  Filters: [Provider ▼] [Region ▼] [Status ▼] [🔍 Search]   │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Name          Provider  Region      Status    Actions  │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ web-server-01  AWS      us-east-1   ● Running  [⋮]    │ │
│  │ t3.medium • 54.123.45.67                              │ │
│  │                                                        │ │
│  │ db-server-prod Azure    eastus      ■ Stopped  [⋮]    │ │
│  │ Standard_D2s_v3 • 10.0.1.10                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Showing 1-10 of 47                          [← 1 2 3 →]   │
└─────────────────────────────────────────────────────────────┘

API: GET /inventory/vms?provider=&region=&status=&skip=0&limit=10
Data: VM list with metadata
```

### **VM Detail View**

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to VMs                                              │
│                                                              │
│  web-server-01                          [Start] [Stop] [⋮]  │
│  AWS EC2 Instance • us-east-1 • ● Running                   │
│                                                              │
│  ┌──────────────────┬──────────────────────────────────┐   │
│  │ Overview         │ Security                         │   │
│  │                  │                                  │   │
│  │ Instance Type    │ Security Groups                  │   │
│  │ t3.medium        │ • sg-web-server                  │   │
│  │                  │ • sg-default                     │   │
│  │ Public IP        │                                  │   │
│  │ 54.123.45.67 📋  │ Firewall Rules                   │   │
│  │                  │ • SSH (22) from 0.0.0.0/0       │   │
│  │ Private IP       │ • HTTP (80) from 0.0.0.0/0      │   │
│  │ 10.0.1.25 📋     │ • HTTPS (443) from 0.0.0.0/0    │   │
│  │                  │                                  │   │
│  │ VPC              │ Tags                             │   │
│  │ vpc-abc123       │ Environment: production          │   │
│  │                  │ Team: backend                    │   │
│  │ Launch Time      │                                  │   │
│  │ Jan 15, 10:30 AM │                                  │   │
│  └──────────────────┴──────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Terraform State                                      │   │
│  │                                                      │   │
│  │ Status: Active                                       │   │
│  │ Last Apply: Jan 15, 10:35 AM                        │   │
│  │ State Version: 3                                     │   │
│  │                                                      │   │
│  │ [View Full State] [Download State]                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Live Logs                                            │   │
│  │                                                      │   │
│  │ [2024-02-11 22:00:00] Instance running              │   │
│  │ [2024-02-11 21:45:00] Health check passed           │   │
│  │ [2024-02-11 21:30:00] Security group updated        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

API: GET /inventory/{id}
Data: Full VM metadata, security groups, tags, Terraform state
```

### **Create VM Wizard**

```
┌─────────────────────────────────────────────────────────────┐
│  Create Virtual Machine                                     │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Step 1: Provider & Region                           │   │
│  │                                                      │   │
│  │ Cloud Provider *                                     │   │
│  │ ┌──────────┬──────────┬──────────┐                  │   │
│  │ │   AWS    │  Azure   │   GCP    │                  │   │
│  │ │ Selected │          │          │                  │   │
│  │ └──────────┴──────────┴──────────┘                  │   │
│  │                                                      │   │
│  │ Region *                                             │   │
│  │ [us-east-1 ▼]                                        │   │
│  │                                                      │   │
│  │ Instance Name *                                      │   │
│  │ [web-server-01_____________]                         │   │
│  │                                                      │   │
│  │ Instance Type *                                      │   │
│  │ [t3.medium ▼]                                        │   │
│  │ 2 vCPU • 4 GB RAM • $0.0416/hour                    │   │
│  │                                                      │   │
│  │ VPC *                                                │   │
│  │ [vpc-abc123 (production-vpc) ▼]                     │   │
│  │                                                      │   │
│  │ Subnet *                                             │   │
│  │ [subnet-xyz789 (public-subnet-1) ▼]                 │   │
│  │                                                      │   │
│  │ Security Groups *                                    │   │
│  │ [☑ sg-web-server ☑ sg-default]                      │   │
│  │                                                      │   │
│  │ SSH Key Pair *                                       │   │
│  │ [my-key-pair ▼]                                      │   │
│  │                                                      │   │
│  │                              [Cancel] [Create VM →]  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

API: POST /resources/
Data: VM configuration → Triggers Terraform provisioning
```

## 🔌 API Integration Strategy

### **State Management: TanStack Query (React Query)**

```typescript
// Example: Dashboard Stats
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ["dashboard", "stats"],
  queryFn: () => api.get("/dashboard/stats"),
  refetchInterval: 30000, // Refresh every 30 seconds
  staleTime: 10000,
});

// Example: VM List with Filters
const { data: vms } = useQuery({
  queryKey: ["inventory", "vms", { provider, region, status }],
  queryFn: () =>
    api.get("/inventory/vms", { params: { provider, region, status } }),
});

// Example: Create VM Mutation
const createVM = useMutation({
  mutationFn: (vmConfig) => api.post("/resources/", vmConfig),
  onSuccess: () => {
    queryClient.invalidateQueries(["inventory", "vms"]);
    toast.success("VM provisioning started");
  },
});
```

### **WebSocket for Live Logs**

```typescript
// Live deployment logs
useEffect(() => {
  const ws = new WebSocket(`ws://localhost:8000/ws/deployments/${id}/logs`);

  ws.onmessage = (event) => {
    setLogs((prev) => [...prev, event.data]);
  };

  return () => ws.close();
}, [id]);
```

## 📁 Frontend Architecture

```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Topbar.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   └── PageContainer.tsx
│   │   ├── navigation/
│   │   │   ├── NavItem.tsx
│   │   │   ├── NavGroup.tsx
│   │   │   ├── Breadcrumbs.tsx
│   │   │   ├── ProjectSwitcher.tsx
│   │   │   └── GlobalSearch.tsx
│   │   ├── data-display/
│   │   │   ├── MetricCard.tsx
│   │   │   ├── ResourceCard.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── ProviderIcon.tsx
│   │   │   └── CostDisplay.tsx
│   │   ├── charts/
│   │   │   ├── LineChart.tsx
│   │   │   ├── BarChart.tsx
│   │   │   ├── PieChart.tsx
│   │   │   └── AreaChart.tsx
│   │   ├── forms/
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── MultiSelect.tsx
│   │   │   └── DatePicker.tsx
│   │   ├── feedback/
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Alert.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── EmptyState.tsx
│   │   └── resources/
│   │       ├── VMCard.tsx
│   │       ├── VMDetailPanel.tsx
│   │       ├── StorageCard.tsx
│   │       ├── NetworkCard.tsx
│   │       ├── DeploymentCard.tsx
│   │       └── LogViewer.tsx
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   ├── Signup.tsx
│   │   │   └── ForgotPassword.tsx
│   │   ├── Dashboard.tsx
│   │   ├── projects/
│   │   │   ├── ProjectsList.tsx
│   │   │   └── ProjectDetail.tsx
│   │   ├── accounts/
│   │   │   ├── AccountsList.tsx
│   │   │   └── ConnectAccount.tsx
│   │   ├── resources/
│   │   │   ├── VirtualMachines.tsx
│   │   │   ├── VMDetail.tsx
│   │   │   ├── CreateVM.tsx
│   │   │   ├── Storage.tsx
│   │   │   └── Networks.tsx
│   │   ├── deployments/
│   │   │   ├── DeploymentsList.tsx
│   │   │   └── DeploymentDetail.tsx
│   │   ├── billing/
│   │   │   ├── CostOverview.tsx
│   │   │   └── CostBreakdown.tsx
│   │   ├── activity/
│   │   │   └── ActivityTimeline.tsx
│   │   ├── blueprints/
│   │   │   ├── BlueprintsList.tsx
│   │   │   └── BlueprintDetail.tsx
│   │   └── settings/
│   │       ├── Profile.tsx
│   │       ├── Security.tsx
│   │       └── APITokens.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useDashboard.ts
│   │   ├── useVMs.ts
│   │   ├── useDeployments.ts
│   │   └── useCosts.ts
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── dashboard.ts
│   │   ├── inventory.ts
│   │   ├── resources.ts
│   │   ├── billing.ts
│   │   └── credentials.ts
│   ├── types/
│   │   ├── api.ts
│   │   ├── resources.ts
│   │   └── billing.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   └── styles/
│       └── globals.css
```

## 🛠️ Implementation Roadmap

### **Phase 1: Foundation (Week 1)**

1. ✅ Enhanced global layout (Sidebar + Topbar)
2. ✅ Component library foundation
3. ✅ API client setup with React Query
4. ✅ Routing structure

### **Phase 2: Core Pages (Week 2)**

1. ✅ Dashboard with real data widgets
2. ✅ VM Management (list + detail + create)
3. ✅ Cloud Accounts management
4. ✅ Deployments page with logs

### **Phase 3: Advanced Features (Week 3)**

1. ✅ Cost & Billing pages
2. ✅ Storage & Networks pages
3. ✅ Activity timeline
4. ✅ Blueprints/Templates

### **Phase 4: Polish & Optimization (Week 4)**

1. ✅ Settings pages
2. ✅ Global search
3. ✅ Notifications system
4. ✅ Performance optimization
5. ✅ Responsive design refinement

---

**Next Steps:**

1. Create enhanced global layout
2. Build reusable component library
3. Implement Dashboard page
4. Implement VM Management pages
