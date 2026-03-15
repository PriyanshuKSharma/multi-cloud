import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
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
import PageHero from '../components/ui/PageHero';
import ServiceGuidePicker from '../components/docs/ServiceGuidePicker';
import {
  defaultDocsServiceGuideId,
  docsServiceGuides,
  getDocsServiceGuide,
} from '../data/docsServiceGuides';

const Docs: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('overview');
  const navigate = useNavigate();
  const [selectedServiceGuideId, setSelectedServiceGuideId] = React.useState<string>(() => {
    if (typeof window === 'undefined') return defaultDocsServiceGuideId;
    try {
      const persisted = window.localStorage.getItem('docs:user-guide:selected');
      return persisted ? persisted : defaultDocsServiceGuideId;
    } catch {
      return defaultDocsServiceGuideId;
    }
  });
  const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const swaggerUrl = `${apiBaseUrl}/docs`;
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'priyanshu17ks@gmail.com';
  const selectedServiceGuide = React.useMemo(
    () => getDocsServiceGuide(selectedServiceGuideId),
    [selectedServiceGuideId]
  );
  const SelectedServiceIcon = selectedServiceGuide.icon;

  React.useEffect(() => {
    if (selectedServiceGuide.id !== selectedServiceGuideId) {
      setSelectedServiceGuideId(selectedServiceGuide.id);
      return;
    }
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('docs:user-guide:selected', selectedServiceGuideId);
    } catch {
      // ignore persistence issues
    }
  }, [selectedServiceGuide.id, selectedServiceGuideId]);

  const goToTab = (tabId: string) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const contactSupport = () => {
    const subject = encodeURIComponent('Nebula Support Request');
    const body = encodeURIComponent('Hi team,\n\nI need help with:\n\n');
    window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
  };

  const tabs = [
    {
      id: 'overview',
      name: 'Overview',
      description: 'What Nebula is and how it works.',
      icon: <Book className="w-4 h-4" />,
    },
    {
      id: 'installation',
      name: 'Installation',
      description: 'Run locally or deploy with Docker.',
      icon: <Terminal className="w-4 h-4" />,
    },
    {
      id: 'quickstart',
      name: 'User Guide',
      description: 'Step-by-step operator workflows.',
      icon: <Zap className="w-4 h-4" />,
    },
    {
      id: 'contributing',
      name: 'Contributing',
      description: 'Developer workflow and standards.',
      icon: <Github className="w-4 h-4" />,
    },
    {
      id: 'changelog',
      name: 'Changelog',
      description: 'Recent product changes.',
      icon: <Activity className="w-4 h-4" />,
    },
    {
      id: 'architecture',
      name: 'Architecture',
      description: 'System design, core flows, and stack.',
      icon: <Layers className="w-4 h-4" />,
    },
    {
      id: 'backend',
      name: 'Backend',
      description: 'FastAPI, Celery, storage, and Terraform.',
      icon: <Server className="w-4 h-4" />,
    },
    {
      id: 'frontend',
      name: 'Frontend',
      description: 'React UI stack and client-side patterns.',
      icon: <Globe className="w-4 h-4" />,
    },
    {
      id: 'api',
      name: 'API Reference',
      description: 'Endpoints, auth model, and Swagger.',
      icon: <Code className="w-4 h-4" />,
    },
    {
      id: 'legal',
      name: 'License',
      description: 'Proprietary terms and usage boundaries.',
      icon: <Lock className="w-4 h-4" />,
    },
  ];

  const variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  return (
    <div className="w-full space-y-8 p-6 pb-12 lg:p-8 xl:p-10">
      <PageHero
        id="documentation"
        tone="blue"
        eyebrow="Knowledge base and API guidance"
        eyebrowIcon={<Book className="h-3.5 w-3.5" />}
        title="Documentation"
        titleIcon={<Book className="w-8 h-8 text-blue-300" />}
        description="Complete guide to the Multi-Cloud SaaS Orchestration Platform."
        chips={[
          { label: `${tabs.length} sections`, tone: 'blue' },
          { label: 'Frontend + Backend + API', tone: 'cyan' },
          { label: 'Proprietary', tone: 'default' },
        ]}
        guide={{
          title: 'About Documentation',
          purpose: 'Documentation centralizes product guidance, architecture notes, and the API reference needed to operate the platform safely.',
          actions: [
            'navigate sections from the left rail',
            'open Swagger for endpoint details',
            'review licensing and usage boundaries',
          ],
        }}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://github.com/PriyanshuKSharma/multi-cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700/70 bg-slate-900/75 px-4 py-2.5 text-sm font-semibold text-slate-100 transition-colors hover:bg-slate-800/85"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <button
              type="button"
              onClick={() => navigate('/help')}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-colors hover:from-blue-400 hover:to-indigo-400"
            >
              <LifeBuoy className="w-4 h-4" />
              <span>Support</span>
            </button>
          </div>
        }
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,2.05fr)]">
        <aside className="space-y-6">
          <div className="sticky top-6 space-y-6">
            <div className="rounded-[28px] border border-gray-800/50 bg-[#0f0f11] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-400">Sections</p>
              <div className="mt-4 space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => goToTab(tab.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                      activeTab === tab.id
                        ? 'border-blue-500/45 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.12)]'
                        : 'border-gray-800/80 bg-gray-900/40 hover:border-gray-700 hover:bg-gray-800/55'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 rounded-xl border p-2 ${
                          activeTab === tab.id
                            ? 'border-blue-500/30 bg-blue-500/10 text-blue-200'
                            : 'border-gray-800 bg-black/15 text-gray-400'
                        }`}
                      >
                        {tab.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">{tab.name}</p>
                        <p className="mt-1 text-xs text-gray-400">{tab.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-gray-800/50 bg-[#0f0f11] p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center">
                <Book className="w-4 h-4 mr-2 text-blue-400" />
                Quick Resources
              </h3>
              <div className="space-y-2 text-sm">
                <button
                  type="button"
                  onClick={() => goToTab('installation')}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-800/70 bg-gray-900/30 px-3 py-2 text-left text-gray-300 transition-colors hover:bg-gray-800/55"
                >
                  <span>Installation Guide</span>
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                </button>
                <button
                  type="button"
                  onClick={() => goToTab('contributing')}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-800/70 bg-gray-900/30 px-3 py-2 text-left text-gray-300 transition-colors hover:bg-gray-800/55"
                >
                  <span>Contributing</span>
                  <ExternalLink className="h-4 w-4 text-slate-300" />
                </button>
                <button
                  type="button"
                  onClick={() => goToTab('changelog')}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-800/70 bg-gray-900/30 px-3 py-2 text-left text-gray-300 transition-colors hover:bg-gray-800/55"
                >
                  <span>Changelog</span>
                  <Activity className="h-4 w-4 text-blue-300" />
                </button>
                <button
                  type="button"
                  onClick={() => goToTab('api')}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-800/70 bg-gray-900/30 px-3 py-2 text-left text-gray-300 transition-colors hover:bg-gray-800/55"
                >
                  <span>API Reference</span>
                  <ExternalLink className="h-4 w-4 text-blue-300" />
                </button>
                <a
                  href={swaggerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-between rounded-xl border border-gray-800/70 bg-gray-900/30 px-3 py-2 text-gray-300 transition-colors hover:bg-gray-800/55"
                >
                  <span>Open Swagger UI</span>
                  <ExternalLink className="h-4 w-4 text-green-300" />
                </a>
                <button
                  type="button"
                  onClick={() => goToTab('legal')}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-800/70 bg-gray-900/30 px-3 py-2 text-left text-gray-300 transition-colors hover:bg-gray-800/55"
                >
                  <span>License & Notice</span>
                  <Lock className="h-4 w-4 text-purple-300" />
                </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-gray-800/50 bg-[#0f0f11] p-6">
              <h3 className="font-semibold text-white mb-2 flex items-center">
                <Lock className="w-4 h-4 mr-2 text-purple-400" />
                License
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                This software is proprietary. Usage is restricted to authorized access only.
              </p>
              <button
                type="button"
                onClick={() => goToTab('legal')}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-gray-700/60 bg-gray-900/40 px-4 py-2 text-xs font-semibold text-gray-200 transition-colors hover:bg-gray-800/70"
              >
                View terms
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-[28px] p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <MessageSquare className="w-16 h-16 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white mb-2 relative z-10">Need Support?</h3>
              <p className="text-xs text-gray-300 mb-4 relative z-10 leading-relaxed">
                Our engineering team is available 24/7 to assist with integration issues.
              </p>
              <button
                type="button"
                onClick={contactSupport}
                className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors relative z-10"
              >
                Contact Support
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={variants}
              transition={{ duration: 0.2 }}
              className="bg-[#0f0f11] border border-gray-800/50 rounded-[28px] p-7 xl:p-8 min-h-[650px]"
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

              {/* INSTALLATION */}
              {activeTab === 'installation' && (
                <div className="space-y-8">
                  <header>
                    <h2 className="text-2xl font-bold text-white mb-2">Installation Guide</h2>
                    <p className="text-gray-400">
                      Local development is easiest with Docker Compose. Use the checklist below to get the full stack running.
                    </p>
                  </header>

                  <section className="rounded-2xl border border-gray-800/60 bg-gray-950/30 p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-white">Quick Start (Docker Compose)</h3>
                    <ol className="space-y-3 text-sm text-gray-300 leading-relaxed">
                      <li>
                        <span className="font-semibold text-white">1. Clone and configure</span>
                        <pre className="mt-2 rounded-xl border border-gray-800 bg-black/30 p-3 text-xs text-gray-200 whitespace-pre-wrap">
{`git clone https://github.com/PriyanshuKSharma/multi-cloud.git
cd multi-cloud
cp .env.example .env`}
                        </pre>
                      </li>
                      <li>
                        <span className="font-semibold text-white">2. Start services</span>
                        <pre className="mt-2 rounded-xl border border-gray-800 bg-black/30 p-3 text-xs text-gray-200 whitespace-pre-wrap">
{`docker compose up -d --build`}
                        </pre>
                      </li>
                      <li>
                        <span className="font-semibold text-white">3. Open the app</span>
                        <div className="mt-2 grid gap-2 text-xs text-gray-400 sm:grid-cols-2">
                          <div className="rounded-xl border border-gray-800 bg-black/20 px-3 py-2">
                            <span className="font-semibold text-gray-200">Frontend:</span> http://localhost:5173
                          </div>
                          <div className="rounded-xl border border-gray-800 bg-black/20 px-3 py-2">
                            <span className="font-semibold text-gray-200">Backend Swagger:</span> http://localhost:8000/docs
                          </div>
                        </div>
                      </li>
                      <li>
                        <span className="font-semibold text-white">4. Smoke test (optional)</span>
                        <pre className="mt-2 rounded-xl border border-gray-800 bg-black/30 p-3 text-xs text-gray-200 whitespace-pre-wrap">
{`./test_apis.sh`}
                        </pre>
                      </li>
                      <li>
                        <span className="font-semibold text-white">5. Stop services</span>
                        <pre className="mt-2 rounded-xl border border-gray-800 bg-black/30 p-3 text-xs text-gray-200 whitespace-pre-wrap">
{`docker compose down`}
                        </pre>
                      </li>
                    </ol>
                  </section>

                  <section className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-gray-800/60 bg-gray-950/30 p-6 space-y-3">
                      <h3 className="text-lg font-semibold text-white">Environment Variables</h3>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        Start by copying <code className="text-gray-200">.env.example</code> to <code className="text-gray-200">.env</code>.
                        In production, set strong secrets and restrict CORS origins.
                      </p>
                      <pre className="rounded-xl border border-gray-800 bg-black/30 p-3 text-xs text-gray-200 whitespace-pre-wrap">
{`# Frontend
VITE_API_URL=http://localhost:8000
VITE_SUPPORT_EMAIL=your-support@example.com

