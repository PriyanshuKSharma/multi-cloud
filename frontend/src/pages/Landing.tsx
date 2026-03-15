import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CloudLightning,
  Gauge,
  Globe2,
  Layers3,
  Moon,
  ShieldCheck,
  Sun,
  Users,
  Workflow,
  Check,
  Zap,
  Star,
  Crown,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';


const heroStats = [
  { label: 'Cloud Coverage', value: 'AWS | Azure | GCP' },
  { label: 'Delivery Model', value: 'Self-service + Governance' },
  { label: 'Operational Focus', value: 'Security, speed, reliability' },
];

const pillars = [
  {
    title: 'Unified Control Plane',
    description:
      'Operate compute, storage, network, and platform services with a shared operational language.',
    icon: Layers3,
  },
  {
    title: 'Policy-Driven Governance',
    description:
      'Establish guardrails for teams while preserving developer velocity and platform autonomy.',
    icon: ShieldCheck,
  },
  {
    title: 'Execution Visibility',
    description:
      'Track deployments, inventory, and activity with practical telemetry for engineering decisions.',
    icon: Gauge,
  },
  {
    title: 'Team Collaboration',
    description:
      'Bring platform, security, and product teams into one operational workspace and workflow.',
    icon: Users,
  },
];

const joinReasons = [
  {
    title: 'Standardize multi-cloud delivery',
    detail: 'Define repeatable patterns and remove fragmented cloud operations across projects.',
  },
  {
    title: 'Reduce operational risk',
    detail: 'Use controlled access, policy checks, and structured provisioning flows.',
  },
  {
    title: 'Move faster with confidence',
    detail: 'Balance delivery speed with governance through one platform operating model.',
  },
];

const teamMembers = [
  {
    name: 'Priyanshu K. Sharma',
    college: 'Ajeenkya D Y Patil University',
    role: 'Product, Platform & Infrastructure Lead',
    focus: 'Platform architecture, cloud systems, provisioning automation, deployment reliability, policy integration and long-range product direction.',
  },
  {
    name: 'Vaishnavi Jadhav',
    college: 'Ajeenkya D Y Patil University',
    role: 'Frontend & UX Engineer',
    focus: 'Interface systems, workflow design, and operator experience quality.',
  },
  {
    name: 'Vaibhav Gulage',
    college: 'Ajeenkya D Y Patil University',
    role: 'Frontend & UX Engineer',
    focus: 'Interface systems, workflow design, and operator experience quality.',
  },
];

