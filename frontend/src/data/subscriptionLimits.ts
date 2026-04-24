export type AppSubscriptionPlan = 'basic' | 'pro' | 'enterprise';

export type SubscriptionLimits = {
  projects: number | null;
  cloudAccounts: number | null;
};

const PLAN_ALIASES: Record<string, AppSubscriptionPlan> = {
  starter: 'basic',
  basic: 'basic',
  pro: 'pro',
  professional: 'pro',
  enterprise: 'enterprise',
};

const PLAN_LABELS: Record<AppSubscriptionPlan, string> = {
  basic: 'Basic',
  pro: 'Professional',
  enterprise: 'Enterprise',
};

const PLAN_LIMITS: Record<AppSubscriptionPlan, SubscriptionLimits> = {
  basic: {
    projects: 5,
    cloudAccounts: 1,
  },
  pro: {
    projects: 25,
    cloudAccounts: null,
  },
  enterprise: {
    projects: null,
    cloudAccounts: null,
  },
};

export const normalizeSubscriptionPlan = (value: unknown): AppSubscriptionPlan => {
  const normalized = String(value ?? '').trim().toLowerCase();
  return PLAN_ALIASES[normalized] ?? 'basic';
};

export const getSubscriptionLimits = (value: unknown): SubscriptionLimits =>
  PLAN_LIMITS[normalizeSubscriptionPlan(value)];

export const getSubscriptionPlanLabel = (value: unknown): string =>
  PLAN_LABELS[normalizeSubscriptionPlan(value)];