# Backend (example)
DATABASE_URL=postgresql://user:
  password@db:5432/multicloud
REDIS_URL=redis://redis:6379/0
SECRET_KEY=change-me-to-a-long-random-secret`}
                      </pre>
                    </div>

                    <div className="rounded-2xl border border-gray-800/60 bg-gray-950/30 p-6 space-y-3">
                      <h3 className="text-lg font-semibold text-white">Production Deploy (Compose)</h3>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        For a single-server deployment, use the production compose file after setting production-grade environment values.
                      </p>
                      <pre className="rounded-xl border border-gray-800 bg-black/30 p-3 text-xs text-gray-200 whitespace-pre-wrap">
{`docker compose -f docker-compose.prod.yml up -d --build`}
                      </pre>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Tip: Review <code className="text-gray-200">DEPLOYMENT_CHECKLIST.md</code> before shipping to production.
                      </p>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-6 space-y-2">
                    <h3 className="text-lg font-semibold text-amber-50">Troubleshooting</h3>
                    <ul className="space-y-2 text-sm text-amber-50/90 leading-relaxed">
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-200/80" />
                        <span>If ports are busy (5173/8000), stop the process using them or change ports in compose.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-200/80" />
                        <span>Check container logs: <code className="text-amber-50">docker compose logs -f backend</code> and <code className="text-amber-50">docker compose logs -f celery_worker</code>.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-200/80" />
                        <span>If the UI can’t reach the API, verify <code className="text-amber-50">VITE_API_URL</code> matches the backend origin.</span>
                      </li>
                    </ul>
                  </section>
                </div>
              )}

              {/* QUICK START / USER GUIDE */}
              {activeTab === 'quickstart' && (
                <div className="space-y-8">
                  <header>
                     <h2 className="text-2xl font-bold text-white mb-2">User Guide</h2>
                     <p className="text-gray-400">
                       Select the service you want to execute, then follow the detailed checklist below.
                     </p>
                  </header>

	                  <div className="space-y-7">
	                    <div className="flex flex-col gap-4 rounded-2xl border border-gray-800/70 bg-gray-950/30 p-6 lg:flex-row lg:items-end lg:justify-between">
	                      <div className="min-w-0">
	                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-400">Select Service</p>
	                        <p className="mt-2 text-sm text-gray-400">
	                          Choose what you want to run. Use the launcher to search fast and switch services instantly.
	                        </p>
	                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
	                          <ServiceGuidePicker
	                            value={selectedServiceGuide.id}
	                            guides={docsServiceGuides}
	                            onChange={(nextId) => setSelectedServiceGuideId(nextId)}
	                            hotkeyEnabled
	                          />
	
	                          <div className="flex flex-wrap gap-3">
	                            {selectedServiceGuide.route ? (
	                              <button
	                                type="button"
                                onClick={() => navigate(selectedServiceGuide.route!)}
                                className="inline-flex items-center gap-2 rounded-2xl border border-gray-700/70 bg-gray-900/50 px-4 py-3 text-sm font-semibold text-gray-200 transition-colors hover:bg-gray-800/70"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Open page
                              </button>
                            ) : null}
                            {selectedServiceGuide.createRoute ? (
                              <button
                                type="button"
                                onClick={() => navigate(selectedServiceGuide.createRoute!)}
                                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-colors hover:from-blue-400 hover:to-indigo-400"
                              >
                                <Play className="h-4 w-4" />
                                Create / Run
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="hidden lg:block text-right">
                        <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Current Selection</p>
                        <p className="mt-2 text-lg font-semibold text-white">{selectedServiceGuide.name}</p>
                        <p className="mt-1 text-xs text-gray-400">{selectedServiceGuide.description}</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="shrink-0 rounded-2xl border border-gray-800/80 bg-gray-900/60 p-3 text-blue-200">
                            <SelectedServiceIcon className="h-6 w-6" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-xl font-bold text-white">{selectedServiceGuide.name}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-gray-300">
                              {selectedServiceGuide.summary}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                          {selectedServiceGuide.route ? (
                            <span className="rounded-full border border-gray-800 bg-gray-900/40 px-3 py-1">
                              route: {selectedServiceGuide.route}
                            </span>
                          ) : null}
                          {selectedServiceGuide.createRoute ? (
                            <span className="rounded-full border border-gray-800 bg-gray-900/40 px-3 py-1">
                              action: {selectedServiceGuide.createRoute}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {selectedServiceGuide.prerequisites.length > 0 ? (
                        <div className="rounded-2xl border border-gray-800/70 bg-gray-900/30 p-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                            Prerequisites
                          </p>
                          <ul className="mt-3 space-y-2 text-sm text-gray-300">
                            {selectedServiceGuide.prerequisites.map((item) => (
                              <li key={item} className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400/80" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      <div className="space-y-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                          Detailed Steps
                        </p>
                        <ol className="space-y-4">
                          {selectedServiceGuide.steps.map((step, index) => (
                            <li
                              key={`${selectedServiceGuide.id}:${step.title}`}
                              className="rounded-2xl border border-gray-800/70 bg-gray-950/30 p-5"
                            >
                              <div className="flex items-start gap-4">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/25 bg-blue-500/10 text-sm font-semibold text-blue-200">
                                  {index + 1}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-base font-semibold text-white">{step.title}</p>
                                  {step.details.length > 0 ? (
                                    <ul className="mt-2 space-y-2 text-sm leading-relaxed text-gray-300">
                                      {step.details.map((detail) => (
                                        <li key={detail} className="flex items-start gap-2">
                                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-500" />
                                          <span>{detail}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : null}
                                  {step.expected ? (
                                    <p className="mt-3 text-xs text-gray-400">
                                      <span className="font-semibold text-gray-200">Expected:</span> {step.expected}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {selectedServiceGuide.troubleshooting?.length ? (
                        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-100">
                            Troubleshooting
                          </p>
                          <ul className="mt-3 space-y-2 text-sm text-amber-50/90">
                            {selectedServiceGuide.troubleshooting.map((item) => (
                              <li key={item} className="flex items-start gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-200/80" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

              {/* CONTRIBUTING */}
              {activeTab === 'contributing' && (
                <div className="space-y-8">
                  <header>
                    <h2 className="text-2xl font-bold text-white mb-2">Contributing</h2>
                    <p className="text-gray-400">
                      Contribution guidance for building features, fixing bugs, and keeping the platform consistent.
                    </p>
                  </header>

                  <section className="rounded-2xl border border-gray-800/60 bg-gray-950/30 p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-white">Local Development Workflow</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      The simplest path is running everything with Docker. For frontend-only changes, you can run Vite locally against a running backend.
                    </p>
                    <pre className="rounded-xl border border-gray-800 bg-black/30 p-3 text-xs text-gray-200 whitespace-pre-wrap">
{`# Full stack (recommended)
docker compose up -d --build

