import React from 'react';
import { ArrowRight, CreditCard, LifeBuoy, LockKeyhole, Mail, Workflow } from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicInfoLayout from '../components/public/PublicInfoLayout';
import { useTheme } from '../context/ThemeContext';

const helpCards = [
  {
    title: 'Platform workflows',
    description: 'Guidance for projects, deployments, cloud accounts, and day-to-day operator flows.',
    icon: Workflow,
  },
  {
    title: 'Account access',
    description: 'Help for sign-in, subscription selection, workspace entry, and account ownership questions.',
    icon: LockKeyhole,
  },
  {
    title: 'Billing and plans',
    description: 'Support for plan scope, subscription limits, and expected feature access by tier.',
    icon: CreditCard,
  },
];

const HelpCenter: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'priyanshu17ks@gmail.com';

  return (
    <PublicInfoLayout
      eyebrow="Help Center"
      title="Find support paths for product usage, account access, and subscription questions."
      description="Use this page as the public entry point for getting help before or after signing in."
      accent="emerald"
      icon={<LifeBuoy className="h-8 w-8" />}
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {helpCards.map(({ title, description, icon: Icon }) => (
          <article
            key={title}
            className={`rounded-3xl border p-5 ${
              isLight ? 'border-slate-200 bg-white/85 text-slate-700' : 'border-slate-800 bg-slate-950/55 text-slate-300'
            }`}
          >
            <div
              className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
                isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-500/12 text-emerald-300'
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <h2 className={`mt-4 text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-slate-50'}`}>{title}</h2>
            <p className="mt-2 text-sm leading-relaxed">{description}</p>
          </article>
        ))}
      </div>

      <section className="mt-5 grid gap-5 md:grid-cols-2">
        <div
          className={`rounded-3xl border p-6 ${
            isLight ? 'border-slate-200 bg-white/85 text-slate-700' : 'border-slate-800 bg-slate-950/55 text-slate-300'
          }`}
        >
          <h2 className={`text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-slate-50'}`}>Direct support</h2>
          <p className="mt-2 text-sm leading-relaxed">
            For questions that are not resolved through the product flow, send the team a direct request.
          </p>
          <a
            href={`mailto:${supportEmail}?subject=${encodeURIComponent('Nebula Help Request')}`}
            className={`mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              isLight
                ? 'border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-slate-900'
                : 'border border-slate-700 bg-slate-900 text-slate-200 hover:border-emerald-400/45 hover:text-slate-50'
            }`}
          >
            <Mail className="h-4 w-4" />
            Email support
          </a>
        </div>

        <div
          className={`rounded-3xl border p-6 ${
            isLight ? 'border-slate-200 bg-white/85 text-slate-700' : 'border-slate-800 bg-slate-950/55 text-slate-300'
          }`}
        >
          <h2 className={`text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-slate-50'}`}>Need a response path?</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Use the contact page for product, support, or onboarding inquiries if you need a clearer route.
          </p>
          <Link
            to="/contact-us"
            className={`mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              isLight
                ? 'border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-slate-900'
                : 'border border-slate-700 bg-slate-900 text-slate-200 hover:border-emerald-400/45 hover:text-slate-50'
            }`}
          >
            Contact us
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </PublicInfoLayout>
  );
};

export default HelpCenter;
