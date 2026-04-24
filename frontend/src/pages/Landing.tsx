import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CloudLightning,
  Gauge,
  Github,
  Globe,
  Globe2,
  Layers3,
  Linkedin,
  Moon,
  ShieldCheck,
  Sun,
  Twitter,
  Users,
  Workflow,
  Check,
  Zap,
  Star,
  Crown,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import AuthCloudBackdrop from '../components/auth/AuthCloudBackdrop';


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

const testimonials = [
  {
    quote:
      'Nebula gave our platform team one operating layer for AWS, Azure, and GCP without hiding the controls we still needed.',
    name: 'Platform Engineering Team',
    role: 'Internal preview feedback',
  },
  {
    quote:
      'The strongest part is the governance posture. Teams can move faster, but there is still clear operational visibility.',
    name: 'Cloud Operations Lead',
    role: 'Control and compliance review',
  },
  {
    quote:
      'The interface reduces context switching. Provisioning, oversight, and delivery tracking feel like one coherent workflow.',
    name: 'Delivery Engineering Group',
    role: 'Workflow validation',
  },
];

const faqs = [
  {
    question: 'What does Nebula manage?',
    answer: 'Nebula coordinates provisioning, governance, visibility, and operator workflows across AWS, Azure, and GCP.',
  },
  {
    question: 'Who is the platform built for?',
    answer: 'It is designed for engineering organizations that need repeatable multi-cloud operations with controlled access and clearer delivery oversight.',
  },
  {
    question: 'Can teams start small and scale later?',
    answer: 'Yes. The pricing model supports smaller starting footprints and expands into higher-governance operational tiers as usage grows.',
  },
  {
    question: 'Where can I get support or policy details?',
    answer: 'Use the Help Center, Contact Us, Privacy Policy, and Terms of Service links in the footer for support and legal information.',
  },
];

const footerSections = [
  {
    title: 'Platform',
    links: [
      { label: 'Features', type: 'section', target: 'features' },
      { label: 'Pricing', type: 'section', target: 'pricing' },
      { label: 'Testimonials', type: 'section', target: 'testimonials' },
      { label: 'FAQ', type: 'section', target: 'faq' },
    ],
  },
  {
    title: 'Legal & Support',
    links: [
      { label: 'Privacy Policy', type: 'route', target: '/privacy-policy' },
      { label: 'Terms of Service', type: 'route', target: '/terms-of-service' },
      { label: 'Help Center', type: 'route', target: '/help-center' },
      { label: 'Contact Us', type: 'route', target: '/contact-us' },
    ],
  },
] as const;