# Frontend dev (optional)
npm -C frontend install
npm -C frontend run dev`}
                    </pre>
                  </section>

                  <section className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-gray-800/60 bg-gray-950/30 p-6 space-y-3">
                      <h3 className="text-lg font-semibold text-white">Quality Gates</h3>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        Run lint and build before opening a PR.
                      </p>
                      <pre className="rounded-xl border border-gray-800 bg-black/30 p-3 text-xs text-gray-200 whitespace-pre-wrap">
{`npm -C frontend run lint
npm -C frontend run build`}
                      </pre>
                    </div>
                    <div className="rounded-2xl border border-gray-800/60 bg-gray-950/30 p-6 space-y-3">
                      <h3 className="text-lg font-semibold text-white">UI Conventions</h3>
                      <ul className="space-y-2 text-sm text-gray-300 leading-relaxed">
                        <li className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-500" />
                          <span>Use <code className="text-gray-200">PageHero</code> on pages to keep titles, descriptions, and Expand/Collapse consistent.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-500" />
                          <span>Prefer clear empty-states and confirmation dialogs for destructive actions.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-500" />
                          <span>Keep plan limits enforced server-side; the UI should display limits and handle 403 errors gracefully.</span>
                        </li>
                      </ul>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-gray-800/60 bg-gray-950/30 p-6 space-y-3">
                    <h3 className="text-lg font-semibold text-white">Docs: Add or Update a Service Guide</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      The Docs page User Guide dropdown is data-driven. Add services or refine steps in:
                      <code className="ml-2 text-gray-200">frontend/src/data/docsServiceGuides.ts</code>
                    </p>
                  </section>

                  <section className="rounded-2xl border border-blue-400/15 bg-blue-500/10 p-6 space-y-2">
                    <h3 className="text-lg font-semibold text-blue-50">Need help contributing?</h3>
                    <p className="text-sm text-blue-50/80 leading-relaxed">
                      If you are blocked by setup or a failing workflow, contact support with logs and the steps you tried.
                    </p>
                    <button
                      type="button"
                      onClick={contactSupport}
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-colors hover:from-blue-400 hover:to-indigo-400"
                    >
                      <LifeBuoy className="h-4 w-4" />
                      Contact Support
                    </button>
                  </section>
                </div>
              )}

              {/* CHANGELOG */}
              {activeTab === 'changelog' && (
                <div className="space-y-8">
                  <header>
                    <h2 className="text-2xl font-bold text-white mb-2">Changelog</h2>
                    <p className="text-gray-400">High-level release notes and product evolution.</p>
                  </header>

                  <section className="rounded-2xl border border-gray-800/60 bg-gray-950/30 p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-white">Unreleased</h3>
                      <span className="rounded-full border border-gray-800 bg-gray-900/40 px-3 py-1 text-xs text-gray-400">
                        tracked manually
                      </span>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-300 leading-relaxed">
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-500" />
                        <span>Docs: redesigned layout with a left rail and a dropdown-driven User Guide for all services.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-500" />
                        <span>Projects: added edit flow, delete flow, and a resource list inside project details.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-500" />
                        <span>Subscriptions: server-side plan enforcement and UI plan switching.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-500" />
                        <span>Legal: embedded proprietary LICENSE and NOTICE guidance directly in the Docs page.</span>
                      </li>
                    </ul>
                  </section>

                  <section className="rounded-2xl border border-gray-800/60 bg-gray-950/30 p-6 space-y-3">
                    <h3 className="text-lg font-semibold text-white">Full History</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      For the full commit history and PR timeline, open the repository on GitHub.
                    </p>
                    <a
                      href="https://github.com/PriyanshuKSharma/multi-cloud"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl border border-gray-700/70 bg-gray-900/50 px-4 py-3 text-sm font-semibold text-gray-200 transition-colors hover:bg-gray-800/70"
                    >
                      <Github className="h-4 w-4" />
                      Open GitHub
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </section>
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

              {/* LEGAL */}
              {activeTab === 'legal' && (
                <div className="space-y-8">
                  <header>
                    <h2 className="text-2xl font-bold text-white mb-2">License & Intellectual Property</h2>
                    <p className="text-gray-400">
                      Proprietary terms for using and distributing this project.
                    </p>
                  </header>

                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
                    <p className="text-sm text-amber-100 leading-relaxed">
                      <strong className="text-white">Summary:</strong> This software is proprietary and all rights are reserved. Do not copy, redistribute, or reuse code or materials without prior written permission.
                    </p>
                  </div>

                  <section className="space-y-3">
                    <h3 className="text-lg font-semibold text-white">LICENSE</h3>
                    <pre className="rounded-2xl border border-gray-800 bg-gray-950/40 p-4 text-xs leading-relaxed text-gray-200 whitespace-pre-wrap">
{`Copyright (c) 2026 PriyanshuKSharma. All Rights Reserved.

NOTICE: All information contained herein is, and remains
the property of PriyanshuKSharma. The intellectual and technical concepts contained
herein are proprietary to PriyanshuKSharma and may be covered by patents,
patents in process, and are protected by trade secret or copyright law.
Dissemination of this information or reproduction of this material
is strictly forbidden unless prior written permission is obtained
from PriyanshuKSharma.`}
                    </pre>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-lg font-semibold text-white">NOTICE</h3>
                    <pre className="rounded-2xl border border-gray-800 bg-gray-950/40 p-4 text-xs leading-relaxed text-gray-200 whitespace-pre-wrap">
{`Copyright (c) 2026 PriyanshuKSharma. All Rights Reserved.

NOTICE: All information contained herein is, and remains the property of PriyanshuKSharma.
The intellectual and technical concepts contained herein are proprietary to PriyanshuKSharma
and may be covered by patents, patents in process, and are protected by trade secret or
copyright law. Dissemination of this information or reproduction of this material is strictly
forbidden unless prior written permission is obtained from PriyanshuKSharma.`}
                    </pre>
                  </section>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Docs;
