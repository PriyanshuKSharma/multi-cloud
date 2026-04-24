import React from 'react';
import { Briefcase, Mail, MessageSquare, Users } from 'lucide-react';
import PublicInfoLayout from '../components/public/PublicInfoLayout';
import { useTheme } from '../context/ThemeContext';

const channels = [
  {
    title: 'Support requests',
    description: 'For help with access, account flow, or product usage questions.',
    actionLabel: 'Email support',
    icon: MessageSquare,
  },
  {
    title: 'Sales and subscriptions',
    description: 'For plan upgrades, enterprise scope, and platform rollout discussions.',
    actionLabel: 'Contact sales',
    icon: Briefcase,
  },
  {
    title: 'Partnership and onboarding',
    description: 'For team onboarding coordination or broader platform adoption conversations.',
    actionLabel: 'Start a conversation',
    icon: Users,
  },
];

const ContactUs: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'priyanshu17ks@gmail.com';

  return (
    <PublicInfoLayout
      eyebrow="Contact Us"
      title="Reach the Nebula team for support, subscriptions, or onboarding discussions."
      description="The footer contact link now routes to a public page with working contact actions instead of a dead placeholder."
      accent="rose"
      icon={<Mail className="h-8 w-8" />}
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {channels.map(({ title, description, actionLabel, icon: Icon }) => (
          <article
            key={title}
            className={`rounded-3xl border p-5 ${
              isLight ? 'border-slate-200 bg-white/85 text-slate-700' : 'border-slate-800 bg-slate-950/55 text-slate-300'
            }`}
          >
            <div
              className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
                isLight ? 'bg-rose-50 text-rose-600' : 'bg-rose-500/12 text-rose-300'
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <h2 className={`mt-4 text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-slate-50'}`}>{title}</h2>
            <p className="mt-2 text-sm leading-relaxed">{description}</p>
            <a
              href={`mailto:${supportEmail}?subject=${encodeURIComponent(`Nebula ${title}`)}`}
              className={`mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                isLight
                  ? 'border border-slate-200 bg-white text-slate-700 hover:border-rose-300 hover:text-slate-900'
                  : 'border border-slate-700 bg-slate-900 text-slate-200 hover:border-rose-400/45 hover:text-slate-50'
              }`}
            >
              <Mail className="h-4 w-4" />
              {actionLabel}
            </a>
          </article>
        ))}
      </div>
    </PublicInfoLayout>
  );
};

export default ContactUs;