const teamMembers = [
  {
    name: 'Priyanshu Kumar Sharma',
    college: 'Ajeenkya D Y Patil University',
    role: 'Product, Platform & Infrastructure Lead',
    focus: 'Platform architecture, cloud systems, provisioning automation, deployment reliability, policy integration and long-range product direction.',
    profiles: [
      { label: 'GitHub', href: 'https://github.com/PriyanshuKSharma', icon: Github },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/priyanshu-kumar-sharma-333800251/', icon: Linkedin },
      { label: 'Twitter', href: null, icon: Twitter },
      { label: 'Portfolio', href: 'https://priyanshuksharma.github.io/portfolio_priyanshuksharma/', icon: Globe },
    ],
  },
  {
    name: 'Vaishnavi Jadhav',
    college: 'Ajeenkya D Y Patil University',
    role: 'Frontend & UX Engineer',
    focus: 'Interface systems, workflow design, and operator experience quality.',
    profiles: [
      { label: 'GitHub', href: 'https://github.com/vaish105', icon: Github },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/vaishnavi-jadhav-92bb6635b?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app', icon: Linkedin },
      { label: 'Twitter', href: null, icon: Twitter },
      { label: 'Portfolio', href: null, icon: Globe },
    ],
  },
  {
    name: 'Vaibhav Gulge',
    college: 'Ajeenkya D Y Patil University',
    role: 'Frontend & UX Engineer',
    focus: 'Interface systems, workflow design, and operator experience quality.',
    profiles: [
      { label: 'GitHub', href: 'https://github.com/VaibhavGulge', icon: Github },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/vaibhav-gulge?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app', icon: Linkedin },
      { label: 'Twitter', href: null, icon: Twitter },
      { label: 'Portfolio', href: null, icon: Globe },
    ],
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
  const teamProfileLinkClass = isLight
    ? 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-slate-900'
    : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-blue-400/45 hover:text-slate-50';
  const teamProfileDisabledClass = isLight
    ? 'border-slate-200/80 bg-slate-100/90 text-slate-500'
    : 'border-slate-700/80 bg-slate-900/70 text-slate-500';

  const TeamSignature: React.FC<{ light?: boolean }> = ({ light = false }) => (
    <div className={`flex items-center gap-1.5 opacity-40 transition-opacity hover:opacity-100 ${light ? 'text-slate-100' : isLight ? 'text-slate-400' : 'text-slate-500'}`}>
      <Users className="h-3 w-3" />
      <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Crafted by Nebula Engineering Group</span>
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AuthCloudBackdrop />

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
              <div className="mt-10">
                <TeamSignature />
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

          <section id="features" className={`border-b py-14 ${dividerClass}`}>
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-500">Core Capabilities</p>
              <div className="flex items-center justify-between gap-4 mt-2">
                <h2 className={`text-2xl font-bold sm:text-3xl ${textStrongClass}`}>Designed for serious cloud operations</h2>
                <TeamSignature />
              </div>
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
              <div className="mt-6">
                <TeamSignature />
              </div>
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

          <section id="team" className={`border-b py-14 ${dividerClass}`}>
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
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {member.profiles.map((profile) => {
                      const Icon = profile.icon;

                      if (!profile.href) {
                        return (
                          <span
                            key={profile.label}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${teamProfileDisabledClass}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            <span>{profile.label}</span>
                            <span className="text-[10px] uppercase tracking-[0.14em]">Unavailable</span>
                          </span>
                        );
                      }

                      return (
                        <a
                          key={profile.label}
                          href={profile.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${teamProfileLinkClass}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span>{profile.label}</span>
                        </a>
                      );
                    })}
                  </div>
                </motion.article>
              ))}
            </div>
          </section>

          <section id="testimonials" className={`border-b py-14 ${dividerClass}`}>
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-500">Testimonials</p>
              <div className="flex items-center justify-between gap-4 mt-2">
                <h2 className={`text-2xl font-bold sm:text-3xl ${textStrongClass}`}>What teams value in the platform</h2>
                <TeamSignature />
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {testimonials.map((item, index) => (
                <motion.article
                  key={item.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.32, delay: index * 0.06 }}
                  className={`border-l-2 border-blue-500/60 pl-4`}
                >
                  <p className={`text-sm leading-relaxed ${textMutedClass}`}>&ldquo;{item.quote}&rdquo;</p>
                  <p className={`mt-4 text-sm font-semibold ${textStrongClass}`}>{item.name}</p>
                  <p className={`text-xs uppercase tracking-[0.14em] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{item.role}</p>
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
              <div className="mt-6 flex justify-center">
                <TeamSignature />
              </div>
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
                    <span className={`text-4xl font-bold ${textStrongClass}`}>$4</span>
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
                    <span className={`text-4xl font-bold ${textStrongClass}`}>$19</span>
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

          <section id="faq" className={`border-b py-14 ${dividerClass}`}>
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-500">FAQ</p>
              <div className="flex items-center justify-between gap-4 mt-2">
                <h2 className={`text-2xl font-bold sm:text-3xl ${textStrongClass}`}>Common questions before you join</h2>
                <TeamSignature />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {faqs.map((item, index) => (
                <motion.article
                  key={item.question}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.32, delay: index * 0.05 }}
                  className={`border-l-2 border-blue-500/60 pl-4`}
                >
                  <h3 className={`text-base font-semibold ${textStrongClass}`}>{item.question}</h3>
                  <p className={`mt-2 text-sm leading-relaxed ${textMutedClass}`}>{item.answer}</p>
                </motion.article>
              ))}
            </div>
          </section>
        </main>

        <footer className={`border-t pt-8 ${dividerClass}`}>
          <div className="grid gap-8 pb-6 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <div className="space-y-2">
              <p className={`text-sm font-semibold ${textStrongClass}`}>Nebula Cloud Platform</p>
              <p className={`max-w-md text-sm leading-relaxed ${textMutedClass}`}>
                Enterprise multi-cloud operations across AWS, Azure, and GCP, built for reliable delivery and governed scale.
              </p>
              <div className={`pt-2 text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                © 2026 Nebula Cloud Platform. All rights are reserved.
              </div>
            </div>

            {footerSections.map((group) => (
              <div key={group.title}>
                <p className={`text-sm font-semibold ${textStrongClass}`}>{group.title}</p>
                <div className="mt-3 space-y-2.5">
                  {group.links.map((item) =>
                    item.type === 'section' ? (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => scrollToSection(item.target)}
                        className={`block text-sm transition-colors ${isLight ? 'text-slate-600 hover:text-blue-600' : 'text-slate-400 hover:text-blue-400'}`}
                      >
                        {item.label}
                      </button>
                    ) : (
                      <Link
                        key={item.label}
                        to={item.target}
                        className={`block text-sm transition-colors ${isLight ? 'text-slate-600 hover:text-blue-600' : 'text-slate-400 hover:text-blue-400'}`}
                      >
                        {item.label}
                      </Link>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className={`pb-2 text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            All infrastructure managed across AWS, Azure, and GCP.
            <br />
            Built for Enterprise Reliability.
          </div>
        </footer>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="fixed bottom-6 right-6 z-50 group"
      >
        <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur-md shadow-2xl transition-all hover:-translate-y-1 ${isLight ? 'bg-white/80 border-slate-200 shadow-blue-500/10' : 'bg-slate-900/80 border-slate-700 shadow-blue-500/20'}`}>
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
            <div className="relative h-8 w-8 rounded-full border-2 border-blue-500/30 overflow-hidden bg-blue-500/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </div>
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${textStrongClass}`}>Nebula OS</p>
            <p className={`text-[9px] font-medium ${textMutedClass}`}>Built by 3-Member Engineering Group</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Landing;
