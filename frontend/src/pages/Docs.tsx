import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Book,
  Server,
  Database,
  Code,
  Cloud,
  Layers,
  Terminal,
  Cpu,
  Globe,
  Lock,
  Zap,
  Play,
  CheckCircle,
  ExternalLink,
  LifeBuoy,
  MessageSquare,
  Github
} from 'lucide-react';

const Docs: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('overview');
  const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const swaggerUrl = `${apiBaseUrl}/docs`;

  const tabs = [
    { id: 'overview', name: 'Overview', icon: <Book className="w-4 h-4" /> },
    { id: 'quickstart', name: 'User Guide', icon: <Zap className="w-4 h-4" /> },
    { id: 'architecture', name: 'Architecture', icon: <Layers className="w-4 h-4" /> },
    { id: 'backend', name: 'Backend', icon: <Server className="w-4 h-4" /> },
    { id: 'frontend', name: 'Frontend', icon: <Globe className="w-4 h-4" /> },
    { id: 'api', name: 'API Reference', icon: <Code className="w-4 h-4" /> },
  ];

  const variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-800/50">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Documentation</h1>
          <p className="text-gray-400 mt-2 text-lg">
            Complete guide to the Multi-Cloud SaaS Orchestration Platform.
          </p>
        </div>
        <div className="flex items-center space-x-3">
           <a href="https://github.com/PriyanshuKSharma/multi-cloud" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700">
             <Github className="w-4 h-4" />
             <span>GitHub Repo</span>
           </a>
           <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20">
             <LifeBuoy className="w-4 h-4" />
             <span>Support</span>
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg transition-all font-medium whitespace-nowrap border ${
              activeTab === tab.id
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                : 'bg-gray-900/50 text-gray-400 border-gray-800 hover:text-white hover:bg-gray-800 hover:border-gray-700'
            }`}
          >
            {tab.icon}
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={variants}
              transition={{ duration: 0.2 }}
              className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-8 min-h-[600px]"
            >
              {/* OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <section>
                    <h2 className="text-2xl font-bold text-white mb-4">Introduction</h2>
                    <p className="text-gray-300 leading-relaxed text-lg">
                      The <strong className="text-white">Multi-Cloud SaaS Orchestration Platform</strong> is an enterprise-grade solution designed to unify the management of <span className="text-yellow-500">AWS</span>, <span className="text-blue-400">Azure</span>, and <span className="text-green-500">GCP</span> infrastructures.
                      It solves the complexity of managing multiple cloud providers by providing a single pane of glass for resource discovery, cost analysis, and infrastructure provisioning.
                    </p>
                  </section>

                  <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { title: 'Unified Inventory', desc: 'View AWS EC2, Azure VMs, and GCP Compute in one list.', icon: <Server className="text-blue-400" /> },
                      { title: 'Cost Analytics', desc: 'Real-time billing data aggregation and forecasting.', icon: <Terminal className="text-green-400" /> },
                      { title: 'Infrastructure as Code', desc: 'Built-in Terraform runner for consistent deployments.', icon: <Code className="text-purple-400" /> },
                      { title: 'Auto-Sync', desc: 'Resources satisfy automated discovery every 10 minutes.', icon: <Zap className="text-yellow-400" /> },
                    ].map((feature, i) => (
                      <div key={i} className="bg-gray-800/30 p-5 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-colors">
                        <div className="flex items-center space-x-3 mb-2">
                          {feature.icon}
                          <h3 className="font-semibold text-white">{feature.title}</h3>
                        </div>
                        <p className="text-sm text-gray-400">{feature.desc}</p>
                      </div>
                    ))}
                  </section>

                  <section>
                    <h3 className="text-xl font-semibold text-white mb-4">How It Works</h3>
                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Cloud className="w-32 h-32" />
                      </div>
                      <div className="relative z-10 space-y-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white">1</div>
                          <div>
                            <h4 className="text-white font-medium">Connect Accounts</h4>
                            <p className="text-sm text-gray-400">Securely add your cloud credentials (IAM keys, Service Principals).</p>
                          </div>
                        </div>
                         <div className="h-6 w-0.5 bg-gray-700 ml-4"></div>
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center font-bold text-white">2</div>
                          <div>
                            <h4 className="text-white font-medium">Auto-Discovery</h4>
                            <p className="text-sm text-gray-400">The platform automatically scans regions and imports resources into the inventory.</p>
                          </div>
                        </div>
                        <div className="h-6 w-0.5 bg-gray-700 ml-4"></div>
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center font-bold text-white">3</div>
                          <div>
                            <h4 className="text-white font-medium">Manage & Orchestrate</h4>
                            <p className="text-sm text-gray-400">Stop/Start VMs, deploy new stacks via Terraform, and analyze costs.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {/* QUICK START / USER GUIDE */}
              {activeTab === 'quickstart' && (
                <div className="space-y-8">
                  <header>
                     <h2 className="text-2xl font-bold text-white mb-2">User Guide</h2>
                     <p className="text-gray-400">Step-by-step instructions for common tasks.</p>
                  </header>

                  <div className="space-y-6">
                    <div className="bg-gray-800/20 border border-gray-700/50 rounded-xl overflow-hidden">
                       <div className="bg-gray-800/50 px-6 py-4 border-b border-gray-700/50">
                         <h3 className="font-semibold text-white flex items-center">
                           <Play className="w-4 h-4 mr-2 text-blue-400" />
                           Creating a Virtual Machine
                         </h3>
                       </div>
                       <div className="p-6 space-y-4">
                         <ol className="list-decimal list-inside space-y-4 text-gray-300">
                           <li className="pl-2">
                             <span className="font-medium text-white">Navigate to Resources:</span> Go to the sidebar and click on <strong>Resources &gt; Virtual Machines</strong>.
                           </li>
                           <li className="pl-2">
                             <span className="font-medium text-white">Click Create:</span> Press the <span className="text-blue-400">"Create VM"</span> button in the top right corner.
                           </li>
                           <li className="pl-2">
                             <span className="font-medium text-white">Configure Details:</span>
                             <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-sm text-gray-400">
                               <li>Choose Provider (AWS, Azure, GCP)</li>
                               <li>Select Region (e.g., us-east-1)</li>
                               <li>Choose Instance Type (e.g., t2.micro)</li>
                             </ul>
                           </li>
                           <li className="pl-2">
                             <span className="font-medium text-white">Deploy:</span> Click "Provision Resource". The system will trigger a Terraform job in the background.
                           </li>
                         </ol>
                       </div>
                    </div>

                    <div className="bg-gray-800/20 border border-gray-700/50 rounded-xl overflow-hidden">
                       <div className="bg-gray-800/50 px-6 py-4 border-b border-gray-700/50">
                         <h3 className="font-semibold text-white flex items-center">
                           <Lock className="w-4 h-4 mr-2 text-purple-400" />
                           Adding Cloud Credentials
                         </h3>
                       </div>
                       <div className="p-6">
                         <p className="text-gray-300 mb-4">To enable syncing, you must add credentials for each provider you wish to use.</p>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
                             <h4 className="text-white font-medium mb-2">AWS</h4>
                             <p className="text-xs text-gray-400">Requires Access Key ID and Secret Access Key with EC2ReadOnly privileges.</p>
                           </div>
                           <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
                             <h4 className="text-white font-medium mb-2">Azure</h4>
                             <p className="text-xs text-gray-400">Requires Tenant ID, Client ID, and Client Secret (Service Principal).</p>
                           </div>
                           <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
                             <h4 className="text-white font-medium mb-2">GCP</h4>
                             <p className="text-xs text-gray-400">Requires Service Account JSON Key with Compute Viewer roles.</p>
                           </div>
                         </div>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ARCHITECTURE */}
              {activeTab === 'architecture' && (
                <div className="space-y-8">
                  <header>
                    <h2 className="text-2xl font-bold text-white mb-2">System Architecture</h2>
                    <p className="text-gray-400">High-level design and data flow.</p>
                  </header>

                   <div className="bg-[#0a0a0c] p-6 rounded-lg border border-gray-800 overflow-x-auto">
                     <h4 className="text-sm font-mono text-gray-500 mb-4">HIGH-LEVEL COMPONENT DIAGRAM</h4>
                     <pre className="text-xs font-mono text-blue-300 leading-relaxed whitespace-pre font-medium">
{`
+------------------+       +------------------+       +------------------+
|      USER        |       |  CLOUD PROVIDERS |       |  ADMINISTRATOR   |
+--------+---------+       +--------+---------+       +--------+---------+
         |                          |                           |
    HTTP/WebSocket               API Calls                   SSH/Monitoring
         |                          |                           |
         v                          v                           v
