import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Book,
  Cloud,
  CreditCard,
  Database,
  DollarSign,
  FileCode,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  MessageSquare,
  Network,
  Rocket,
  Server,
  Settings,
  Terminal,
  UserRound,
  Zap,
} from 'lucide-react';

export type ServiceGuideStep = {
  title: string;
  details: string[];
  expected?: string;
};

export type ServiceGuide = {
  id: string;
  name: string;
  description: string;
  category?: string;
  icon: LucideIcon;
  route?: string;
  createRoute?: string;
  summary: string;
  prerequisites: string[];
  steps: ServiceGuideStep[];
  troubleshooting?: string[];
};

export const docsServiceGuides: ServiceGuide[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Multi-cloud overview and KPIs.',
    icon: LayoutDashboard,
    route: '/',
    summary:
      'Dashboard is the command center for your workspace. It aggregates resource counts, estimated spend, provider health, and recent activity into a single view.',
    prerequisites: ['You must be logged in.', 'Connect at least one cloud account to populate inventory and cost charts.'],
    steps: [
      {
        title: 'Open the Dashboard',
        details: ['Use the sidebar and click Dashboard (or navigate to `/`).'],
        expected: 'You see KPI cards, charts, provider health signals, and recent activity sections.',
      },
      {
        title: 'Read the KPI cards',
        details: [
          'Scan Total Resources and Active VMs to understand overall footprint.',
          'Check Storage Resources and Monthly Cost for a quick cost/scale signal.',
          'If values are 0, it usually means inventory sync has not run yet.',
        ],
      },
      {
        title: 'Inspect charts and breakdowns',
        details: [
          'Use Multi-Cloud Distribution to see which providers dominate your estate.',
          'Check cost charts (by provider/service) to spot anomalies or growth.',
          'Use region distribution to see where your resources are concentrated.',
        ],
      },
      {
        title: 'Validate provider health',
        details: [
          'Review provider health status and response times.',
          'If a provider shows errors, re-check Cloud Accounts permissions and connectivity.',
        ],
      },
      {
        title: 'Refresh data safely',
        details: [
          'Click Refresh to re-fetch the latest dashboard stats.',
          'If you recently provisioned something, wait for deployments to complete and refresh again.',
        ],
        expected: 'KPIs and timestamps update after refresh.',
      },
      {
        title: 'Jump into operations',
        details: [
          'Use Cloud Console for log-driven troubleshooting.',
          'Use Projects to group resources and keep ownership clear.',
        ],
      },
    ],
    troubleshooting: [
      'If the dashboard fails to load, check backend `/dashboard/stats` availability and authentication.',
      'If charts look empty, connect a cloud account and wait for the next inventory sync cycle.',
    ],
  },
  {
    id: 'projects',
    name: 'Projects',
    description: 'Workspaces, ownership, and grouping.',
    icon: FolderKanban,
    route: '/projects',
    summary:
      'Projects are the workspace boundary for your infrastructure. Provisioned resources and deployments are tracked against a project.',
    prerequisites: [
      'You must be logged in.',
      'If you are on the Basic plan, keep in mind the 5 project limit.',
    ],
    steps: [
      {
        title: 'Open the Projects page',
        details: [
          'Use the left sidebar and click Projects.',
          'Use the search bar to filter by name if you have many projects.',
        ],
        expected: 'You see a table/list of your existing projects (or an empty state).',
      },
      {
        title: 'Create a new project (optional)',
        details: [
          'Click New Project.',
          'Provide a short, unique name (2+ characters).',
          'Add an optional description to clarify ownership/purpose.',
          'Save to create the workspace.',
        ],
        expected: 'The project appears in the list and becomes available for provisioning flows.',
      },
      {
        title: 'Open project details to inspect resources',
        details: [
          'Click the View or Details action on a project.',
          'Review the Resources in this project section to see all attached resource records.',
          'Use the links to jump into deployment logs when debugging a resource.',
        ],
        expected: 'You can see which resources Nebula is tracking inside the project.',
      },
      {
        title: 'Set the current project (recommended)',
        details: [
          'From the project detail view, click Set Current Project.',
          'This helps pre-select the project during provisioning forms.',
        ],
        expected: 'New resource forms default to the project you selected.',
      },
      {
        title: 'Edit a project',
        details: [
          'From the project detail view, click Edit Project.',
          'Update the name/description and save changes.',
        ],
        expected: 'The updated metadata is reflected across the UI and activity history.',
      },
      {
        title: 'Delete a project (and its resource records)',
        details: [
          'From the project detail view, click Delete Project.',
          'Confirm the dialog. Nebula will remove the project and all resource records attached to it.',
          'If you want to destroy real cloud resources, do that first (or from the provider console) before removing tracking records.',
        ],
        expected: 'The project is removed and its tracked resource records no longer appear in the workspace.',
      },
    ],
    troubleshooting: [
      'If you hit a plan limit error, delete an unused project or upgrade your subscription plan.',
      'If a project detail view shows no resources but you expected some, verify you provisioned into the correct project.',
    ],
  },
  {
    id: 'cloud-accounts',
    name: 'Cloud Accounts',
    description: 'Connect AWS/Azure/GCP credentials.',
    icon: Cloud,
    route: '/accounts',
    summary:
      'Cloud accounts store provider credentials. Inventory sync and provisioning require at least one connected cloud account.',
    prerequisites: [
      'You must be logged in.',
      'Have provider credentials ready (AWS access keys, Azure service principal, GCP service account JSON).',
      'Basic plan allows 1 cloud account connection.',
    ],
    steps: [
      {
        title: 'Open Cloud Accounts',
        details: ['Use the sidebar and click Cloud Accounts.'],
        expected: 'You see a list of connected provider accounts (or none).',
      },
      {
        title: 'Add a new account',
        details: [
          'Click Add Account.',
          'Choose provider (AWS, Azure, or GCP).',
          'Fill the credential fields in the modal and submit.',
        ],
        expected: 'A new account appears and becomes usable for provisioning and sync.',
      },
      {
        title: 'Refresh the account list',
        details: [
          'Click Refresh to re-fetch the latest connectivity state.',
          'Use the Last synced field to confirm freshness.',
        ],
        expected: 'Statuses and timestamps update.',
      },
      {
        title: 'Disconnect an account',
        details: [
          'Click the trash/delete action next to an account.',
          'Confirm the dialog to remove the credentials from Nebula.',
          'Disconnecting can impact provisioning and inventory sync for that provider.',
        ],
        expected: 'The account is removed and can no longer be used by the platform.',
      },
    ],
    troubleshooting: [
      'If you see a limit error on Basic plan, remove an existing account or switch to Professional/Enterprise.',
      'If provisioning fails after adding credentials, verify permissions/scopes and try again.',
    ],
  },
  {
    id: 'virtual-machines',
    name: 'Virtual Machines',
    description: 'Provision compute instances.',
    icon: Server,
    route: '/resources/vms',
    createRoute: '/resources/vms/create',
    summary:
      'Provision a VM into your selected cloud provider. VM provisioning creates a deployment job that you can track in Deployments.',
    prerequisites: [
      'At least one cloud account must be connected.',
      'Have a project selected (or create a new one in the form).',
    ],
    steps: [
      {
        title: 'Open Virtual Machines',
        details: ['Go to Resources > Virtual Machines.'],
        expected: 'You see the VM inventory list and filters.',
      },
      {
        title: 'Start a VM provisioning flow',
        details: ['Click Create VM.'],
        expected: 'You land on the Create VM form.',
      },
      {
        title: 'Choose the project workspace',
        details: [
          'Pick Current project to provision into an existing project.',
          'Or choose New project to create a workspace first, then provision into it.',
        ],
        expected: 'The VM will be tracked under the selected project.',
      },
      {
        title: 'Select provider, region, and instance type',
        details: [
          'Choose AWS, Azure, or GCP.',
          'Select a region that matches your compliance/latency needs.',
          'Choose an instance type (free-tier options are highlighted for AWS).',
        ],
        expected: 'The form summary reflects the selected provider/region/size.',
      },
      {
        title: 'Add optional advanced configuration',
        details: [
          'If needed, set AMI, VPC/subnet, SSH key name, and security group(s).',
          'Keep defaults if you are learning or testing.',
        ],
      },
      {
        title: 'Provision and monitor deployment',
        details: [
          'Submit the form to trigger provisioning.',
          'You will be redirected to Deployments to monitor logs and status.',
          'If a deployment fails, inspect error output and fix credentials/quotas/region settings.',
        ],
        expected: 'A deployment job is created and progresses to completed or failed.',
      },
      {
        title: 'Verify the VM in inventory',
        details: [
          'Return to the Virtual Machines list.',
          'Confirm the new VM appears with provider, region, and status.',
          'Open the VM detail view for IPs and metadata (when available).',
        ],
        expected: 'The VM appears in the inventory list after provisioning and/or sync.',
      },
    ],
    troubleshooting: [
      'If you get a 403 plan-limit error, upgrade your plan or delete an existing project to free capacity.',
      'If the deployment shows credential or quota errors, re-check provider access and retry.',
    ],
  },
  {
    id: 'storage',
    name: 'Storage Buckets',
    description: 'Create object storage buckets.',
    icon: Database,
    route: '/resources/storage',
    createRoute: '/resources/storage/create',
    summary:
      'Create an object storage bucket (S3, Azure Storage, or GCP Cloud Storage) and track it under a project.',
    prerequisites: ['At least one cloud account must be connected.', 'Have a project selected or create one from the form.'],
    steps: [
      {
        title: 'Open Storage',
        details: ['Go to Resources > Storage.'],
        expected: 'You see the bucket inventory list.',
      },
      {
        title: 'Click Create Storage',
        details: ['Start a new bucket provisioning flow.'],
        expected: 'You land on the Create Storage form.',
      },
      {
        title: 'Choose provider and region',
        details: [
          'Select the provider (AWS/Azure/GCP).',
          'Pick a region. The region list updates by provider.',
        ],
      },
      {
        title: 'Name and security settings',
        details: [
          'Set the bucket name (also used as the resource name).',
          'Decide whether to allow public access.',
          'Enable versioning if you want object history.',
          'Keep encryption enabled for safer defaults.',
        ],
      },
      {
        title: 'Select project and provision',
        details: [
          'Choose Current project or create a New project.',
          'Submit the form to provision the storage bucket.',
          'After success, you will return to Storage list.',
        ],
        expected: 'The new bucket appears in Storage inventory after provisioning and/or sync.',
      },
    ],
    troubleshooting: [
      'If a name is rejected, ensure it matches provider naming rules (lowercase, unique).',
      'If provisioning fails, check credentials permissions for storage creation and KMS/encryption settings.',
    ],
  },
  {
    id: 'networks',
    name: 'Networks',
    description: 'Provision VPC/VNET/network fabric.',
    icon: Network,
    route: '/resources/networks',
    createRoute: '/resources/networks/create',
    summary:
      'Create a virtual network foundation (VPC/VNET) by selecting provider, region, CIDR, and DNS/NAT settings.',
    prerequisites: ['At least one cloud account must be connected.'],
    steps: [
      {
        title: 'Open Networks',
        details: ['Go to Resources > Networks.'],
        expected: 'You see the networks inventory list.',
      },
      {
        title: 'Create a network',
        details: ['Click Create Network.'],
        expected: 'You land on the Create Virtual Network form.',
      },
      {
        title: 'Choose provider and region',
        details: ['Select AWS/Azure/GCP and choose a region from the dropdown.'],
      },
      {
        title: 'Define the CIDR block',
        details: [
          'Enter your CIDR (example: 10.0.0.0/16).',
          'Use a preset if you are unsure; avoid overlapping CIDRs with existing networks.',
        ],
      },
      {
        title: 'Enable DNS and NAT (optional)',
        details: [
          'Enable DNS for friendlier name resolution.',
          'Enable NAT if you need internet access from private subnets (may increase cost).',
        ],
      },
      {
        title: 'Provision and verify',
        details: ['Submit and then return to Networks to confirm the new network appears.'],
        expected: 'Network resource appears with the selected region/provider.',
      },
    ],
    troubleshooting: [
      'Invalid CIDR format will block submission. Use a valid CIDR like 10.0.0.0/16.',
      'If the provider rejects the network, check if the CIDR overlaps an existing network in that region/account.',
    ],
  },
  {
    id: 'functions',
    name: 'Functions',
    description: 'Deploy serverless functions.',
    icon: Zap,
    route: '/resources/functions',
    createRoute: '/resources/functions/create',
    summary:
      'Provision a serverless function with provider-specific runtime, memory/timeout sizing, and trigger configuration.',
    prerequisites: ['At least one cloud account must be connected.', 'Have a project selected (or create one in the form).'],
    steps: [
      {
        title: 'Open Functions',
        details: ['Go to Resources > Functions and click Create Function.'],
        expected: 'You land on the function provisioning form.',
      },
      {
        title: 'Choose provider and runtime',
        details: [
          'Select AWS/Azure/GCP.',
          'Choose a runtime supported by that provider (Python/Node options differ).',
          'Pick a region appropriate for your users/data.',
        ],
      },
      {
        title: 'Name the function',
        details: [
          'Enter a function name. Nebula normalizes names into provider-safe identifiers.',
          'Use a short name like orders-webhook or image-resize.',
        ],
      },
      {
        title: 'Configure performance',
        details: [
          'Set timeout (seconds) based on expected execution time.',
          'Set memory size; higher memory can improve CPU throughput but may increase cost.',
        ],
      },
      {
        title: 'Pick a trigger',
        details: [
          'HTTP trigger for webhooks.',
          'Schedule trigger for periodic jobs.',
          'Storage/Queue/PubSub triggers for event-driven workloads.',
          'Fill trigger source or schedule expression when required.',
        ],
      },
      {
        title: 'Select project and provision',
        details: [
          'Choose Current project or New project.',
          'Submit to create a deployment job.',
          'Monitor progress in Deployments if redirected.',
        ],
        expected: 'Function appears in the Functions list after provisioning.',
      },
    ],
    troubleshooting: [
      'If HTTP routes or allowed origins fail, verify the allowed origins and route path settings.',
      'If the deployment fails, review logs for IAM/role, runtime, and region-specific errors.',
    ],
  },
  {
    id: 'queues',
    name: 'Queues',
    description: 'Create queue services (SQS/Service Bus/PubSub).',
    icon: Inbox,
    route: '/resources/queues',
    createRoute: '/resources/queues/create?provider=aws',
    summary:
      'Provision a queue service for asynchronous work. Options include FIFO, deduplication, long polling, and dead-letter queues.',
    prerequisites: ['At least one cloud account must be connected.', 'Have a project selected (or create one in the form).'],
    steps: [
      {
        title: 'Open Queues',
        details: ['Go to Resources > Queues and click Create.'],
        expected: 'You land on the queue provisioning form.',
      },
      {
        title: 'Choose provider and region',
        details: [
          'Pick AWS/Azure/GCP.',
          'Pick the region. The region list updates to match the provider.',
        ],
      },
      {
        title: 'Name the queue',
        details: [
          'Enter a queue name (Nebula will normalize unsafe characters).',
          'If FIFO is enabled, ensure the provider naming rules are satisfied.',
        ],
      },
      {
        title: 'Configure queue behavior',
        details: [
          'Set visibility timeout and retention period.',
          'Set delivery delay and max message size if needed.',
          'Enable long polling (receive wait time) for lower cost and fewer empty polls.',
        ],
      },
      {
        title: 'Configure a dead-letter queue (optional)',
        details: [
          'Enable DLQ to capture poison messages.',
          'Provide DLQ name and max receive count threshold for redrive.',
        ],
      },
      {
        title: 'Select project and provision',
        details: [
          'Choose Current project or create a New project.',
          'Submit to create the queue and track it in Deployments.',
        ],
        expected: 'Queue appears in the Queues list after provisioning.',
      },
    ],
    troubleshooting: [
      'If FIFO + content-based dedup options are disabled, ensure FIFO is enabled first.',
      'If provisioning fails, check provider-specific limits (queue count, IAM permissions, region restrictions).',
    ],
  },
  {
    id: 'messages',
    name: 'Messages (Topics)',
    description: 'Create pub/sub topics (SNS/Service Bus Topic/PubSub).',
    icon: MessageSquare,
    route: '/resources/messages',
    createRoute: '/resources/messages/create?provider=aws',
    summary:
      'Provision a publish/subscribe topic for fan-out messaging. Configure FIFO and dedup when required.',
    prerequisites: ['At least one cloud account must be connected.', 'Have a project selected (or create one in the form).'],
    steps: [
      {
        title: 'Open Messages',
        details: ['Go to Resources > Messages and click Create.'],
        expected: 'You land on the topic provisioning form.',
      },
      {
        title: 'Choose provider and region',
        details: ['Pick AWS/Azure/GCP and select a region.'],
      },
      {
        title: 'Name the topic',
        details: [
          'Enter a topic name (Nebula will normalize it).',
          'Optionally set a display name (provider-specific).',
        ],
      },
      {
        title: 'Configure FIFO (optional)',
        details: [
          'Enable FIFO if you need ordering guarantees.',
          'Enable content-based deduplication when supported/required.',
        ],
      },
      {
        title: 'Select project and provision',
        details: [
          'Choose Current project or create a New project.',
          'Submit to provision and track the job in Deployments.',
        ],
        expected: 'Topic appears in the Messages list after provisioning.',
      },
    ],
    troubleshooting: [
      'If FIFO options are rejected, verify naming and provider support in the selected region.',
      'If subscriptions are missing, open the Messaging resource page to manage subscriptions and endpoints.',
    ],
  },
  {
    id: 'deployments',
    name: 'Deployments',
    description: 'Monitor provisioning jobs and logs.',
    icon: Rocket,
    route: '/deployments',
    summary:
      'Deployments are the job timeline for provisioning operations. Use this page to inspect logs and status per resource.',
    prerequisites: ['Provision at least one resource (VM, storage, function, queue, etc.).'],
    steps: [
      {
        title: 'Open Deployments',
        details: ['Use the sidebar and click Deployments.'],
        expected: 'You see a list of deployment jobs with status.',
      },
      {
        title: 'Inspect status and timing',
        details: [
          'Use status badges to identify running, completed, or failed jobs.',
          'Use started/completed timestamps to understand runtime.',
        ],
      },
      {
        title: 'Open logs for a job',
        details: [
          'Click View Logs or similar action on a deployment row.',
          'Scroll through Terraform output for the first error line.',
          'Use provider hints to debug IAM, region, quota, or naming failures.',
        ],
        expected: 'You can identify the failure reason quickly from logs and terraform_output.',
      },
      {
        title: 'Clean up failed records (optional)',
        details: [
          'If a resource record is stuck/failed and you want to remove it from Nebula tracking, use the delete action.',
          'Deleting a record removes Nebula tracking for that resource; it may not automatically destroy the real cloud resource.',
        ],
      },
    ],
    troubleshooting: [
      'Credentials errors: re-check Cloud Accounts and ensure correct permissions.',
      'Quota errors: try a smaller instance type or a different region/provider.',
    ],
  },
  {
    id: 'billing',
    name: 'Cost & Billing',
    description: 'Track cost trends and provider spend.',
    icon: DollarSign,
    route: '/billing',
    summary:
      'Cost & Billing shows monthly spend, provider breakdown, and trend charts. Use it to spot anomalies and track growth.',
    prerequisites: ['Inventory sync needs to run for cost records to appear (depending on provider setup).'],
    steps: [
      {
        title: 'Open Cost & Billing',
        details: ['Click Cost & Billing from the sidebar.'],
        expected: 'You see current month cost, last month cost, and charts.',
      },
      {
        title: 'Refresh billing data',
        details: ['Click Refresh to pull the latest snapshot.'],
      },
      {
        title: 'Inspect provider breakdown',
        details: [
          'Use the provider bar chart to compare AWS vs Azure vs GCP spend.',
          'Use trend chart to spot spikes over the last 30 days.',
        ],
      },
      {
        title: 'Export report (optional)',
        details: [
          'Click Export Report to download a summary when available.',
          'Use exports for project reports, budgeting, and audit evidence.',
        ],
      },
    ],
    troubleshooting: [
      'If charts are empty, confirm credentials are connected and inventory sync has executed.',
      'If the backend endpoint fails, check `/billing/overview` availability and server logs.',
    ],
  },
  {
    id: 'subscriptions',
    name: 'Subscriptions',
    description: 'Switch plans and understand limits.',
    icon: CreditCard,
    route: '/subscriptions',
    summary:
      'Subscriptions lets you switch between Basic, Professional, and Enterprise plans. Limits are enforced server-side.',
    prerequisites: ['You must be logged in.'],
    steps: [
      {
        title: 'Open Subscriptions',
        details: ['Navigate to Subscriptions from the sidebar.'],
        expected: 'You see the current plan highlighted and available plans.',
      },
      {
        title: 'Switch to a different plan',
        details: [
          'Click Switch to ... on the plan you want.',
          'Wait for confirmation and success message.',
        ],
        expected: 'Your plan updates and the change is visible in Profile and Settings.',
      },
      {
        title: 'Handle downgrade restrictions',
        details: [
          'Downgrades are blocked if your current usage exceeds the target plan limits.',
          'To downgrade, delete projects or disconnect accounts until you are under the limit.',
        ],
      },
    ],
    troubleshooting: [
      'If you see a 403 error when switching plans, you are likely above the limits of the target plan.',
      'If the UI does not update immediately, refresh the page to refetch `/auth/me`.',
    ],
  },
  {
    id: 'blueprints',
    name: 'Blueprints',
    description: 'Create reusable templates.',
    icon: FileCode,
    route: '/blueprints',
    summary:
      'Blueprints are reusable templates you can create, clone, and apply to accelerate provisioning patterns.',
    prerequisites: ['You must be logged in.'],
    steps: [
      {
        title: 'Open Blueprints',
        details: ['Navigate to Blueprints from the sidebar and click Refresh if needed.'],
        expected: 'You see your blueprint list and create controls.',
      },
      {
        title: 'Create a blueprint',
        details: [
          'Click Create Blueprint.',
          'Fill name, description, provider, and resource type.',
          'Paste a JSON template in the editor.',
        ],
      },
      {
        title: 'Validate and format JSON',
        details: [
          'Use Validate JSON to confirm your template is syntactically correct.',
          'Use Format JSON for consistent indentation.',
          'Save a draft (Ctrl+S) while iterating.',
        ],
      },
      {
        title: 'Use, clone, or delete',
        details: [
          'Clone copies a blueprint into a new draft.',
          'Use increments usage and can be used as an operational signal.',
          'Delete removes the blueprint from your workspace.',
        ],
      },
    ],
    troubleshooting: [
      'If CloudFormation mode is enabled, ensure your template includes a valid Resources object.',
      'If creation fails, inspect backend error detail and confirm provider/resource_type values.',
    ],
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Security and credential management.',
    icon: Settings,
    route: '/settings',
    summary:
      'Settings centralizes security controls and cloud credential management, including refresh actions and limit visibility.',
    prerequisites: ['You must be logged in.'],
    steps: [
      {
        title: 'Open Settings',
        details: ['Navigate to Settings from the sidebar.'],
        expected: 'You see credential management and plan/limit information.',
      },
      {
        title: 'Connect a provider',
        details: [
          'Click Connect Provider.',
          'Fill credential fields for AWS/Azure/GCP.',
          'Save and confirm the credential appears in the list.',
        ],
      },
      {
        title: 'Disconnect a provider credential',
        details: [
          'Use the delete action on a credential row.',
          'Confirm the dialog. This removes credentials from Nebula.',
        ],
      },
      {
        title: 'Review plan limits',
        details: [
          'Check the Plan & Limits panel to see how many cloud accounts you can connect.',
          'Use View plans to switch subscription tier if needed.',
        ],
      },
    ],
    troubleshooting: [
      'If you cannot connect more accounts, you may be at your plan limit.',
      'If credentials appear but provisioning fails, confirm provider permission scopes.',
    ],
  },
  {
    id: 'profile',
    name: 'Profile',
    description: 'Identity, security, and subscription status.',
    icon: UserRound,
    route: '/profile',
    summary:
      'Profile is the control center for identity fields, password rotation, 2FA, and subscription visibility.',
    prerequisites: ['You must be logged in.'],
    steps: [
      {
        title: 'Open Profile',
        details: ['Use the user menu/topbar and open Profile.'],
        expected: 'You see identity details and security posture.',
      },
      {
        title: 'Edit identity details',
        details: [
          'Click Edit Profile to open the editor.',
          'Update role, organization, and phone number fields.',
          'Save to persist changes.',
        ],
      },
      {
        title: 'Rotate password',
        details: [
          'Click Change Password.',
          'Enter current password and a new password, then confirm.',
          'The password freshness indicator updates after success.',
        ],
      },
      {
        title: 'Manage 2FA',
        details: [
          'Use the 2FA controls to enable or disable two-factor authentication.',
          'Follow on-screen prompts for setup/verification if enabled.',
        ],
      },
      {
        title: 'Change subscription plan',
        details: [
          'In Active Subscription, click Change plan.',
          'Switch plans on the Subscriptions page and return to verify changes.',
        ],
      },
    ],
    troubleshooting: [
      'If profile updates fail, check `/auth/me` backend availability and auth token validity.',
      'If 2FA verification fails, ensure device time is correct and retry.',
    ],
  },
  {
    id: 'activity',
    name: 'Activity',
    description: 'Audit-friendly change timeline.',
    icon: Activity,
    route: '/activity',
    summary:
      'Activity aggregates deployment events, sync events, and in-app notifications into a searchable timeline.',
    prerequisites: ['Generate activity by provisioning resources or syncing inventory.'],
    steps: [
      {
        title: 'Open Activity',
        details: ['Navigate to Activity from the sidebar.'],
        expected: 'You see the most recent events across the workspace.',
      },
      {
        title: 'Filter by provider or source',
        details: [
          'Use provider filter to narrow to AWS/Azure/GCP.',
          'Use source filter to focus on deployments, notifications, or sync.',
        ],
      },
      {
        title: 'Search for a resource',
        details: [
          'Use the search field to find events by resource name or action.',
          'Open linked deployments to debug failures.',
        ],
      },
    ],
    troubleshooting: [
      'If activity is empty, generate events by provisioning a resource or refreshing inventory.',
      'If a linked deployment is missing, confirm the deployment still exists and was not deleted.',
    ],
  },
  {
    id: 'cloud-console',
    name: 'Cloud Console',
    description: 'Logs and AI copilot for troubleshooting.',
    icon: Terminal,
    route: '/console',
    summary:
      'Cloud Console is your operational cockpit for reviewing deployment logs and asking the Copilot to suggest next actions.',
    prerequisites: ['Have at least one deployment available to inspect logs.'],
    steps: [
      {
        title: 'Open Cloud Console',
        details: ['Navigate to Cloud Console from the sidebar.'],
        expected: 'You see recent deployments on the left and the copilot panel.',
      },
      {
        title: 'Select a deployment and inspect logs',
        details: [
          'Click a deployment to load logs and terraform output.',
          'Look for the first error line and the provider-specific error code.',
        ],
      },
      {
        title: 'Ask Copilot for help',
        details: [
          'Use a quick prompt like "Why did my latest deployment fail?"',
          'Submit your own question with context (resource name, provider, region).',
          'Review findings and suggested actions.',
        ],
      },
      {
        title: 'Take a safe next action',
        details: [
          'Prefer navigate actions (open settings, open credentials) before making destructive changes.',
          'If an API action requires confirmation, validate the target resource first.',
        ],
      },
    ],
    troubleshooting: [
      'If Copilot fails to respond, verify backend `/assistant` endpoints are healthy.',
      'If logs are empty, open Deployments and confirm the job has logs available.',
    ],
  },
  {
    id: 'documentation',
    name: 'Documentation',
    description: 'Guides, architecture notes, API, and licensing.',
    icon: Book,
    route: '/docs',
    summary:
      'Documentation is the operator handbook for Nebula. It includes a guided User Guide for each service, architecture notes, the API reference (Swagger), and licensing boundaries.',
    prerequisites: ['You must be logged in.'],
    steps: [
      {
        title: 'Open Documentation',
        details: [
          'Use the Docs entry in the sidebar footer.',
          'Or navigate directly to `/docs`.',
        ],
        expected: 'You see a left rail of sections and a main content reader panel.',
      },
      {
        title: 'Switch sections using the left rail',
        details: [
          'Overview: product summary and how the platform works.',
          'User Guide: step-by-step flows for each service.',
          'Architecture: system diagrams and core flows.',
          'Backend/Frontend: implementation notes for contributors.',
          'API Reference: Swagger entry points.',
          'License: proprietary terms and NOTICE content.',
        ],
      },
      {
        title: 'Use the User Guide dropdown',
        details: [
          'Pick the service you want to execute.',
          'Use Open page to jump to the list/inventory screen.',
          'Use Create / Run to jump directly to the provisioning form (when available).',
          'Follow Detailed Steps and verify Expected outcomes as you go.',
        ],
        expected: 'You can execute workflows without guessing where controls live in the UI.',
      },
      {
        title: 'Open the API reference',
        details: [
          'Click Open Swagger UI to view endpoints, schemas, and auth requirements.',
          'Use Swagger to reproduce issues and validate backend responses.',
        ],
      },
      {
        title: 'Review licensing boundaries',
        details: [
          'Open the License section to review usage restrictions.',
          'Use NOTICE to track third-party attributions and licensing obligations.',
        ],
      },
    ],
    troubleshooting: [
      'If Swagger fails to load, confirm `VITE_API_URL` is set correctly and the backend is running.',
      'If the Docs page looks empty, ensure you are authenticated and not blocked by a failing API request.',
    ],
  },
  {
    id: 'help',
    name: 'Help & Support',
    description: 'FAQ, documentation shortcuts, and support channels.',
    icon: LifeBuoy,
    route: '/help',
    summary:
      'Help & Support is the quickest way to search FAQs, open documentation, jump into the API reference, and contact support for blocked issues.',
    prerequisites: ['You must be logged in.'],
    steps: [
      {
        title: 'Open Help & Support',
        details: ['Navigate to `/help` (from the UI help links when available).'],
        expected: 'You see a search box, quick links, and an FAQ list.',
      },
      {
        title: 'Search the knowledge base',
        details: [
          'Type keywords into the search bar (example: "project", "deployment", "billing").',
          'Results filter instantly across FAQ entries.',
        ],
        expected: 'Only matching FAQ items remain visible.',
      },
      {
        title: 'Use quick links',
        details: [
          'Browse Docs: opens `/docs`.',
          'View API: opens Swagger UI in a new tab.',
          'Contact Support: opens an email draft using your configured support email.',
        ],
      },
      {
        title: 'Expand and read FAQ answers',
        details: [
          'Click a question to expand/collapse the answer.',
          'Start with project creation, blueprints vs deployments, and billing to get oriented.',
        ],
      },
    ],
    troubleshooting: [
      'If the API reference button fails, confirm the backend Swagger URL is reachable.',
      'If email link does nothing, ensure a default mail client is configured on your machine.',
    ],
  },
];

export const defaultDocsServiceGuideId = 'projects';

export const getDocsServiceGuide = (value: unknown): ServiceGuide => {
  const normalized = String(value ?? '').trim().toLowerCase();
  const fallback =
    docsServiceGuides.find((guide) => guide.id === defaultDocsServiceGuideId) ??
    docsServiceGuides[0];
  return (
    docsServiceGuides.find((guide) => guide.id === normalized) ??
    fallback ?? {
      id: 'projects',
      name: 'Projects',
      description: 'Workspaces, ownership, and grouping.',
      icon: FolderKanban,
      summary: 'Projects are the workspace boundary for your infrastructure.',
      prerequisites: [],
      steps: [],
    }
  );
};
