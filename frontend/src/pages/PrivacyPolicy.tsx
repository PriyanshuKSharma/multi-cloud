import React from 'react';
import { Database, Lock, Mail, ShieldCheck } from 'lucide-react';
import PublicInfoLayout from '../components/public/PublicInfoLayout';
import { useTheme } from '../context/ThemeContext';

const sections = [
  {
    title: 'Account data',
    description:
      'Nebula stores the registration details required to create and secure your workspace, including name, email address, role, organization, and authentication state.',
    icon: ShieldCheck,
  },
  {
    title: 'Operational telemetry',
    description:
      'The platform may process cloud inventory, billing summaries, deployment status, and infrastructure activity needed to render the product experience and governance views.',
    icon: Database,
  },
  {
    title: 'Security posture',
    description:
      'Access is protected through authenticated sessions, controlled application roles, and provider-specific integration boundaries. Sensitive secrets should be handled through backend configuration and provider controls.',
    icon: Lock,
  },
];

const PrivacyPolicy: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'priyanshu17ks@gmail.com';

  return (
    <PublicInfoLayout
      eyebrow="Privacy Policy"
      title="How Nebula handles account information and cloud-facing product data."
      description="This summary explains what information the platform uses to operate the product, protect access, and support multi-cloud workflows."
      accent="blue"
      icon={<ShieldCheck className="h-8 w-8" />}
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {sections.map(({ title, description, icon: Icon }) => (
          <article
            key={title}
            className={`rounded-3xl border p-5 ${
              isLight ? 'border-slate-200 bg-white/85 text-slate-700' : 'border-slate-800 bg-slate-950/55 text-slate-300'
            }`}
          >
            <div
              className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
                isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/12 text-blue-300'
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <h2 className={`mt-4 text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-slate-50'}`}>{title}</h2>
            <p className="mt-2 text-sm leading-relaxed">{description}</p>
          </article>
        ))}
      </div>

      <section
        className={`mt-5 rounded-3xl border p-6 ${
          isLight ? 'border-slate-200 bg-white/85' : 'border-slate-800 bg-slate-950/55'
        }`}
      >
        <h2 className={`text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-slate-50'}`}>Questions about privacy</h2>
        <p className={`mt-2 text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
          If you need clarification about data handling, retention, or support-driven access, contact the team directly.
        </p>
        <a
          href={`mailto:${supportEmail}?subject=${encodeURIComponent('Nebula Privacy Question')}`}
          className={`mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            isLight
              ? 'border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-slate-900'
              : 'border border-slate-700 bg-slate-900 text-slate-200 hover:border-blue-400/45 hover:text-slate-50'
          }`}
        >
          <Mail className="h-4 w-4" />
          Contact privacy support
        </a>
      </section>
    </PublicInfoLayout>
  );
};

export default PrivacyPolicy;