+--------------------------------------------------------------------------------+
|                             MULTI-CLOUD PLATFORM                               |
|                                                                                |
|   +-------------------+      +-------------------------------------------+     |
|   |  REACT FRONTEND   |      |            BACKEND SERVICES               |     |
|   |                   |      |                                           |     |
|   |  - Dashboard      |<---->|  +-----------+    +--------------------+  |     |
|   |  - Query Client   |      |  |  FastAPI  |    |  Celery Workers    |  |     |
|   |  - Auth Context   |      |  |  (API)    |<-->|  (Async Tasks)     |  |     |
|   +-------------------+      |  +-----+-----+    +----------+---------+  |     |
|                                   |                    |                 |     |
|                                   |                    v                 |     |
|                              +----+--------------------+----------+      |     |
|                              |           DATA LAYER               |      |     |
|                              |                                    |      |     |
|                              |  [ PostgreSQL ]   [ Redis Cache ]  |      |     |
|                              |                                    |      |     |
|                              +------------------------------------+      |     |
+--------------------------------------------------------------------------------+
`}
                     </pre>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div>
                       <h3 className="text-lg font-semibold text-white mb-3">Core Flows</h3>
                       <ul className="space-y-4">
                         <li className="flex items-start">
                           <div className="mt-1 min-w-[20px] h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold mr-3">1</div>
                           <div>
                             <strong className="text-gray-200">User Request:</strong> Frontend sends JWT-authenticated request to FastAPI.
                           </div>
                         </li>
                         <li className="flex items-start">
                           <div className="mt-1 min-w-[20px] h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold mr-3">2</div>
                           <div>
                             <strong className="text-gray-200">Data Retrieval:</strong> API queries PostgreSQL for cached data or Redis for active states.
                           </div>
                         </li>
                         <li className="flex items-start">
                           <div className="mt-1 min-w-[20px] h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold mr-3">3</div>
                           <div>
                             <strong className="text-gray-200">Background Sync:</strong> Celery Beat triggers sync jobs every 10 mins. Workers fetch fresh data from AWS/Azure/GCP APIs and update DB.
                           </div>
                         </li>
                       </ul>
                     </div>
                     <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700/50">
                       <h3 className="text-lg font-semibold text-white mb-3">Technologies</h3>
                       <div className="flex flex-wrap gap-2">
                         {['Python 3.11', 'FastAPI', 'React 18', 'PostgreSQL', 'Redis', 'Celery', 'Docker', 'Terraform'].map(t => (
                           <span key={t} className="px-3 py-1 bg-gray-900 rounded-full text-xs text-gray-400 border border-gray-700">{t}</span>
                         ))}
                       </div>
                     </div>
                   </div>
                </div>
              )}

              {/* BACKEND */}
              {activeTab === 'backend' && (
                <div className="space-y-8">
                  <header>
                    <h2 className="text-2xl font-bold text-white mb-2">Backend Services</h2>
                    <p className="text-gray-400">Powered by modern Python async stack.</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <a href="https://fastapi.tiangolo.com/" target="_blank" rel="noopener noreferrer" className="group block bg-gray-800/30 p-6 rounded-xl border border-gray-700/50 hover:border-blue-500/50 hover:bg-gray-800/50 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-teal-500/10 rounded-lg text-teal-400"><Server className="w-6 h-6" /></div>
                        <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-teal-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">FastAPI</h3>
                      <p className="text-sm text-gray-400 mb-4">High-performance async web framework handling all API requests, validation, and documentation.</p>
                      <span className="text-xs font-mono text-teal-500 bg-teal-500/10 px-2 py-1 rounded">Python 3.11+</span>
                    </a>

                    <a href="https://www.postgresql.org/docs/" target="_blank" rel="noopener noreferrer" className="group block bg-gray-800/30 p-6 rounded-xl border border-gray-700/50 hover:border-blue-500/50 hover:bg-gray-800/50 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400"><Database className="w-6 h-6" /></div>
                        <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-blue-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">PostgreSQL 15</h3>
                      <p className="text-sm text-gray-400 mb-4">Primary relational database storing users, inventory, cost data, and configurations.</p>
                      <span className="text-xs font-mono text-blue-500 bg-blue-500/10 px-2 py-1 rounded">SQLAlchemy 2.0</span>
                    </a>

                    <a href="https://docs.celeryq.dev/" target="_blank" rel="noopener noreferrer" className="group block bg-gray-800/30 p-6 rounded-xl border border-gray-700/50 hover:border-blue-500/50 hover:bg-gray-800/50 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-500/10 rounded-lg text-green-400"><Cpu className="w-6 h-6" /></div>
                        <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-green-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Celery + Redis</h3>
                      <p className="text-sm text-gray-400 mb-4">Distributed task queue for handling background resource sync and Terraform jobs.</p>
                      <span className="text-xs font-mono text-green-500 bg-green-500/10 px-2 py-1 rounded">Redis 7</span>
                    </a>

                    <a href="https://developer.hashicorp.com/terraform/docs" target="_blank" rel="noopener noreferrer" className="group block bg-gray-800/30 p-6 rounded-xl border border-gray-700/50 hover:border-blue-500/50 hover:bg-gray-800/50 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400"><Terminal className="w-6 h-6" /></div>
                        <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Terraform</h3>
                      <p className="text-sm text-gray-400 mb-4">Infrastructure as Code engine used to provision and manage cloud resources programmatically.</p>
                      <span className="text-xs font-mono text-purple-500 bg-purple-500/10 px-2 py-1 rounded">v1.5+</span>
                    </a>
                  </div>
                </div>
              )}

              {/* FRONTEND */}
              {activeTab === 'frontend' && (
                <div className="space-y-8">
                  <header>
                    <h2 className="text-2xl font-bold text-white mb-2">Frontend Stack</h2>
                    <p className="text-gray-400">Responsive, single-page application built with React.</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { name: 'React 18', desc: 'Component-based UI library', link: 'https://react.dev/', color: 'text-cyan-400' },
                      { name: 'Vite', desc: 'Next-generation build tool', link: 'https://vitejs.dev/', color: 'text-purple-400' },
                      { name: 'Tailwind CSS', desc: 'Utility-first styling', link: 'https://tailwindcss.com/', color: 'text-teal-400' },
                      { name: 'TanStack Query', desc: 'Server state management', link: 'https://tanstack.com/query', color: 'text-red-400' },
                      { name: 'Recharts', desc: 'Composable charting library', link: 'https://recharts.org/', color: 'text-indigo-400' },
                      { name: 'Framer Motion', desc: 'Animation library', link: 'https://www.framer.com/motion/', color: 'text-pink-400' },
                    ].map((tech, i) => (
                      <a key={i} href={tech.link} target="_blank" rel="noopener noreferrer" className="p-5 bg-gray-800/20 border border-gray-700/50 rounded-lg hover:bg-gray-800/50 hover:border-gray-600 transition-all">
                         <div className="flex justify-between items-start mb-2">
                           <h3 className={`font-bold ${tech.color}`}>{tech.name}</h3>
                           <ExternalLink className="w-3 h-3 text-gray-600" />
                         </div>
                         <p className="text-sm text-gray-400">{tech.desc}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* API REFERENCE */}
              {activeTab === 'api' && (
                <div className="space-y-8">
                  <header className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">API Reference</h2>
                      <p className="text-gray-400">RESTful API compliant with OpenAPI 3.0.</p>
                    </div>
                    <a href={swaggerUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-sm font-medium">
                      <span>Open Swagger UI</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </header>

                   <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                     <div className="grid divide-y divide-gray-800">
                       <div className="p-4 flex items-center">
                         <span className="w-20 px-2 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded text-center mr-4">GET</span>
                         <code className="text-gray-300">/auth/me</code>
                         <span className="ml-auto text-gray-500 text-sm">Get current user profile</span>
                       </div>
                       <div className="p-4 flex items-center">
                         <span className="w-20 px-2 py-1 bg-blue-500/10 text-blue-500 text-xs font-bold rounded text-center mr-4">POST</span>
                         <code className="text-gray-300">/auth/login</code>
                         <span className="ml-auto text-gray-500 text-sm">Obtain JWT access token</span>
                       </div>
                       <div className="p-4 flex items-center">
                         <span className="w-20 px-2 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded text-center mr-4">GET</span>
                         <code className="text-gray-300">/dashboard/stats</code>
                         <span className="ml-auto text-gray-500 text-sm">Get aggregated dashboard metrics</span>
                       </div>
                       <div className="p-4 flex items-center">
                         <span className="w-20 px-2 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded text-center mr-4">GET</span>
                         <code className="text-gray-300">/inventory/vms</code>
                         <span className="ml-auto text-gray-500 text-sm">List all virtual machines</span>
                       </div>
                       <div className="p-4 flex items-center">
                         <span className="w-20 px-2 py-1 bg-blue-500/10 text-blue-500 text-xs font-bold rounded text-center mr-4">POST</span>
                         <code className="text-gray-300">/resources/deploy</code>
                         <span className="ml-auto text-gray-500 text-sm">Provision new infrastructure</span>
                       </div>
                     </div>
                   </div>
                   <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                      <p className="text-sm text-yellow-200">
                        <strong>Note:</strong> All API endpoints (except login/signup) require a valid JWT authentication token in the generic Authorization header: <code>Bearer &lt;token&gt;</code>.
                      </p>
                   </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center">
              <Book className="w-4 h-4 mr-2 text-blue-400" />
              Quick Resources
            </h3>
            <ul className="space-y-3 text-sm">
                <li>
                  <a href="#" className="flex items-center text-gray-400 hover:text-white transition-colors">
                    <CheckCircle className="w-3 h-3 mr-2 text-green-500" /> Installation Guide
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center text-gray-400 hover:text-white transition-colors">
                    <CheckCircle className="w-3 h-3 mr-2 text-purple-500" /> Contributing
                  </a>
                </li>
                <li>
                   <a href="#" className="flex items-center text-gray-400 hover:text-white transition-colors">
                    <CheckCircle className="w-3 h-3 mr-2 text-orange-500" /> Changelog
                  </a>
                </li>
            </ul>
          </div>

           <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20">
               <MessageSquare className="w-16 h-16 text-blue-400" />
            </div>
            <h3 className="font-semibold text-white mb-2 relative z-10">Need Support?</h3>
            <p className="text-xs text-gray-300 mb-4 relative z-10 leading-relaxed">
              Our engineering team is available 24/7 to assist with integration issues.
            </p>
            <button className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors relative z-10">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Docs;
