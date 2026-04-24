import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Check, 
  Zap, 
  Shield, 
  Rocket, 
  Globe, 
  CreditCard,
  Crown,
  Star
} from 'lucide-react';
import PageHero from '../components/ui/PageHero';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { subscriptionPlans } from '../data/subscriptionPlans';
import { getSubscriptionPlanLabel, normalizeSubscriptionPlan } from '../data/subscriptionLimits';

const planIcons = {
  basic: <Rocket className="w-6 h-6" />,
  pro: <Zap className="w-6 h-6" />,
  enterprise: <Crown className="w-6 h-6" />,
};

const Subscriptions: React.FC = () => {
  const [currency, setCurrency] = useState<'usd' | 'inr'>('usd');
  const { user, refreshUser } = useAuth();
  const currentPlanId = normalizeSubscriptionPlan(user?.subscription_plan);
  const currentPlanLabel = getSubscriptionPlanLabel(user?.subscription_plan);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [switchingPlanId, setSwitchingPlanId] = useState<string | null>(null);

  const switchPlan = async (planId: string) => {
    setStatusMessage(null);
    setErrorMessage(null);
    setSwitchingPlanId(planId);

    try {
      await api.post('/auth/subscription-plan', { subscription_plan: planId });
      await refreshUser();
      setStatusMessage(`Active subscription updated to ${getSubscriptionPlanLabel(planId)}.`);
    } catch (err: any) {
      setStatusMessage(null);
      setErrorMessage(err?.response?.data?.detail || 'Failed to update subscription plan.');
    } finally {
      setSwitchingPlanId(null);
    }
  };

  return (


    <div className="w-full space-y-8 p-6 pb-12 lg:p-8 xl:p-10">
      <PageHero
        id="subscriptions"
        tone="indigo"
        eyebrow="Flexible Plans"
        eyebrowIcon={<Star className="h-3.5 w-3.5" />}
        title="Choose Your Plan"
        titleIcon={<Globe className="w-8 h-8 text-indigo-400" />}
        description="Select the perfect subscription for your cloud infrastructure needs. Scale as you grow."
        chips={[
          { label: `Current plan: ${currentPlanLabel}`, tone: 'indigo' },
        ]}
        actions={
          <div className="flex items-center bg-gray-900/40 p-1 rounded-xl border border-gray-800/50 backdrop-blur-sm">
            <button
              onClick={() => setCurrency('usd')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currency === 'usd' 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setCurrency('inr')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currency === 'inr' 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              INR (₹)
            </button>
          </div>
        }
        guide={{
          title: 'Subscription Overview',
          purpose: 'Monthly subscriptions provide predictable billing and access to premium features.',
          actions: [
            'toggle between USD and INR pricing',
            'compare feature sets across plans',
            'upgrade or downgrade anytime from this page',
          ],
        }}
      />

      {statusMessage ? (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {statusMessage}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {subscriptionPlans.map((plan, index) => {
          const isCurrent = plan.id === currentPlanId;
          const isSwitching = switchingPlanId === plan.id;
          const isBusy = switchingPlanId !== null;
          const ctaLabel = isCurrent ? 'Current Plan' : `Switch to ${plan.name}`;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className={`relative flex flex-col rounded-3xl border p-8 transition-all ${
                isCurrent
                  ? 'border-emerald-500/55 bg-[#0f0f13] shadow-2xl shadow-emerald-500/10'
                  : plan.popular
                    ? 'border-indigo-500/50 bg-[#0f0f13] shadow-2xl shadow-indigo-500/10'
                    : 'border-gray-800/50 bg-[#0c0c0e] hover:translate-y-[-4px]'
              }`}
            >
              {isCurrent ? (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg">
                  Current
                </div>
              ) : plan.popular ? (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg">
                  Most Popular
                </div>
              ) : null}

            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-6 ${
              plan.tone === 'blue' ? 'bg-blue-500/10 text-blue-400 border border-blue-400/20' :
              plan.tone === 'purple' ? 'bg-purple-500/10 text-purple-400 border border-purple-400/20' :
              'bg-indigo-500/10 text-indigo-400 border border-indigo-400/20'
            }`}>
              {planIcons[plan.id]}
            </div>

            <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">{plan.description}</p>

            <div className="mb-8">
              <span className="text-4xl font-black text-white">
                {currency === 'usd' ? '$' : '₹'}
                {plan.price[currency].toLocaleString()}
              </span>
              <span className="text-gray-500 ml-1">/month</span>
            </div>

            <button
              type="button"
              onClick={() => switchPlan(plan.id)}
              disabled={isCurrent || isBusy}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 mb-8 disabled:cursor-not-allowed disabled:opacity-70 ${
                isCurrent
                  ? 'bg-emerald-600/30 text-emerald-100 border border-emerald-500/25'
                  : plan.popular
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20'
                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              {isSwitching ? 'Updating…' : ctaLabel}
            </button>

            <div className="space-y-4 flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">What's Included</p>
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <div className={`mt-0.5 shrink-0 h-5 w-5 rounded-full flex items-center justify-center bg-gray-800/50 ${
                    plan.popular ? 'text-indigo-400' : 'text-gray-400'
                  }`}>
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm text-gray-300 leading-tight">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
          );
        })}
      </div>

      <div className="mt-16 bg-[#0c0c0e] border border-gray-800/50 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white">Need a custom plan?</h4>
            <p className="text-gray-400 text-sm mt-1">We offer tailor-made solutions for large organizations and specific compliance needs.</p>
          </div>
        </div>
        <button className="px-8 py-3.5 rounded-2xl bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors whitespace-nowrap">
          Contact Sales
        </button>
      </div>
    </div>
  );
};

export default Subscriptions;
