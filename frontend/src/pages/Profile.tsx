import React from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Briefcase,
  Building2,
  Cloud,
  FolderKanban,
  KeyRound,
  Mail,
  Phone,
  Shield,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import PageHero from '../components/ui/PageHero';
import { useTheme } from '../context/ThemeContext';
import { subscriptionPlans } from '../data/subscriptionPlans';
import {
  getSubscriptionLimits,
  getSubscriptionPlanLabel,
  normalizeSubscriptionPlan,
} from '../data/subscriptionLimits';

interface UserProfile {
  id: number;
  email: string;
  full_name?: string | null;
  job_profile?: string | null;
  organization?: string | null;
  phone_number?: string | null;
  two_factor_enabled: boolean;
  subscription_plan?: string | null;
  last_password_change?: string | null;
}

const formatPasswordFreshness = (value: string | null | undefined): string => {
  if (!value) return 'No password rotation recorded yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Password change time unavailable';

  const diffMs = Date.now() - date.getTime();
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  if (days === 0) return 'Updated today';
  if (days === 1) return 'Updated 1 day ago';
  return `Updated ${days} days ago`;
};

const Profile: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = React.useState(false);
  const [showPasswordForm, setShowPasswordForm] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const [profileForm, setProfileForm] = React.useState({
    full_name: '',
    job_profile: '',
    organization: '',
    phone_number: '',
  });

  const [passwordForm, setPasswordForm] = React.useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const { data: currentUser, isLoading, error } = useQuery<UserProfile>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await axios.get('/auth/me');
      return response.data;
    },
  });

  React.useEffect(() => {
    if (!currentUser) return;
    setProfileForm({
      full_name: currentUser.full_name ?? '',
      job_profile: currentUser.job_profile ?? 'Administrator',
      organization: currentUser.organization ?? 'Default Organization',
      phone_number: currentUser.phone_number ?? '',
    });
  }, [currentUser]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const response = await axios.put('/auth/me', profileForm);
      return response.data as UserProfile;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['auth', 'me'], user);
      setIsEditing(false);
      setErrorMessage(null);
      setStatusMessage('Profile updated successfully.');
    },
    onError: (err: any) => {
      setStatusMessage(null);
      setErrorMessage(err?.response?.data?.detail || 'Failed to update profile.');
    },
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      if (passwordForm.new_password !== passwordForm.confirm_password) {
        throw new Error('New password and confirm password do not match.');
      }
      const response = await axios.post('/auth/change-password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setShowPasswordForm(false);
      setErrorMessage(null);
      setStatusMessage('Password changed successfully.');
    },
    onError: (err: any) => {
      setStatusMessage(null);
      setErrorMessage(err?.response?.data?.detail || err?.message || 'Failed to change password.');
    },
  });

  const setTwoFactor = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await axios.post('/auth/two-factor', { enabled });
      return response.data as UserProfile;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['auth', 'me'], user);
      setErrorMessage(null);
      setStatusMessage(`Two-factor authentication ${user.two_factor_enabled ? 'enabled' : 'disabled'}.`);
    },
    onError: (err: any) => {
      setStatusMessage(null);
      setErrorMessage(err?.response?.data?.detail || 'Failed to update 2FA setting.');
    },
  });

  React.useEffect(() => {
    if (!isEditing) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !updateProfile.isPending) {
        setIsEditing(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditing, updateProfile.isPending]);

  const cardClass = isLight
    ? 'border border-slate-200 bg-white/90 shadow-[0_24px_50px_-32px_rgba(15,23,42,0.28)]'
    : 'border border-slate-800/80 bg-[#0f0f11] shadow-[0_24px_60px_-36px_rgba(2,6,23,0.7)]';
  const featureCardClass = isLight
    ? 'border border-slate-200/90 bg-gradient-to-br from-white to-slate-50'
    : 'border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950';
  const inputClass = isLight
    ? 'w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25'
    : 'w-full rounded-2xl border border-slate-700/70 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30';
  const labelClass = isLight ? 'text-slate-600' : 'text-slate-400';
  const bodyTextClass = isLight ? 'text-slate-700' : 'text-slate-300';
  const mutedTextClass = isLight ? 'text-slate-500' : 'text-slate-400';
  const sectionTitleClass = isLight ? 'text-slate-900' : 'text-white';

  if (isLoading) {
    return (
      <div className="w-full space-y-8 p-6 lg:p-8 xl:p-10">
        <div className="h-36 rounded-3xl bg-gray-800/40 animate-pulse" />
        <div className="h-[420px] rounded-3xl bg-gray-800/40 animate-pulse" />
        <div className="grid gap-8 xl:grid-cols-2">
          <div className="h-[280px] rounded-3xl bg-gray-800/40 animate-pulse" />
          <div className="h-[280px] rounded-3xl bg-gray-800/40 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !currentUser) {
    return (
      <div className="w-full p-6 lg:p-8 xl:p-10">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <p className="text-red-400">Failed to load profile data from backend.</p>
        </div>
      </div>
    );
  }

  const displayName = currentUser.full_name?.trim() || 'Unnamed User';
  const displayRole = currentUser.job_profile?.trim() || 'Administrator';
  const displayOrganization = currentUser.organization?.trim() || 'Default Organization';
  const displayPhone = currentUser.phone_number?.trim() || 'Not set';
  const displayInitials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || currentUser.email.charAt(0).toUpperCase();

  const profileSignals = [
    Boolean(currentUser.full_name?.trim()),
    Boolean(currentUser.job_profile?.trim()),
    Boolean(currentUser.organization?.trim()),
    Boolean(currentUser.phone_number?.trim()),
    currentUser.two_factor_enabled,
  ];
  const completionScore = Math.round((profileSignals.filter(Boolean).length / profileSignals.length) * 100);
  const securityTone = currentUser.two_factor_enabled ? 'Hardened' : 'Needs reinforcement';
  const currentPlanKey = normalizeSubscriptionPlan(currentUser.subscription_plan);
  const currentPlanLabel = getSubscriptionPlanLabel(currentUser.subscription_plan);
  const currentPlanLimits = getSubscriptionLimits(currentUser.subscription_plan);
  const currentPlanMeta = subscriptionPlans.find((plan) => plan.id === currentPlanKey);
  const currentPlanDescription = currentPlanMeta?.description ?? 'Your active workspace subscription plan.';
  const currentPlanPriceLabel = currentPlanMeta ? `$${currentPlanMeta.price.usd}/month` : '$0/month';

  const profileDetails = [
    {
      label: 'Full name',
      value: displayName,
      icon: UserRound,
    },
    {
      label: 'Role',
      value: displayRole,
      icon: Briefcase,
    },
    {
      label: 'Organization',
      value: displayOrganization,
      icon: Building2,
    },
    {
      label: 'Email',
      value: currentUser.email,
      icon: Mail,
    },
    {
      label: 'Phone',
      value: displayPhone,
      icon: Phone,
    },
    {
      label: 'Plan',
      value: currentPlanLabel,
      icon: BadgeCheck,
    },
  ];

  const passwordFreshness = formatPasswordFreshness(currentUser.last_password_change);

  return (
    <div className="w-full space-y-8 p-6 lg:p-8 xl:p-10">
      <PageHero
        id="profile"
        tone="indigo"
        eyebrow="Account identity and security"
        eyebrowIcon={<Shield className="h-3.5 w-3.5" />}
        title="Profile Control Center"
        titleIcon={<Shield className="w-8 h-8 text-indigo-300" />}
        description="Manage your operator identity, contact information, and account security posture from one screen."
        chips={[
          { label: currentUser.email, tone: 'indigo' },
          { label: currentPlanLabel, tone: 'blue' },
          { label: currentUser.two_factor_enabled ? '2FA enabled' : '2FA disabled', tone: currentUser.two_factor_enabled ? 'emerald' : 'default' },
        ]}
        guide={{
          title: 'About Profile',
          purpose: 'Profile centralizes the user identity that appears across the workspace and the security controls that protect account access.',
          actions: [
            'review identity and contact information',
            'update role, organization, and phone details',
            'rotate your password and manage two-factor authentication',
          ],
        }}
        actions={
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setStatusMessage(null);
                setErrorMessage(null);
                setIsEditing((prev) => !prev);
                if (showPasswordForm) setShowPasswordForm(false);
              }}
              className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                isLight
                  ? 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                  : 'border border-slate-700/70 bg-slate-900/75 text-slate-100 hover:bg-slate-800/85'
              }`}
            >
              {isEditing ? 'Close Editor' : 'Edit Profile'}
            </button>
            <button
              onClick={() => {
                setStatusMessage(null);
                setErrorMessage(null);
                setShowPasswordForm((prev) => !prev);
                if (isEditing) setIsEditing(false);
              }}
              className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-colors hover:from-blue-400 hover:to-indigo-400"
            >
              {showPasswordForm ? 'Hide Password Form' : 'Change Password'}
            </button>
          </div>
        }
      />

      <section className={`relative overflow-hidden rounded-[32px] p-8 xl:p-10 ${featureCardClass}`}>
        <div
          className={`pointer-events-none absolute inset-0 ${
            isLight
              ? 'bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.12),transparent_34%)]'
              : 'bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(79,70,229,0.16),transparent_34%)]'
          }`}
        />

        <div className="relative grid gap-10 xl:grid-cols-[minmax(0,1.6fr)_360px] xl:items-start 2xl:grid-cols-[minmax(0,1.75fr)_400px]">
          <div className="flex-1">
            <div className="flex flex-wrap items-start gap-5">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[26px] bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 text-2xl font-black text-white shadow-[0_18px_40px_-22px_rgba(59,130,246,0.8)]">
                {displayInitials}
              </div>

              <div className="min-w-0 flex-1">
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                    isLight
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : 'border-blue-400/25 bg-blue-500/10 text-blue-200'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Operator Identity</span>
                </div>
                <h2 className={`mt-4 text-3xl font-bold tracking-tight ${sectionTitleClass}`}>{displayName}</h2>
                <p className={`mt-2 text-sm ${bodyTextClass}`}>
                  {displayRole} at {displayOrganization}
                </p>
                <p className={`mt-2 max-w-2xl text-sm leading-relaxed ${mutedTextClass}`}>
                  This identity is used across workspace activity, audit-friendly change history, and ownership context for projects and deployments.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              {profileDetails.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className={`rounded-2xl border p-4 ${
                      isLight
                        ? 'border-slate-200/90 bg-white/85'
                        : 'border-slate-800/70 bg-slate-950/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-blue-400">
                      <Icon className="h-3.5 w-3.5" />
                      <span>{item.label}</span>
                    </div>
                    <p className={`mt-3 break-words text-sm font-medium ${sectionTitleClass}`}>{item.value}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <aside
            className={`w-full rounded-[30px] border p-6 xl:p-7 ${
              isLight
                ? 'border-slate-200/90 bg-white/88'
                : 'border-slate-800/70 bg-slate-950/55'
            }`}
          >
            <p className="text-xs uppercase tracking-[0.16em] text-blue-400">Profile Strength</p>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className={`text-4xl font-black ${sectionTitleClass}`}>{completionScore}%</p>
                <p className={`mt-1 text-sm ${mutedTextClass}`}>completion across identity and security signals</p>
              </div>
              <div
                className={`rounded-2xl px-3 py-2 text-xs font-semibold ${
                  currentUser.two_factor_enabled
                    ? isLight
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'bg-emerald-500/12 text-emerald-300 border border-emerald-500/20'
                    : isLight
                      ? 'border border-amber-200 bg-amber-50 text-amber-700'
                      : 'bg-amber-500/12 text-amber-300 border border-amber-500/20'
                }`}
              >
                {securityTone}
              </div>
            </div>

            <div className={`mt-5 h-3 overflow-hidden rounded-full ${isLight ? 'bg-slate-100' : 'bg-slate-900'}`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 transition-all"
                style={{ width: `${completionScore}%` }}
              />
            </div>

            <div className="mt-6 space-y-4">
              <div className={`rounded-2xl border p-4 ${isLight ? 'border-slate-200 bg-slate-50/80' : 'border-slate-800/70 bg-slate-900/55'}`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className={`text-xs uppercase tracking-[0.14em] ${labelClass}`}>Two-factor authentication</p>
                    <p className={`mt-2 text-sm font-medium ${sectionTitleClass}`}>
                      {currentUser.two_factor_enabled ? 'Enabled and protecting sign-in' : 'Disabled for this account'}
                    </p>
                  </div>
                  <button
                    onClick={() => setTwoFactor.mutate(!currentUser.two_factor_enabled)}
                    disabled={setTwoFactor.isPending}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
                      currentUser.two_factor_enabled
                        ? isLight
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20'
                        : isLight
                          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                          : 'bg-blue-500/15 text-blue-300 hover:bg-blue-500/20'
                    }`}
                  >
                    {setTwoFactor.isPending
                      ? 'Updating...'
                      : currentUser.two_factor_enabled
                        ? 'Disable'
                        : 'Enable'}
                  </button>
                </div>
              </div>

              <div className={`rounded-2xl border p-4 ${isLight ? 'border-slate-200 bg-slate-50/80' : 'border-slate-800/70 bg-slate-900/55'}`}>
                <p className={`text-xs uppercase tracking-[0.14em] ${labelClass}`}>Password posture</p>
                <p className={`mt-2 text-sm font-medium ${sectionTitleClass}`}>{passwordFreshness}</p>
                <p className={`mt-2 text-sm ${mutedTextClass}`}>
                  Rotate credentials regularly and use a unique password for this workspace.
                </p>
              </div>

              <div className={`rounded-2xl border p-4 ${isLight ? 'border-slate-200 bg-slate-50/80' : 'border-slate-800/70 bg-slate-900/55'}`}>
                <p className={`text-xs uppercase tracking-[0.14em] ${labelClass}`}>Workspace plan</p>
                <p className={`mt-2 text-sm font-medium ${sectionTitleClass}`}>{currentPlanLabel}</p>
                <p className={`mt-2 text-sm ${mutedTextClass}`}>
                  Your plan shapes project limits, cloud-account limits, and available support level.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

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

      <section className={`relative overflow-hidden rounded-[30px] p-7 xl:p-8 ${cardClass}`}>
        <div
          className={`pointer-events-none absolute inset-0 ${
            isLight
              ? 'bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.1),transparent_34%)]'
              : 'bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.1),transparent_32%)]'
          }`}
        />

        <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
          <div className="min-w-0">
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                isLight
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-blue-400/25 bg-blue-500/10 text-blue-200'
              }`}
            >
              <BadgeCheck className="h-3.5 w-3.5" />
              <span>Active Subscription</span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h3 className={`text-2xl font-bold tracking-tight ${sectionTitleClass}`}>{currentPlanLabel}</h3>
              <span
                className={`rounded-2xl border px-3 py-2 text-xs font-semibold ${
                  isLight
                    ? 'border-slate-200 bg-white text-slate-700'
                    : 'border-slate-700/70 bg-slate-900/70 text-slate-200'
                }`}
              >
                {currentPlanPriceLabel}
              </span>
              <Link
                to="/subscriptions"
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-semibold transition-colors ${
                  isLight
                    ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    : 'border-slate-700/70 bg-slate-900/70 text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                Change plan
              </Link>
            </div>

            <p className={`mt-2 text-sm ${bodyTextClass}`}>
              You are currently using the {currentPlanLabel} plan. {currentPlanDescription}
            </p>

            {currentPlanMeta?.features?.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {currentPlanMeta.features.slice(0, 4).map((feature) => (
                  <span
                    key={feature}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                      isLight
                        ? 'border-slate-200 bg-slate-50 text-slate-600'
                        : 'border-slate-700/70 bg-slate-900/70 text-slate-300'
                    }`}
                  >
                    {feature}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div
            className={`rounded-[24px] border p-5 ${
              isLight
                ? 'border-slate-200/90 bg-white/85'
                : 'border-slate-800/70 bg-slate-950/45'
            }`}
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-blue-400">
              <FolderKanban className="h-3.5 w-3.5" />
              <span>Project Capacity</span>
            </div>
            <p className={`mt-4 text-3xl font-black ${sectionTitleClass}`}>
              {currentPlanLimits.projects === null ? 'Unlimited' : currentPlanLimits.projects}
            </p>
            <p className={`mt-2 text-sm ${mutedTextClass}`}>
              {currentPlanLimits.projects === null ? 'projects available on this plan' : 'active projects allowed on this plan'}
            </p>
          </div>

          <div
            className={`rounded-[24px] border p-5 ${
              isLight
                ? 'border-slate-200/90 bg-white/85'
                : 'border-slate-800/70 bg-slate-950/45'
            }`}
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-blue-400">
              <Cloud className="h-3.5 w-3.5" />
              <span>Cloud Accounts</span>
            </div>
            <p className={`mt-4 text-3xl font-black ${sectionTitleClass}`}>
              {currentPlanLimits.cloudAccounts === null ? 'Unlimited' : currentPlanLimits.cloudAccounts}
            </p>
            <p className={`mt-2 text-sm ${mutedTextClass}`}>
              {currentPlanLimits.cloudAccounts === null ? 'cloud connections available on this plan' : 'cloud accounts allowed on this plan'}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <section className={`rounded-[28px] p-7 xl:p-8 ${cardClass}`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-blue-400">Quick Actions</p>
                <h3 className={`mt-2 text-xl font-semibold ${sectionTitleClass}`}>Account operations</h3>
              </div>
              <div
                className={`rounded-2xl border px-3 py-2 text-xs font-semibold ${
                  isLight
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-blue-500/20 bg-blue-500/10 text-blue-300'
                }`}
              >
                Ready
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <button
                onClick={() => {
                  setStatusMessage(null);
                  setErrorMessage(null);
                  setIsEditing(true);
                  setShowPasswordForm(false);
                }}
                className={`group flex h-full items-start gap-3 rounded-2xl border p-5 text-left transition-colors ${
                  isLight
                    ? 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    : 'border-slate-800/70 bg-slate-950/45 hover:bg-slate-900/70'
                }`}
              >
                <div className={`rounded-xl p-2 ${isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-500/12 text-blue-300'}`}>
                  <UserRound className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${sectionTitleClass}`}>Refine profile details</p>
                  <p className={`mt-1 text-sm ${mutedTextClass}`}>Update public-facing identity, role, organization, and contact data.</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setStatusMessage(null);
                  setErrorMessage(null);
                  setShowPasswordForm(true);
                  setIsEditing(false);
                }}
                className={`group flex h-full items-start gap-3 rounded-2xl border p-5 text-left transition-colors ${
                  isLight
                    ? 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    : 'border-slate-800/70 bg-slate-950/45 hover:bg-slate-900/70'
                }`}
              >
                <div className={`rounded-xl p-2 ${isLight ? 'bg-indigo-50 text-indigo-700' : 'bg-indigo-500/12 text-indigo-300'}`}>
                  <KeyRound className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${sectionTitleClass}`}>Rotate password</p>
                  <p className={`mt-1 text-sm ${mutedTextClass}`}>Change your sign-in secret and clear stale credentials from older sessions.</p>
                </div>
              </button>

              <button
                onClick={() => setTwoFactor.mutate(!currentUser.two_factor_enabled)}
                disabled={setTwoFactor.isPending}
                className={`group flex h-full items-start gap-3 rounded-2xl border p-5 text-left transition-colors disabled:opacity-60 ${
                  isLight
                    ? 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    : 'border-slate-800/70 bg-slate-950/45 hover:bg-slate-900/70'
                }`}
              >
                <div className={`rounded-xl p-2 ${isLight ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-500/12 text-emerald-300'}`}>
                  <Shield className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${sectionTitleClass}`}>
                    {currentUser.two_factor_enabled ? 'Disable 2FA' : 'Enable 2FA'}
                  </p>
                  <p className={`mt-1 text-sm ${mutedTextClass}`}>
                    {currentUser.two_factor_enabled
                      ? 'Remove the second factor requirement for future logins.'
                      : 'Add a second factor to strengthen access protection.'}
                  </p>
                </div>
              </button>
              </div>
          </section>

          <section className={`rounded-[28px] p-7 xl:p-8 ${cardClass}`}>
            <p className="text-xs uppercase tracking-[0.16em] text-blue-400">Signals</p>
            <h3 className={`mt-2 text-xl font-semibold ${sectionTitleClass}`}>Account snapshot</h3>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className={`rounded-2xl border p-4 ${isLight ? 'border-slate-200 bg-slate-50/80' : 'border-slate-800/70 bg-slate-950/45'}`}>
                <p className={`text-xs uppercase tracking-[0.14em] ${labelClass}`}>Login email</p>
                <p className={`mt-2 text-sm font-medium break-all ${sectionTitleClass}`}>{currentUser.email}</p>
              </div>
              <div className={`rounded-2xl border p-4 ${isLight ? 'border-slate-200 bg-slate-50/80' : 'border-slate-800/70 bg-slate-950/45'}`}>
                <p className={`text-xs uppercase tracking-[0.14em] ${labelClass}`}>Support tier</p>
                <p className={`mt-2 text-sm font-medium ${sectionTitleClass}`}>{currentPlanLabel}</p>
              </div>
              <div className={`rounded-2xl border p-4 ${isLight ? 'border-slate-200 bg-slate-50/80' : 'border-slate-800/70 bg-slate-950/45'}`}>
                <p className={`text-xs uppercase tracking-[0.14em] ${labelClass}`}>Security status</p>
                <p className={`mt-2 text-sm font-medium ${currentUser.two_factor_enabled ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {currentUser.two_factor_enabled ? 'Second factor active' : 'Single-factor only'}
                </p>
              </div>
              <div className={`rounded-2xl border p-4 ${isLight ? 'border-slate-200 bg-slate-50/80' : 'border-slate-800/70 bg-slate-950/45'}`}>
                <p className={`text-xs uppercase tracking-[0.14em] ${labelClass}`}>Password freshness</p>
                <p className={`mt-2 text-sm font-medium ${sectionTitleClass}`}>{passwordFreshness}</p>
              </div>
            </div>
          </section>
      </div>

      {showPasswordForm ? (
        <section className={`rounded-[28px] p-7 xl:p-8 ${cardClass}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-blue-400">Password Rotation</p>
              <h3 className={`mt-2 text-2xl font-semibold ${sectionTitleClass}`}>Change sign-in password</h3>
              <p className={`mt-2 text-sm ${mutedTextClass}`}>
                Use a strong, unique password and confirm it carefully before submitting the change.
              </p>
            </div>
            <button
              onClick={() => setShowPasswordForm(false)}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                isLight
                  ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  : 'border border-slate-700/70 bg-slate-900/70 text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              Close
            </button>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.14em] ${labelClass}`}>Current password</label>
              <input
                type="password"
                value={passwordForm.current_password}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, current_password: event.target.value }))}
                placeholder="Current Password"
                className={inputClass}
              />
            </div>
            <div>
              <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.14em] ${labelClass}`}>New password</label>
              <input
                type="password"
                value={passwordForm.new_password}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, new_password: event.target.value }))}
                placeholder="New Password"
                className={inputClass}
              />
            </div>
            <div>
              <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.14em] ${labelClass}`}>Confirm password</label>
              <input
                type="password"
                value={passwordForm.confirm_password}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirm_password: event.target.value }))}
                placeholder="Confirm New Password"
                className={inputClass}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => changePassword.mutate()}
              disabled={changePassword.isPending}
              className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-colors hover:from-blue-400 hover:to-indigo-400 disabled:opacity-60"
            >
              {changePassword.isPending ? 'Updating password...' : 'Update Password'}
            </button>
            <button
              onClick={() => setShowPasswordForm(false)}
              className={`rounded-2xl px-5 py-3 text-sm font-semibold ${
                isLight
                  ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  : 'border border-slate-700/70 bg-slate-900/70 text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      {isEditing ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-[2px]"
          onClick={() => {
            if (!updateProfile.isPending) setIsEditing(false);
          }}
        >
          <div
            className={`w-full max-w-5xl overflow-hidden rounded-[30px] ${
              isLight
                ? 'border border-slate-200 bg-white shadow-[0_26px_60px_-28px_rgba(15,23,42,0.45)]'
                : 'border border-slate-800/80 bg-[#0f0f11] shadow-[0_26px_60px_-28px_rgba(2,6,23,0.78)]'
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`border-b px-6 py-5 xl:px-8 ${isLight ? 'border-slate-200' : 'border-slate-700/70'}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-blue-400">Profile Editor</p>
                  <h3 className={`mt-2 text-2xl font-semibold ${sectionTitleClass}`}>Update operator details</h3>
                  <p className={`mt-2 text-sm ${mutedTextClass}`}>
                    Keep your identity metadata accurate so ownership and audit context stay clear across the workspace.
                  </p>
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={updateProfile.isPending}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold disabled:opacity-60 ${
                    isLight
                      ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      : 'border border-slate-700/70 bg-slate-900/70 text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="max-h-[calc(100vh-12rem)] overflow-y-auto px-6 py-6 xl:px-8">
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.14em] ${labelClass}`}>Full name</label>
                  <input
                    type="text"
                    value={profileForm.full_name}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, full_name: event.target.value }))}
                    placeholder="Full Name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.14em] ${labelClass}`}>Job profile</label>
                  <input
                    type="text"
                    value={profileForm.job_profile}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, job_profile: event.target.value }))}
                    placeholder="Job Profile"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.14em] ${labelClass}`}>Organization</label>
                  <input
                    type="text"
                    value={profileForm.organization}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, organization: event.target.value }))}
                    placeholder="Organization"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.14em] ${labelClass}`}>Phone number</label>
                  <input
                    type="text"
                    value={profileForm.phone_number}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, phone_number: event.target.value }))}
                    placeholder="Phone Number"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className={`flex flex-wrap justify-end gap-3 border-t px-6 py-5 xl:px-8 ${isLight ? 'border-slate-200' : 'border-slate-700/70'}`}>
              <button
                onClick={() => setIsEditing(false)}
                disabled={updateProfile.isPending}
                className={`rounded-2xl px-5 py-3 text-sm font-semibold disabled:opacity-60 ${
                  isLight
                    ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    : 'border border-slate-700/70 bg-slate-900/70 text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => updateProfile.mutate()}
                disabled={updateProfile.isPending}
                className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-colors hover:from-blue-400 hover:to-indigo-400 disabled:opacity-60"
              >
                {updateProfile.isPending ? 'Saving profile...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Profile;