const Landing: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const isLight = theme === 'light';

  const textStrongClass = isLight ? 'text-slate-900' : 'text-slate-100';
  const textMutedClass = isLight ? 'text-slate-600' : 'text-slate-300';
  const dividerClass = isLight ? 'border-slate-200/90' : 'border-slate-700/70';

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className={`absolute inset-0 ${
          isLight
            ? 'bg-[radial-gradient(circle_at_14%_14%,rgba(59,130,246,0.12),transparent_34%),radial-gradient(circle_at_86%_10%,rgba(37,99,235,0.08),transparent_38%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_56%,#e8f0fa_100%)]'
            : 'bg-[radial-gradient(circle_at_10%_12%,rgba(59,130,246,0.18),transparent_32%),radial-gradient(circle_at_88%_8%,rgba(30,64,175,0.16),transparent_35%),linear-gradient(180deg,#070d18_0%,#0b1423_58%,#0b1628_100%)]'
        }`}
      />
      <div
        className={`absolute inset-0 [background-image:linear-gradient(to_right,rgba(148,163,184,0.24)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.24)_1px,transparent_1px)] [background-size:52px_52px] ${
          isLight ? 'opacity-[0.2]' : 'opacity-[0.12]'
        }`}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-12 pt-5 sm:px-6 lg:px-10">
        <header className={`flex items-center justify-between border-b py-5 ${dividerClass}`}>
          <div className="flex min-w-0 items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/12 text-blue-300">
              <CloudLightning className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className={`truncate text-sm font-semibold tracking-wide ${textStrongClass}`}>Nebula Cloud Platform</p>
              <p className="truncate text-[11px] uppercase tracking-[0.16em] text-blue-500">Enterprise Multi-Cloud Operations</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6 mr-6">
              <button 
                onClick={() => scrollToSection('why-join')}
                className={`text-sm font-medium transition-colors ${isLight ? 'text-slate-600 hover:text-blue-600' : 'text-slate-400 hover:text-blue-400'}`}
              >
                Why Us
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className={`text-sm font-medium transition-colors ${isLight ? 'text-slate-600 hover:text-blue-600' : 'text-slate-400 hover:text-blue-400'}`}
              >
                Pricing
              </button>
            </nav>

            <button
              type="button"
              onClick={toggleTheme}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                isLight
                  ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  : 'border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
              }`}
              aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
              title={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
            >
              {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              {isLight ? 'Dark' : 'Light'}
            </button>

            <Link
              to="/login"
              className={`hidden sm:inline-block rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                isLight
                  ? 'border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-slate-900'
                  : 'border border-slate-700 bg-slate-900 text-slate-200 hover:border-blue-400/45'
              }`}
            >
              Login
            </Link>

            <Link to="/signup" className="nebula-btn-primary rounded-xl px-4 py-2 text-sm font-semibold">
              Join Us
            </Link>
          </div>

        </header>

        <main>
          <section className={`grid gap-12 border-b py-16 lg:grid-cols-[1.1fr_0.9fr] ${dividerClass}`}>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42 }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/28 bg-blue-500/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-400">
                <Globe2 className="h-3.5 w-3.5" />
                Organizational Cloud Platform
              </div>

              <h1 className={`mt-6 max-w-4xl text-4xl font-bold leading-tight sm:text-5xl ${textStrongClass}`}>
                Build and operate cloud systems with enterprise-grade clarity.
              </h1>

              <p className={`mt-5 max-w-3xl text-base ${textMutedClass}`}>
                Nebula gives engineering organizations a disciplined control plane for provisioning, governance,
                deployment visibility, and cross-team collaboration across AWS, Azure, and GCP.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => scrollToSection('why-join')}

                  className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                    isLight
                      ? 'border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-slate-900'
                      : 'border border-slate-700 bg-slate-900 text-slate-200 hover:border-blue-400/45'
                  }`}
                >
                  Why Join Us
                </button>

                <Link to="/signup" className="nebula-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold">
                  Join Us
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link to="/login" className="nebula-btn-secondary rounded-xl px-4 py-2.5 text-sm font-semibold">
                  Login
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: 0.1 }}
              className={`space-y-6 border-l pl-8 ${dividerClass}`}
            >
              <div className="flex items-center justify-between">
                <p className={`text-sm font-semibold ${textStrongClass}`}>Platform Snapshot</p>
                <Workflow className="h-4 w-4 text-blue-400" />
              </div>

              <dl className="space-y-5">
                {heroStats.map((item) => (
                  <div key={item.label} className={`border-b pb-4 ${dividerClass}`}>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-500">{item.label}</dt>
                    <dd className={`mt-1 text-sm font-medium ${textStrongClass}`}>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          </section>

          <section className={`border-b py-14 ${dividerClass}`}>
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-500">Core Capabilities</p>
              <h2 className={`mt-2 text-2xl font-bold sm:text-3xl ${textStrongClass}`}>Designed for serious cloud operations</h2>
            </div>

            <div className="grid gap-x-8 gap-y-7 md:grid-cols-2 xl:grid-cols-4">
              {pillars.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.article
                    key={item.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.32, delay: index * 0.06 }}
                    className={`border-l-2 border-blue-500/60 pl-4`}
                  >
                    <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-400/30 bg-blue-500/14 text-blue-300">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <h3 className={`text-base font-semibold ${textStrongClass}`}>{item.title}</h3>
                    <p className={`mt-2 text-sm ${textMutedClass}`}>{item.description}</p>
                  </motion.article>
                );
              })}
            </div>
          </section>

          <section id="why-join" className={`grid gap-8 border-b py-14 lg:grid-cols-[1fr_1.1fr] ${dividerClass}`}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-500">Why Join Us</p>
              <h2 className={`mt-2 text-2xl font-bold sm:text-3xl ${textStrongClass}`}>
                Join a platform built for engineering organizations
              </h2>
              <p className={`mt-3 text-sm ${textMutedClass}`}>
                Nebula focuses on practical operating discipline, cloud abstraction where it helps, and transparency where it matters.
              </p>
            </div>

            <div className={`space-y-5 border-l pl-8 ${dividerClass}`}>
              {joinReasons.map((item, index) => (
                <article key={item.title} className={`border-b pb-4 ${dividerClass}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-500">0{index + 1}</p>
                  <h3 className={`mt-1 text-base font-semibold ${textStrongClass}`}>{item.title}</h3>
                  <p className={`mt-1.5 text-sm ${textMutedClass}`}>{item.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={`border-b py-14 ${dividerClass}`}>
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-500">Team</p>
              <h2 className={`mt-2 text-2xl font-bold sm:text-3xl ${textStrongClass}`}>Built by a 3-member engineering group</h2>
            </div>

            <div className="grid gap-x-8 gap-y-7 md:grid-cols-3">
              {teamMembers.map((member, index) => (
                <motion.article
                  key={member.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.32, delay: index * 0.06 }}
                  className={`border-l-2 border-blue-500/60 pl-4`}
                >
                  <p className={`text-lg font-semibold ${textStrongClass}`}>{member.name}</p>
                  <p className={`text-[11px] font-medium tracking-wide uppercase mb-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {member.college}
                  </p>
                  <p className="mt-1 text-sm font-medium text-blue-500">{member.role}</p>
                  <p className={`mt-2 text-sm ${textMutedClass}`}>{member.focus}</p>
                </motion.article>
              ))}
            </div>
          </section>

          <section id="pricing" className={`border-b py-16 ${dividerClass}`}>
            <div className="text-center mb-16">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-500">Pricing</p>
              <h2 className={`mt-2 text-3xl font-bold sm:text-4xl ${textStrongClass}`}>Simple, transparent pricing</h2>
              <p className={`mx-auto mt-3 max-w-2xl text-sm ${textMutedClass}`}>
                Choose the plan that fits your organizational needs. All plans include standard multi-cloud capabilities.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {/* Starter */}
              <motion.div
                whileHover={{ y: -5 }}
                className={`relative flex flex-col rounded-3xl border p-8 ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/40 border-slate-800'}`}
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Zap className="h-5 w-5" />
                  </div>
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400'}`}>Starter</span>
                </div>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-bold ${textStrongClass}`}>$0</span>
                    <span className={`text-sm ${textMutedClass}`}>/month</span>
                  </div>
                  <p className={`mt-2 text-xs ${textMutedClass}`}>Perfect for individuals and small teams.</p>
                </div>
                <ul className="mb-8 flex-1 space-y-3">
                  {['1 Cloud Account', '5 Active Projects', 'Basic Analytics', 'Community Support'].map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 text-emerald-500" />
                      <span className={textMutedClass}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className={`block w-full text-center rounded-xl py-3 text-sm font-semibold transition-all ${isLight ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10' : 'bg-white text-slate-900 hover:bg-slate-100 shadow-lg shadow-white/5'}`}>
                  Get Started
                </Link>
              </motion.div>

              {/* Pro */}
              <motion.div
                whileHover={{ y: -5 }}
                className={`relative flex flex-col rounded-3xl border p-8 scale-105 z-20 ${isLight ? 'bg-white border-blue-400 shadow-xl shadow-blue-500/10' : 'bg-slate-900 border-blue-500/50 shadow-2xl shadow-blue-500/10'}`}
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full whitespace-nowrap">
                  Recommended
                </div>
                <div className="mb-6 flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <Star className="h-5 w-5" />
                  </div>
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400'}`}>Professional</span>
                </div>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-bold ${textStrongClass}`}>$49</span>
                    <span className={`text-sm ${textMutedClass}`}>/month</span>
                  </div>
                  <p className={`mt-2 text-xs ${textMutedClass}`}>Everything you need for scaling ops.</p>
                </div>
                <ul className="mb-8 flex-1 space-y-3">
                  {['Unlimited Accounts', '25 Active Projects', 'Pro Analytics', 'Priority Support', 'Automated Backups'].map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 text-emerald-500" />
                      <span className={textMutedClass}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className="nebula-btn-primary block w-full text-center rounded-xl py-3 text-sm font-semibold shadow-xl shadow-blue-600/20">
                  Subscribe Now
                </Link>
              </motion.div>

              {/* Enterprise */}
              <motion.div
                whileHover={{ y: -5 }}
                className={`relative flex flex-col rounded-3xl border p-8 ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/40 border-slate-800'}`}
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <Crown className="h-5 w-5" />
                  </div>
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400'}`}>Enterprise</span>
                </div>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-bold ${textStrongClass}`}>$199</span>
                    <span className={`text-sm ${textMutedClass}`}>/month</span>
                  </div>
                  <p className={`mt-2 text-xs ${textMutedClass}`}>Security and control for global orgs.</p>
                </div>
                <ul className="mb-8 flex-1 space-y-3">
                  {['Unlimited Everything', 'Multi-Org Setup', 'SSO/SAML support', 'Dedicated Account Manager', 'SLA Guarantees'].map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 text-emerald-500" />
                      <span className={textMutedClass}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className={`block w-full text-center rounded-xl py-3 text-sm font-semibold transition-all ${isLight ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10' : 'bg-white text-slate-900 hover:bg-slate-100 shadow-lg shadow-white/5'}`}>
                  Contact Sales
                </Link>
              </motion.div>
            </div>
          </section>

          <section className="py-16 text-center">

            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-500">Get Started</p>
            <h2 className={`mt-2 text-2xl font-bold sm:text-3xl ${textStrongClass}`}>Ready to modernize cloud operations?</h2>
            <p className={`mx-auto mt-2 max-w-2xl text-sm ${textMutedClass}`}>
              Explore the platform model, then join your workspace or login to continue delivery.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/signup" className="nebula-btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold">
                Join Us
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="nebula-btn-secondary rounded-xl px-5 py-2.5 text-sm font-semibold">
                Login
              </Link>
            </div>
          </section>
        </main>

        <footer className={`pb-2 text-center text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          © 2026 Nebula Cloud Platform. All infrastructure managed across AWS, Azure, and GCP.
          <br />
          Built for Enterprise Reliability.
        </footer>
      </div>
    </div>
  );
};

export default Landing;
