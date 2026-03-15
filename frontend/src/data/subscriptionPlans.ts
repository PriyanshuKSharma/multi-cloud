export const subscriptionPlanIds = ['basic', 'pro', 'enterprise'] as const;

export type SubscriptionPlanId = (typeof subscriptionPlanIds)[number];

export type SubscriptionPlan = {
  id: SubscriptionPlanId;
  name: string;
  price: {
    usd: number;
    inr: number;
  };
  description: string;
  features: string[];
  tone: 'blue' | 'purple' | 'indigo';
  popular?: boolean;
};

export const defaultSubscriptionPlanId: SubscriptionPlanId = 'pro';

export const isSubscriptionPlanId = (value: unknown): value is SubscriptionPlanId =>
  typeof value === 'string' &&
  subscriptionPlanIds.includes(value as SubscriptionPlanId);

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: { usd: 0, inr: 0 },
    description: 'Perfect for individuals and small teams.',
    tone: 'blue',
    features: [
      '1 Cloud Account',
      '5 Active Projects',
      'Basic Analytics',
      'Community Support',
    ],
  },
  {
    id: 'pro',
    name: 'Professional',
    price: { usd: 4, inr: 370 },
    description: 'Scaling operations with advanced automation.',
    tone: 'purple',
    popular: true,
    features: [
      'Unlimited Cloud Accounts',
      '25 Active Projects',
      'Advanced Cost Intelligence',
      'Priority Email Support',
      'Custom Deployment Filters',
      'Automated Backups',
      'Resource Scheduling',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: { usd: 199, inr: 16000 },
    description: 'Enterprise-grade security and control.',
    tone: 'indigo',
    features: [
      'Everything in Professional',
      'Multi-Org Management',
      'Unlimited Active Projects',
      'Dedicated Account Manager',
      'Custom SLA & Support',
      'SSO & SAML Integration',
      'Advanced Role-Based Access',
      'Compliance Auditing',
    ],
  },
];
