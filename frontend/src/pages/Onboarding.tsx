import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../api/axios';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Cloud, KeyRound, Moon, ShieldCheck, Sun } from 'lucide-react';
import AuthCloudBackdrop from '../components/auth/AuthCloudBackdrop';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getSubscriptionLimits, getSubscriptionPlanLabel } from '../data/subscriptionLimits';

const REGIONS = {
  aws: [
    { id: 'us-east-1', name: 'US East (N. Virginia)' },
    { id: 'us-west-2', name: 'US West (Oregon)' },
    { id: 'eu-west-1', name: 'Europe (Ireland)' },
    { id: 'ap-south-1', name: 'Asia Pacific (Mumbai)' },
    { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)' },
  ],
  azure: [
    { id: 'eastus', name: 'East US' },
    { id: 'westus2', name: 'West US 2' },
    { id: 'westeurope', name: 'West Europe' },
    { id: 'centralindia', name: 'Central India' },
    { id: 'southeastasia', name: 'Southeast Asia' },
  ],
};

const STEP_TITLES = ['AWS Account', 'Azure Account', 'Google Cloud'];

const Onboarding: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState(0);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { register, handleSubmit, reset } = useForm();
  const cloudAccountLimit = getSubscriptionLimits(user?.subscription_plan).cloudAccounts;
  const hasReachedCloudAccountLimit =
    cloudAccountLimit !== null && connectedAccounts >= cloudAccountLimit;
  const cloudAccountLimitMessage =
    hasReachedCloudAccountLimit && cloudAccountLimit !== null
      ? `${getSubscriptionPlanLabel(user?.subscription_plan)} plan allows up to ${cloudAccountLimit} cloud account${cloudAccountLimit === 1 ? '' : 's'}. Continue to the dashboard or remove an existing account before adding another.`
      : null;

  React.useEffect(() => {
    let active = true;

    const loadConnectedAccounts = async () => {
      try {
        const response = await api.get('/credentials/');
        const items = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.items)
            ? response.data.items
            : [];
        if (active) {
          setConnectedAccounts(items.length);
        }
      } catch (err) {
        console.error('Failed to load connected cloud accounts during onboarding', err);
      }
    };

    void loadConnectedAccounts();

    return () => {
      active = false;
    };
  }, []);

  const onSubmitAws = async (data: any) => {
    setLoading(true);
    setSubmitError(null);
    try {
      await api.post('/credentials/', {
        provider: 'aws',
        name: 'My AWS Account',
        data: {
          access_key: data.access_key,
          secret_key: data.secret_key,
          region: data.region || 'us-east-1',
        },
      });
      const nextCount = connectedAccounts + 1;
      setConnectedAccounts(nextCount);
      if (cloudAccountLimit !== null && nextCount >= cloudAccountLimit) {
        navigate('/');
        return;
      }
      setStep(2);
      reset();
    } catch (err) {
      console.error(err);
      const detail =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { detail?: unknown } } }).response?.data?.detail;
      setSubmitError(typeof detail === 'string' ? detail : 'Failed to save AWS credentials.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitAzure = async (data: any) => {
    setLoading(true);
    setSubmitError(null);
    try {
      await api.post('/credentials/', {
        provider: 'azure',
        name: 'My Azure Account',
        data: {
          tenant_id: data.tenant_id,
          client_id: data.client_id,
          client_secret: data.client_secret,
          subscription_id: data.subscription_id,
          region: data.region || 'eastus',
        },
      });
      const nextCount = connectedAccounts + 1;
      setConnectedAccounts(nextCount);
      if (cloudAccountLimit !== null && nextCount >= cloudAccountLimit) {
        navigate('/');
        return;
      }
      setStep(3);
      reset();
    } catch (err) {
      console.error(err);
      const detail =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { detail?: unknown } } }).response?.data?.detail;
      setSubmitError(typeof detail === 'string' ? detail : 'Failed to save Azure credentials.');
    } finally {
      setLoading(false);
    }
  };

  const skipStep = () => {
    if (step < 3) setStep(step + 1);
    else navigate('/');
  };

  const finishSetup = () => {
    navigate('/');
  };

  const isLight = theme === 'light';
  const panelClass = isLight
    ? 'border border-slate-200/90 bg-white/88 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.24)]'
    : 'border border-slate-300/15 bg-slate-950/55 shadow-[0_24px_56px_-28px_rgba(2,6,23,0.75)]';
  const subPanelClass = isLight ? 'border border-slate-200/90 bg-white/84' : 'border border-slate-300/12 bg-slate-900/55';
  const textStrongClass = isLight ? 'text-slate-900' : 'text-white';
  const textMutedClass = isLight ? 'text-slate-600' : 'text-slate-300';
  const labelClass = isLight ? 'text-slate-600' : 'text-slate-300/90';

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AuthCloudBackdrop />

      <div className="relative z-10 min-h-screen px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
          <header className={`rounded-2xl px-4 py-3 backdrop-blur-xl sm:px-5 ${panelClass}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/12 text-blue-300">
                  <Cloud className="h-4.5 w-4.5" />
                </span>
                <span>
                  <span className={`block text-sm font-semibold ${textStrongClass}`}>Nebula Cloud</span>
                  <span className="block text-[11px] uppercase tracking-[0.14em] text-blue-500">Cloud Credential Setup</span>
                </span>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                  isLight
                    ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    : 'border border-slate-300/20 bg-slate-900/70 text-slate-200 hover:bg-slate-900'
                }`}
                aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
                title={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
              >
                {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                {isLight ? 'Dark' : 'Light'}
              </button>
            </div>
          </header>

          <div className={`rounded-3xl p-6 backdrop-blur-xl sm:p-8 ${panelClass}`}>
            <div className="text-center">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-400/35 bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/25">
                <ShieldCheck className="h-7 w-7 text-white" />
              </div>
              <h1 className={`mt-4 text-3xl font-bold ${textStrongClass}`}>Connect Your Cloud Accounts</h1>
              <p className={`mt-2 text-sm ${textMutedClass}`}>
                {cloudAccountLimit === 1
                  ? 'Connect your first cloud account to start provisioning resources and managing operations from one platform.'
                  : 'Configure providers to start provisioning resources and managing operations from one platform.'}
              </p>
            </div>

            <div className="relative mt-8 mb-8 flex items-center justify-between gap-2">
              <div className={`absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 rounded-full ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`} />
              {[1, 2, 3].map((s) => {
                const isComplete = step > s;
                const isCurrent = step === s;
                return (
                  <div key={s} className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                        isComplete || isCurrent
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white'
                          : isLight
                            ? 'bg-white text-slate-500 border border-slate-200'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {isComplete ? <CheckCircle2 className="h-5 w-5" /> : s}
                    </div>
                    <p className={`hidden text-[11px] font-medium sm:block ${isCurrent ? 'text-blue-500' : textMutedClass}`}>
                      {STEP_TITLES[s - 1]}
                    </p>
                  </div>
                );
              })}
            </div>

            {submitError && (
              <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {submitError}
              </div>
            )}

            {cloudAccountLimitMessage ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className={`rounded-xl border px-5 py-6 ${subPanelClass}`}>
                  <p className={`text-sm ${textMutedClass}`}>{cloudAccountLimitMessage}</p>
                  <button onClick={finishSetup} className="nebula-btn-primary mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold">
                    Continue to Dashboard
                  </button>
                </div>
              </motion.div>
            ) : step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h2 className={`mb-4 flex items-center gap-2 text-xl font-bold ${textStrongClass}`}>
                  <KeyRound className="h-5 w-5 text-blue-500" /> AWS Credentials
                </h2>

                <form onSubmit={handleSubmit(onSubmitAws)} className="space-y-4">
                  <div>
                    <label className={`mb-1 block text-sm font-medium ${labelClass}`}>Access Key ID</label>
                    <input {...register('access_key')} className="input-field w-full p-3" placeholder="AKIA..." />
                  </div>

                  <div>
                    <label className={`mb-1 block text-sm font-medium ${labelClass}`}>Secret Access Key</label>
                    <input {...register('secret_key')} type="password" className="input-field w-full p-3" placeholder="wJalr..." />
                  </div>

                  <div>
                    <label className={`mb-1 block text-sm font-medium ${labelClass}`}>Default Region</label>
                    <select {...register('region')} className="input-field w-full cursor-pointer appearance-none p-3">
                      {REGIONS.aws.map((r) => (
                        <option key={r.id} value={r.id} className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>
                          {r.name} ({r.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={skipStep}
                      className="nebula-btn-secondary rounded-xl px-5 py-2.5 text-sm font-semibold"
                    >
                      Skip
                    </button>
                    <button type="submit" disabled={loading} className="nebula-btn-primary flex-1 rounded-xl px-5 py-2.5 text-sm font-semibold">
                      {loading ? 'Verifying...' : 'Save & Continue'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {!cloudAccountLimitMessage && step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h2 className={`mb-4 flex items-center gap-2 text-xl font-bold ${textStrongClass}`}>
                  <KeyRound className="h-5 w-5 text-blue-500" /> Azure Credentials
                </h2>

                <form onSubmit={handleSubmit(onSubmitAzure)} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={`mb-1 block text-sm font-medium ${labelClass}`}>Tenant ID</label>
                      <input {...register('tenant_id')} className="input-field w-full p-3" placeholder="00000000-0000..." />
                    </div>
                    <div>
                      <label className={`mb-1 block text-sm font-medium ${labelClass}`}>Client ID</label>
                      <input {...register('client_id')} className="input-field w-full p-3" placeholder="00000000-0000..." />
                    </div>
                  </div>

                  <div>
                    <label className={`mb-1 block text-sm font-medium ${labelClass}`}>Client Secret</label>
                    <input {...register('client_secret')} type="password" className="input-field w-full p-3" placeholder="********" />
                  </div>

                  <div>
                    <label className={`mb-1 block text-sm font-medium ${labelClass}`}>Subscription ID</label>
                    <input {...register('subscription_id')} className="input-field w-full p-3" placeholder="00000000-0000..." />
                  </div>

                  <div>
                    <label className={`mb-1 block text-sm font-medium ${labelClass}`}>Default Region</label>
                    <select {...register('region')} className="input-field w-full cursor-pointer appearance-none p-3">
                      {REGIONS.azure.map((r) => (
                        <option key={r.id} value={r.id} className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>
                          {r.name} ({r.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={skipStep}
                      className="nebula-btn-secondary rounded-xl px-5 py-2.5 text-sm font-semibold"
                    >
                      Skip
                    </button>
                    <button type="submit" disabled={loading} className="nebula-btn-primary flex-1 rounded-xl px-5 py-2.5 text-sm font-semibold">
                      {loading ? 'Verifying...' : 'Save & Continue'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {!cloudAccountLimitMessage && step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h2 className={`mb-4 flex items-center gap-2 text-xl font-bold ${textStrongClass}`}>
                  <KeyRound className="h-5 w-5 text-blue-500" /> Google Cloud (Next)
                </h2>
                <div className={`rounded-xl border border-dashed p-6 text-center ${subPanelClass}`}>
                  <p className={`mb-4 text-sm ${textMutedClass}`}>
                    GCP credential onboarding will be available in the next release. You can continue to the dashboard now.
                  </p>
                  <button onClick={finishSetup} className="nebula-btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold">
                    Finish Setup
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
