import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  Cloud,
  CloudLightning,
  Gauge,
  ShieldCheck,
  Users,
  UserRound,
  Workflow,
} from 'lucide-react';
import AuthCloudBackdrop from '../components/auth/AuthCloudBackdrop';

const capabilities = [
  {
    title: 'Unified Multi-Cloud Operations',
    description: 'Provision, monitor, and manage AWS, Azure, and GCP resources through one operational interface.',
    icon: Cloud,
  },
  {
    title: 'Secure-by-Default Architecture',
    description: 'Use project isolation, credential controls, and policy-driven workflows to reduce risk.',
    icon: ShieldCheck,
  },
  {
    title: 'Automation and Deployment Insight',
    description: 'Track deployment lifecycle, infrastructure state, and operational activity in real time.',
    icon: Workflow,
  },
];

const reasonsToJoin = [
  {
    title: 'Faster Delivery Across Clouds',
    detail: 'Standardize workflows and cut operational friction for infrastructure teams.',
    icon: Gauge,
  },
  {
    title: 'Stronger Governance',
    detail: 'Apply policies and visibility controls without slowing down delivery velocity.',
    icon: ShieldCheck,
  },
  {
    title: 'Built for Team Scale',
    detail: 'Align platform, DevOps, and engineering teams around one shared control plane.',
    icon: Users,
  },
];

const teamMembers = [
  {
    name: 'Priyanshu K. Sharma',
    role: 'Product & Platform Lead',
    focus: 'Architecture strategy, backend platform engineering, and cloud system design.',
  },
  {
    name: 'Team Member 02',
    role: 'Infrastructure Engineer',
    focus: 'Provisioning workflows, automation reliability, and deployment standards.',
  },
  {
    name: 'Team Member 03',
    role: 'Frontend & UX Engineer',
    focus: 'Dashboard usability, workflow design, and product interface quality.',
  },
];

const Landing: React.FC = () => {
  const handleScrollToWhyJoin = () => {
    document.getElementById('why-join')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AuthCloudBackdrop />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-12 pt-7 sm:px-6 lg:px-10">
        <header className="mb-10 rounded-2xl border border-slate-300/15 bg-slate-950/45 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/35 bg-blue-500/15 text-blue-200">
                <CloudLightning className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-wide text-white">Nebula Cloud Platform</p>
                <p className="truncate text-[11px] uppercase tracking-[0.16em] text-slate-400">Enterprise Multi-Cloud Operations</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-xl border border-slate-300/20 bg-slate-900/65 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-blue-300/40 hover:bg-slate-900"
              >
                Login
              </Link>

              <Link
                to="/signup"
                className="rounded-xl border border-blue-400/45 bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_26px_-16px_rgba(59,130,246,0.85)] transition hover:from-blue-400 hover:to-indigo-400"
              >
                Join Us
              </Link>
            </div>
          </div>
        </header>

        <main className="space-y-8">
          <section className="rounded-3xl border border-slate-300/15 bg-slate-950/45 p-6 backdrop-blur-xl sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/28 bg-blue-500/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">
                  <Building2 className="h-3.5 w-3.5" />
                  Built for Cloud Organizations
                </div>

                <h1 className="mt-5 text-4xl font-bold leading-tight text-white sm:text-5xl">
                  Operate cloud infrastructure like a modern platform organization.
                </h1>

                <p className="mt-4 max-w-2xl text-base text-slate-300">
                  Nebula helps engineering teams manage infrastructure delivery with consistency, visibility, and governance across AWS, Azure, and GCP.
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleScrollToWhyJoin}
                    className="rounded-xl border border-slate-300/20 bg-slate-900/65 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-blue-300/40 hover:bg-slate-900"
                  >
                    Why Join Us
                  </button>

                  <Link
                    to="/signup"
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-400/45 bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-blue-400 hover:to-indigo-400"
                  >
                    Join Us
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    to="/login"
                    className="rounded-xl border border-blue-400/35 bg-blue-500/12 px-4 py-2.5 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/18"
                  >
                    Login
                  </Link>
                </div>
              </motion.div>

              <div className="grid gap-3">
                {capabilities.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <motion.article
                      key={item.title}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.08 }}
                      className="rounded-2xl border border-slate-300/12 bg-slate-900/55 p-4"
                    >
                      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-300/30 bg-blue-500/14 text-blue-200">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <h2 className="text-sm font-semibold text-white">{item.title}</h2>
                      <p className="mt-1.5 text-sm text-slate-300/90">{item.description}</p>
                    </motion.article>
                  );
                })}
              </div>
            </div>
          </section>

          <section id="why-join" className="rounded-3xl border border-slate-300/15 bg-slate-950/45 p-6 backdrop-blur-xl sm:p-8">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">Why Join Us</p>
              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">A practical platform for cloud teams</h2>
              <p className="mt-2 text-sm text-slate-300">Designed for reliability, governance, and speed without unnecessary complexity.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {reasonsToJoin.map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.article
                    key={item.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.4, delay: index * 0.06 }}
                    className="rounded-2xl border border-slate-300/12 bg-slate-900/55 p-4"
                  >
                    <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-300/30 bg-blue-500/14 text-blue-200">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="text-base font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm text-slate-300/90">{item.detail}</p>
                  </motion.article>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-300/15 bg-slate-950/45 p-6 backdrop-blur-xl sm:p-8">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">Team</p>
              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Built by a 3-member engineering group</h2>
              <p className="mt-2 text-sm text-slate-300">Combining product architecture, infrastructure engineering, and user experience execution.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {teamMembers.map((member, index) => (
                <motion.article
                  key={member.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4, delay: index * 0.06 }}
                  className="rounded-2xl border border-slate-300/12 bg-slate-900/55 p-4"
                >
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-300/30 bg-blue-500/14 text-blue-100">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <p className="text-lg font-semibold text-white">{member.name}</p>
                  <p className="mt-1 text-sm font-medium text-blue-200">{member.role}</p>
                  <p className="mt-2 text-sm text-slate-300/90">{member.focus}</p>
                </motion.article>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-blue-400/22 bg-gradient-to-r from-blue-500/12 via-slate-900/70 to-indigo-500/12 p-7 text-center backdrop-blur-xl sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">Get Started</p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Join Nebula to modernize multi-cloud operations</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-300">
              Create your account to start building your workspace, or login to continue managing your platform environment.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-xl border border-blue-400/45 bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-blue-400 hover:to-indigo-400"
              >
                Join Us
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                to="/login"
                className="rounded-xl border border-slate-300/20 bg-slate-900/65 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-blue-300/40 hover:bg-slate-900"
              >
                Login
              </Link>
            </div>
          </section>
        </main>

        <footer className="mt-8 pb-2 text-center text-xs text-slate-400">Nebula Multi-Cloud Platform • AWS • Azure • GCP</footer>
      </div>
    </div>
  );
};

export default Landing;
