import React from 'react';
import { FileCheck2, Receipt, ShieldAlert, Users } from 'lucide-react';
import PublicInfoLayout from '../components/public/PublicInfoLayout';
import { useTheme } from '../context/ThemeContext';

const terms = [
  {
    title: 'Access and eligibility',
    description:
      'You are responsible for the accuracy of the account details used to register and for maintaining authorized access to your workspace.',
    icon: Users,
  },
  {
    title: 'Acceptable use',
    description:
      'The platform must not be used to violate provider policies, bypass security controls, interfere with other environments, or submit harmful workloads.',
    icon: ShieldAlert,
  },
  {
    title: 'Subscriptions and billing',
    description:
      'Feature access depends on the selected plan. Usage limits, project scope, and support posture are defined by the active subscription tier.',
    icon: Receipt,
  },
  {
    title: 'Service expectations',
    description:
      'Nebula provides orchestration, visibility, and governance tooling, but cloud-provider availability, quotas, and downstream service behavior remain subject to the provider you use.',
    icon: FileCheck2,
  },
];

const TermsOfService: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <PublicInfoLayout
      eyebrow="Terms of Service"
      title="Rules for using Nebula across account creation, subscriptions, and cloud operations."
      description="These terms set the baseline expectations for account ownership, permitted platform usage, and the relationship between Nebula workflows and provider infrastructure."
      accent="amber"
      icon={<FileCheck2 className="h-8 w-8" />}
    >
      <div className="grid gap-5 md:grid-cols-2">
        {terms.map(({ title, description, icon: Icon }) => (
          <article
            key={title}
            className={`rounded-3xl border p-5 ${
              isLight ? 'border-slate-200 bg-white/85 text-slate-700' : 'border-slate-800 bg-slate-950/55 text-slate-300'
            }`}
          >
            <div
              className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
                isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/12 text-amber-300'
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <h2 className={`mt-4 text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-slate-50'}`}>{title}</h2>
            <p className="mt-2 text-sm leading-relaxed">{description}</p>
          </article>
        ))}
      </div>
    </PublicInfoLayout>
  );
};

export default TermsOfService;
