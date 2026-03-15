import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import AddCredentialModal from '../components/AddCredentialModal';
import PageHero from '../components/ui/PageHero';
import { useAuth } from '../context/AuthContext';
import { getSubscriptionLimits, getSubscriptionPlanLabel } from '../data/subscriptionLimits';
import { useTheme } from '../context/ThemeContext';
import { Trash2, Plus, Shield, Key, Calendar, Cloud, Info, RefreshCw, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Credential {
  id: number;
  name: string;
  provider: string;
  created_at: string;
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const planLabel = getSubscriptionPlanLabel(user?.subscription_plan);
  const cloudAccountLimit = getSubscriptionLimits(user?.subscription_plan).cloudAccounts;
  const hasReachedCloudAccountLimit =
    cloudAccountLimit !== null && credentials.length >= cloudAccountLimit;
  const cloudAccountLimitMessage =
    hasReachedCloudAccountLimit && cloudAccountLimit !== null
      ? `${planLabel} plan allows up to ${cloudAccountLimit} cloud account${cloudAccountLimit === 1 ? '' : 's'}. Remove one to connect another.`
      : null;

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/credentials/');
      setCredentials(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCredential = async (id: number) => {
    if (!confirm('Are you sure you want to disconnect these credentials? This might affect active resources.')) return;
    try {
      await api.delete(`/credentials/${id}`);
      fetchCredentials();
    } catch (err) {
      console.error(err);
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'aws': return <Cloud className="w-5 h-5 text-orange-400" />;
      case 'azure': return <Cloud className="w-5 h-5 text-blue-400" />;
      case 'gcp': return <Cloud className="w-5 h-5 text-green-400" />;
      default: return <Key className="w-5 h-5 text-purple-400" />;
    }
  };

  const cardClass = isLight
    ? 'border border-slate-200 bg-white/92 shadow-[0_24px_50px_-32px_rgba(15,23,42,0.18)]'
    : 'border border-slate-800/80 bg-[#0f0f11] shadow-[0_24px_60px_-36px_rgba(2,6,23,0.7)]';
  const cardHeaderClass = isLight
    ? 'border-slate-200/70 bg-slate-50/80'
    : 'border-slate-800/70 bg-slate-950/25';
  const sectionTitleClass = isLight ? 'text-slate-900' : 'text-white';
  const mutedTextClass = isLight ? 'text-slate-600' : 'text-slate-400';
  const badgeSubtleClass = isLight
    ? 'border-slate-200 bg-white text-slate-700'
    : 'border-slate-700/70 bg-slate-900/70 text-slate-200';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-8 p-6 pb-12 lg:p-8 xl:p-10"
    >
      <PageHero
        id="settings"
        tone="indigo"
        eyebrow="Global account controls"
        eyebrowIcon={<Shield className="h-3.5 w-3.5" />}
        title="Security & Settings"
        titleIcon={<Shield className="w-8 h-8 text-indigo-300" />}
        description="Manage cloud credentials and security posture for provisioning and API operations."
        chips={[
          { label: `${credentials.length} credentials`, tone: 'indigo' },
          { label: planLabel, tone: 'blue' },
          { label: isLoading ? 'syncing...' : 'synced', tone: isLoading ? 'default' : 'emerald' },
        ]}
        guide={{
          title: 'About Settings',
          purpose: 'Settings centralizes security controls and cloud credential management for this account.',
          actions: [
            'connect or disconnect cloud credentials',
            'review provider access entries and creation timestamps',
            'maintain secure access posture for provisioning workflows',
          ],
        }}
        actions={
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => fetchCredentials()}
              disabled={isLoading}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
                isLight
                  ? 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                  : 'border border-slate-700/70 bg-slate-900/75 text-slate-100 hover:bg-slate-800/85'
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              disabled={hasReachedCloudAccountLimit}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-colors hover:from-blue-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {hasReachedCloudAccountLimit ? 'Account Limit Reached' : 'Connect Provider'}
            </button>
          </div>
        }
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <section className={`overflow-hidden rounded-[28px] ${cardClass}`}>
          <div className={`flex flex-col gap-3 border-b px-6 py-5 xl:flex-row xl:items-center xl:justify-between xl:px-7 ${cardHeaderClass}`}>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-400">Credentials</p>
              <h2 className={`mt-2 text-2xl font-semibold ${sectionTitleClass}`}>Connected cloud accounts</h2>
              <p className={`mt-2 text-sm ${mutedTextClass}`}>
                Credentials are used for inventory sync and provisioning API calls. Disconnect any provider you no longer need.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-2xl border px-3 py-2 text-xs font-semibold ${badgeSubtleClass}`}>
                {cloudAccountLimit === null ? 'Unlimited accounts' : `${credentials.length}/${cloudAccountLimit} used`}
              </span>
              <span className={`rounded-2xl border px-3 py-2 text-xs font-semibold ${badgeSubtleClass}`}>
                {isLoading ? 'syncing…' : 'ready'}
              </span>
            </div>
          </div>

          <div className="px-6 py-6 xl:px-7">
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-14">
                  <div className={`h-10 w-10 animate-spin rounded-full border-2 ${isLight ? 'border-blue-200 border-t-blue-500' : 'border-blue-500/20 border-t-blue-500'}`} />
                  <p className={`mt-4 text-sm ${mutedTextClass}`}>Loading credentials…</p>
                </div>
              ) : credentials.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
                  <div
                    className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full border ${
                      isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800/70 bg-slate-900/30'
                    }`}
                  >
                    <Key className={`h-10 w-10 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                  </div>
                  <h3 className={`mt-6 text-lg font-semibold ${sectionTitleClass}`}>No credentials connected</h3>
                  <p className={`mx-auto mt-2 max-w-md text-sm leading-relaxed ${mutedTextClass}`}>
                    Connect your first cloud account to start syncing inventory and deploying resources across AWS, Azure, or GCP.
                  </p>
                </motion.div>
              ) : (
                <div className="grid gap-4">
                  {credentials.map((cred, idx) => {
                    const providerKey = String(cred.provider ?? '').toLowerCase();
                    const providerBadgeClass =
                      providerKey === 'aws'
                        ? 'border-orange-500/25 bg-orange-500/10 text-orange-300'
                        : providerKey === 'azure'
                          ? 'border-blue-500/25 bg-blue-500/10 text-blue-300'
                          : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300';

                    return (
                      <motion.div
                        key={cred.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className={`group flex flex-col gap-4 rounded-[22px] border p-5 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                          isLight
                            ? 'border-slate-200 bg-white hover:bg-slate-50'
                            : 'border-slate-800/70 bg-slate-950/40 hover:bg-slate-900/55'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`rounded-2xl border p-3 ${
                              isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800/70 bg-slate-900/35'
                            }`}
                          >
                            {getProviderIcon(cred.provider)}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className={`text-base font-semibold ${sectionTitleClass}`}>{cred.name}</p>
                              <span className={`rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${providerBadgeClass}`}>
                                {providerKey || 'provider'}
                              </span>
                            </div>
                            <div className={`mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${mutedTextClass}`}>
                              <span className="inline-flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(cred.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <Info className="h-3.5 w-3.5" />
                                ID: #{cred.id}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteCredential(cred.id)}
                          className={`inline-flex items-center justify-center rounded-xl border p-2 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 ${
                            isLight
                              ? 'border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:text-red-700'
                              : 'border-slate-800/70 bg-slate-950/50 text-slate-300 hover:bg-red-500/10 hover:text-red-300'
                          }`}
                          title="Disconnect credential"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>
          </div>
        </section>

        <aside className="space-y-6">
          <section className={`rounded-[28px] p-6 xl:p-7 ${cardClass}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-400">Plan & Limits</p>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className={`text-2xl font-bold tracking-tight ${sectionTitleClass}`}>{planLabel}</p>
                <p className={`mt-2 text-sm ${mutedTextClass}`}>
                  {cloudAccountLimit === null
                    ? 'Unlimited cloud accounts available on this plan.'
                    : `${cloudAccountLimit} cloud account${cloudAccountLimit === 1 ? '' : 's'} allowed on this plan.`}
                </p>
              </div>
              <Link
                to="/subscriptions"
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition-colors ${
                  isLight
                    ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    : 'border-slate-700/70 bg-slate-900/70 text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                View plans
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div
                className={`rounded-2xl border p-4 ${
                  isLight ? 'border-slate-200 bg-slate-50/80' : 'border-slate-800/70 bg-slate-950/45'
                }`}
              >
                <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${mutedTextClass}`}>Cloud accounts used</p>
                <p className={`mt-3 text-3xl font-black ${sectionTitleClass}`}>{credentials.length}</p>
              </div>
              <div
                className={`rounded-2xl border p-4 ${
                  isLight ? 'border-slate-200 bg-slate-50/80' : 'border-slate-800/70 bg-slate-950/45'
                }`}
              >
                <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${mutedTextClass}`}>Remaining</p>
                <p className={`mt-3 text-3xl font-black ${sectionTitleClass}`}>
                  {cloudAccountLimit === null ? 'Unlimited' : Math.max(0, cloudAccountLimit - credentials.length)}
                </p>
              </div>
            </div>

            {cloudAccountLimitMessage ? (
              <div
                className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
                  isLight
                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                }`}
              >
                {cloudAccountLimitMessage}
              </div>
            ) : null}
          </section>

          <section className={`rounded-[28px] p-6 xl:p-7 ${cardClass}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-400">Security Notice</p>
            <div className="mt-4 flex items-start gap-3">
              <div
                className={`rounded-2xl border p-2.5 ${
                  isLight ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-blue-500/20 bg-blue-500/10 text-blue-200'
                }`}
              >
                <Info className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className={`text-sm leading-relaxed ${mutedTextClass}`}>
                  Your credentials are encrypted at rest and never shared with third parties. They are used only to communicate with cloud provider APIs
                  during inventory sync and resource provisioning.
                </p>
                <p className={`mt-3 text-sm leading-relaxed ${mutedTextClass}`}>
                  Tip: Disconnecting credentials does not automatically destroy existing cloud resources; it only removes Nebula’s access for future operations.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <AddCredentialModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchCredentials} 
      />
    </motion.div>
    );
};

export default Settings;
