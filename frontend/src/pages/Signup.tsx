import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api, { API_BASE_URL } from '../api/axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Moon,
  Sparkles,
  Sun,
  UserPlus,
} from 'lucide-react';
import AuthCloudBackdrop from '../components/auth/AuthCloudBackdrop';
import AuthNetworkShowcase from '../components/auth/AuthNetworkShowcase';
import SSOButtons from '../components/auth/SSOButtons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  defaultSubscriptionPlanId,
  isSubscriptionPlanId,
  subscriptionPlanIds,
  subscriptionPlans,
  type SubscriptionPlanId,
} from '../data/subscriptionPlans';
import { normalizeSubscriptionPlan } from '../data/subscriptionLimits';
import {
  getAuthErrorCode,
  getAuthErrorDetail,
  getAuthErrorStatus,
  hasAuthErrorResponse,
} from '../utils/authErrors';

const signupSchema = z
  .object({
    full_name: z.string().min(2, 'Full name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    organization: z.string().optional(),
    job_profile: z.string().optional(),
    phone_number: z.string().optional(),
    subscription_plan: z.enum(subscriptionPlanIds),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupFormInputs = z.infer<typeof signupSchema>;

const getSignupErrorMessage = (error: unknown): string => {
  const backendMessage = getAuthErrorDetail(error);
  if (backendMessage) {
    return backendMessage;
  }

  if (getAuthErrorCode(error) === 'ERR_NETWORK' || !hasAuthErrorResponse(error)) {
    return `Cannot reach API server (${API_BASE_URL}). For Vercel, set VITE_API_URL to your deployed backend URL and enable backend CORS for your frontend domain.`;
  }

  if (getAuthErrorStatus(error) === 404) {
    return `Signup endpoint not found at ${API_BASE_URL}/auth/register. Verify VITE_API_URL points to your backend.`;
  }

  return 'Registration failed. Please try again.';
};

const getPasswordStrength = (password: string): { score: number; label: string } => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score, label: 'weak' };
  if (score === 2) return { score, label: 'fair' };
  if (score === 3) return { score, label: 'strong' };
  return { score, label: 'excellent' };
};

const SIGNUP_HIGHLIGHTS = [
  'Launch an operator workspace with AWS, Azure, and GCP already framed as one connected cloud fabric.',
  'Start from an India-centered transfer view so team members understand where platform traffic is flowing.',
  'Pair onboarding with governance signals, identity controls, and deployment-ready structure from day one.',
];

const SIGNUP_STATS = [
  { label: 'Workspace model', value: 'India-led global control' },
  { label: 'Provider stack', value: 'AWS + Azure + GCP' },
  { label: 'Transfer lanes', value: 'Animated live fabric' },
];

const signupDetailFields: Array<keyof SignupFormInputs> = [
  'full_name',
  'email',
  'job_profile',
  'organization',
  'phone_number',
  'password',
  'confirmPassword',
];

const Signup: React.FC = () => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isSSOProcessing, setIsSSOProcessing] = React.useState(false);
  const [ssoProviderName, setSsoProviderName] = React.useState<string>('');
  const [signupStep, setSignupStep] = React.useState<'details' | 'plan'>('details');
  const [selectedPlan, setSelectedPlan] = React.useState<SubscriptionPlanId>(() => {
    if (typeof window === 'undefined') {
      return defaultSubscriptionPlanId;
    }

    const storedPlan = window.localStorage.getItem('nebula:selectedSubscription');
    const normalizedStoredPlan = normalizeSubscriptionPlan(storedPlan);
    return isSubscriptionPlanId(normalizedStoredPlan) ? normalizedStoredPlan : defaultSubscriptionPlanId;
  });
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignupFormInputs>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      subscription_plan: selectedPlan,
    },
  });
  const passwordValue = watch('password') ?? '';
  const passwordStrength = getPasswordStrength(passwordValue);
  const strengthWidth = `${Math.max(8, (passwordStrength.score / 4) * 100)}%`;
  const selectedPlanDetails =
    subscriptionPlans.find((plan) => plan.id === selectedPlan) ?? subscriptionPlans[0];

  const selectPlan = React.useCallback(
    (planId: SubscriptionPlanId) => {
      setSelectedPlan(planId);
      setValue('subscription_plan', planId, { shouldValidate: true });

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('nebula:selectedSubscription', planId);
      }
    },
    [setValue]
  );

  const goToPlanStep = React.useCallback(async () => {
    const isValid = await trigger(signupDetailFields);
    if (!isValid) {
      return;
    }

    setSignupStep('plan');
  }, [trigger]);

  const handleSSORedirect = React.useCallback(
    (provider: 'google' | 'microsoft' | 'github') => {
      if (typeof window === 'undefined') {
        return;
      }
      const frontendRedirect = `${window.location.origin}/signup`;
      const ssoUrl = `${API_BASE_URL}/auth/sso/${provider}/start?frontend_redirect=${encodeURIComponent(
        frontendRedirect
      )}`;
      window.location.href = ssoUrl;
    },
    []
  );

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ssoError = params.get('sso_error');
    const ssoToken = params.get('sso_token');
    const ssoProvider = params.get('sso_provider');

    if (ssoError) {
      setError('root', { message: ssoError });
      setIsSSOProcessing(false);
      return;
    }

    if (!ssoToken) {
      return;
    }

    let cancelled = false;
    setIsSSOProcessing(true);
    setSsoProviderName(ssoProvider ? ssoProvider.toUpperCase() : 'SSO');

    const completeSSOLogin = async () => {
      try {
        await login(ssoToken);
        navigate('/', { replace: true });
      } catch (error: unknown) {
        if (!cancelled) {
          const message = getSignupErrorMessage(error);
          setError('root', { message: `SSO sign-in failed: ${message}` });
          setIsSSOProcessing(false);
        }
      }
    };

    void completeSSOLogin();
    return () => {
      cancelled = true;
    };
  }, [location.search, login, navigate, setError]);

  const onSubmit = async (data: SignupFormInputs) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('nebula:selectedSubscription', data.subscription_plan);
      }

      await api.post('/auth/register', {
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        job_profile: data.job_profile,
        organization: data.organization,
        phone_number: data.phone_number,
        subscription_plan: data.subscription_plan,
      });
      navigate('/login');
    } catch (err: unknown) {
      setError('root', {
        message: getSignupErrorMessage(err),
      });
    }
  };

  const isLight = theme === 'light';
  const formShellClass = isLight
    ? 'border border-white/75 bg-white/64 shadow-[0_30px_80px_-42px_rgba(37,99,235,0.3)]'
    : 'border border-white/8 bg-slate-950/18';

  const softClass = isLight
    ? 'border border-slate-200/85 bg-slate-50/92'
    : 'border border-slate-300/12 bg-slate-900/60';
  const chipClass = isLight
    ? 'border border-white/75 bg-white/82 text-blue-700 shadow-[0_16px_34px_-24px_rgba(37,99,235,0.34)]'
    : 'border border-blue-400/30 bg-blue-500/12 text-blue-300';
  const headerClass = isLight
    ? 'border-b border-slate-300/75'
    : 'border-b border-slate-700/35';
  const headerActionClass = isLight
    ? 'border border-white/80 bg-white/80 text-slate-700 shadow-[0_18px_34px_-24px_rgba(15,23,42,0.22)] hover:bg-white'
    : 'border border-slate-300/16 bg-slate-900/65 text-slate-200 hover:bg-slate-900';
  const headerLinkClass = isLight
    ? 'border border-white/80 bg-white/80 text-slate-700 shadow-[0_18px_34px_-24px_rgba(15,23,42,0.22)] hover:border-blue-300 hover:text-slate-900'
    : 'border border-slate-300/16 bg-slate-900/65 text-slate-200 hover:border-blue-300/40';
  const dividerClass = isLight ? 'border-slate-200/85' : 'border-slate-300/14';
  const textStrongClass = isLight ? 'text-slate-900' : 'text-slate-50';
  const textMutedClass = isLight ? 'text-slate-600' : 'text-slate-300';
  const subscriptionShellClass = isLight
    ? 'border border-slate-200/85 bg-white/68 shadow-[0_24px_56px_-38px_rgba(37,99,235,0.2)]'
    : 'border border-slate-300/12 bg-slate-900/50';
  const subscriptionSelectClass = isLight
    ? 'border-slate-200/95 bg-white text-slate-900'
    : 'border-slate-300/14 bg-slate-950/62 text-slate-100';
  const subscriptionSummaryClass = isLight
    ? 'border border-slate-200/85 bg-slate-50/92'
    : 'border border-slate-300/12 bg-slate-950/36';

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AuthCloudBackdrop />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-10">
        <div className="w-full space-y-6">
          <header className={`px-1 py-2 pb-5 sm:px-0 ${headerClass}`}>
            <div className="flex items-center justify-between gap-3">
              <Link to="/" className="inline-flex items-center gap-2">
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${chipClass}`}>
                  <Sparkles className="h-4.5 w-4.5" />
                </span>
                <span>
                  <span className={`block text-sm font-semibold ${textStrongClass}`}>Nebula Cloud</span>
                  <span className="block text-[11px] uppercase tracking-[0.14em] text-blue-500">Create Workspace</span>
                </span>
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${headerActionClass}`}
                  aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
                  title={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
                >
                  {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  {isLight ? 'Dark' : 'Light'}
                </button>

                <Link
                  to="/login"
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${headerLinkClass}`}
                >
                  Log in
                </Link>
              </div>
            </div>
          </header>

          <div className="lg:hidden">
            <AuthNetworkShowcase
              compact
              eyebrow="India-Centered Onboarding"
              title="Create a workspace on a global cloud map with visible transfer lanes."
              description="Nebula brings provider routing, platform governance, and identity onboarding into one India-focused operational entry point."
              highlights={SIGNUP_HIGHLIGHTS}
              stats={SIGNUP_STATS}
            />
          </div>

          <div className="grid w-full gap-6 lg:grid-cols-[1.04fr_0.96fr]">
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="hidden lg:block"
            >
              <AuthNetworkShowcase
                eyebrow="India-Centered Onboarding"
                title="Create a workspace on a global cloud map with visible transfer lanes."
                description="Nebula brings provider routing, platform governance, and identity onboarding into one India-focused operational entry point."
                highlights={SIGNUP_HIGHLIGHTS}
                stats={SIGNUP_STATS}
              />
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className={`max-w-xl overflow-hidden rounded-[30px] backdrop-blur-xl lg:ml-auto ${formShellClass}`}
            >
              <div className={`border-b px-6 py-6 sm:px-8 ${dividerClass}`}>
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-blue-400/35 bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/25">
                    <UserPlus className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${textStrongClass}`}>Create Account</h2>
                    <p className={`mt-1 text-sm ${textMutedClass}`}>Set up your secure workspace with visible provider routing and cross-cloud transfer context.</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-6 sm:px-8 sm:py-7">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                    isLight ? 'text-slate-600' : 'text-slate-300/90'
                  }`}>
                    <span className={signupStep === 'details' ? 'text-blue-600' : textMutedClass}>Step 1: Details</span>
                    <span className={textMutedClass}>/</span>
                    <span className={signupStep === 'plan' ? 'text-blue-600' : textMutedClass}>Step 2: Subscription</span>
                  </div>

                  {signupStep === 'details' && (
                    <>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className={`ml-1 block text-[11px] font-semibold uppercase tracking-[0.12em] ${isLight ? 'text-slate-600' : 'text-slate-300/90'}`}>
                            Full Name
                          </label>
                          <div className="group relative">
                            <UserPlus className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-500" />
                            <input
                              {...register('full_name')}
                              className="input-field h-11 w-full pl-10"
                              placeholder="John Doe"
                            />
                          </div>
                          {errors.full_name && <p className="ml-1 text-xs text-rose-500">{errors.full_name.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                          <label className={`ml-1 block text-[11px] font-semibold uppercase tracking-[0.12em] ${isLight ? 'text-slate-600' : 'text-slate-300/90'}`}>
                            Email Address
                          </label>
                          <div className="group relative">
                            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-500" />
                            <input
                              {...register('email')}
                              className="input-field h-11 w-full pl-10"
                              placeholder="user@company.com"
                            />
                          </div>
                          {errors.email && <p className="ml-1 text-xs text-rose-500">{errors.email.message}</p>}
                        </div>
                      </div>

                      <div className={`grid grid-cols-1 gap-4 rounded-2xl p-4 sm:grid-cols-2 ${softClass}`}>
                        <div className="space-y-1.5">
                          <label className={`ml-1 block text-[11px] font-semibold uppercase tracking-[0.12em] ${isLight ? 'text-slate-600' : 'text-slate-300/90'}`}>
                            Job Profile
                          </label>
                          <input
                            {...register('job_profile')}
                            className="input-field h-11 w-full px-3"
                            placeholder="DevOps Engineer"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className={`ml-1 block text-[11px] font-semibold uppercase tracking-[0.12em] ${isLight ? 'text-slate-600' : 'text-slate-300/90'}`}>
                            Organization
                          </label>
                          <input
                            {...register('organization')}
                            className="input-field h-11 w-full px-3"
                            placeholder="Cloud Corp"
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className={`ml-1 block text-[11px] font-semibold uppercase tracking-[0.12em] ${isLight ? 'text-slate-600' : 'text-slate-300/90'}`}>
                            Phone Number
                          </label>
                          <input
                            {...register('phone_number')}
                            className="input-field h-11 w-full px-3"
                            placeholder="+1 (555) 000-0000"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className={`ml-1 block text-[11px] font-semibold uppercase tracking-[0.12em] ${isLight ? 'text-slate-600' : 'text-slate-300/90'}`}>
                            Password
                          </label>
                          <div className="group relative">
                            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-500" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              {...register('password')}
                              className="input-field h-11 w-full pl-10 pr-10"
                              placeholder="********"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((previous) => !previous)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-blue-500"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              title={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {errors.password && <p className="ml-1 text-xs text-rose-500">{errors.password.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                          <label className={`ml-1 block text-[11px] font-semibold uppercase tracking-[0.12em] ${isLight ? 'text-slate-600' : 'text-slate-300/90'}`}>
                            Confirm Password
                          </label>
                          <div className="group relative">
                            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-500" />
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              {...register('confirmPassword')}
                              className="input-field h-11 w-full pl-10 pr-10"
                              placeholder="********"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword((previous) => !previous)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-blue-500"
                              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                              title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {errors.confirmPassword && <p className="ml-1 text-xs text-rose-500">{errors.confirmPassword.message}</p>}
                        </div>
                      </div>

                      <div className={`rounded-xl p-3 ${softClass}`}>
                        <div className="mb-2 flex items-center justify-between text-xs">
                          <span className={textMutedClass}>Password strength</span>
                          <span className="font-semibold uppercase tracking-wide text-blue-500">{passwordStrength.label}</span>
                        </div>
                        <div className={`h-1.5 rounded-full ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}>
                          <motion.div
                            className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-400"
                            initial={{ width: '8%' }}
                            animate={{ width: strengthWidth }}
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                          />
                        </div>
                        <div className={`mt-2 grid grid-cols-2 gap-1 text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          <p className={passwordValue.length >= 8 ? 'text-blue-600' : ''}>8+ chars</p>
                          <p className={/[A-Z]/.test(passwordValue) ? 'text-blue-600' : ''}>Uppercase</p>
                          <p className={/[0-9]/.test(passwordValue) ? 'text-blue-600' : ''}>Number</p>
                          <p className={/[^A-Za-z0-9]/.test(passwordValue) ? 'text-blue-600' : ''}>Symbol</p>
                        </div>
                      </div>
                    </>
                  )}

                  {signupStep === 'plan' && (
                    <div className={`space-y-4 rounded-[24px] p-4 ${subscriptionShellClass}`}>
                      <input type="hidden" {...register('subscription_plan')} />
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isLight ? 'text-slate-600' : 'text-slate-300/90'}`}>
                            Subscription Plan
                          </p>
                          <p className={`mt-1 text-sm ${textMutedClass}`}>
                            Choose the plan you want to start with. You can adjust billing later from subscriptions.
                          </p>
                        </div>
                        <div className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                          selectedPlan === 'enterprise'
                            ? isLight
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-indigo-500/14 text-indigo-300'
                            : isLight
                              ? 'bg-cyan-50 text-cyan-700'
                              : 'bg-cyan-500/12 text-cyan-300'
                        }`}>
                          {selectedPlanDetails.name} selected
                        </div>
                      </div>

                      <div className="space-y-3">
                        <select
                          value={selectedPlan}
                          onChange={(event) => selectPlan(event.target.value as SubscriptionPlanId)}
                          className={`input-field h-11 w-full cursor-pointer appearance-none px-3 ${subscriptionSelectClass}`}
                        >
                          {subscriptionPlans.map((plan) => (
                            <option key={plan.id} value={plan.id}>
                              {plan.name} {plan.popular ? '(Recommended)' : ''} - {plan.price.inr === 0 ? 'Free' : `Rs. ${plan.price.inr.toLocaleString()}/month`}
                            </option>
                          ))}
                        </select>

                        <div className={`rounded-2xl p-4 ${subscriptionSummaryClass}`}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className={`text-base font-semibold ${textStrongClass}`}>{selectedPlanDetails.name}</p>
                                {selectedPlanDetails.popular && (
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                    isLight ? 'bg-sky-100 text-sky-700' : 'bg-cyan-500/14 text-cyan-300'
                                  }`}>
                                    Recommended
                                  </span>
                                )}
                              </div>
                              <p className={`mt-1 text-sm ${textMutedClass}`}>{selectedPlanDetails.description}</p>
                            </div>

                            <div className="text-right">
                              <p className={`text-lg font-bold ${textStrongClass}`}>
                                {selectedPlanDetails.price.inr === 0 ? 'Free' : `Rs. ${selectedPlanDetails.price.inr.toLocaleString()}`}
                              </p>
                              <p className={`text-xs ${textMutedClass}`}>
                                {selectedPlanDetails.price.usd === 0 ? '$0/month' : `$${selectedPlanDetails.price.usd}/month`}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            {selectedPlanDetails.features.slice(0, 4).map((feature) => (
                              <div key={feature} className="flex items-start gap-2">
                                <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full ${
                                  isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800/80 text-slate-200'
                                }`}>
                                  <Check className="h-3.5 w-3.5" />
                                </div>
                                <span className={`text-xs leading-relaxed ${textMutedClass}`}>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {errors.root && (
                    <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-500">
                      {errors.root.message}
                    </div>
                  )}

                  {isSSOProcessing && (
                    <div className="rounded-xl border border-blue-400/35 bg-blue-500/10 px-3 py-2 text-sm text-blue-500">
                      Completing {ssoProviderName || 'SSO'} sign-in...
                    </div>
                  )}

                  {signupStep === 'details' ? (
                    <button
                      type="button"
                      onClick={() => void goToPlanStep()}
                      disabled={isSubmitting || isSSOProcessing}
                      className="nebula-btn-primary inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <span>Next</span>
                      <Sparkles className="h-4 w-4" />
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => setSignupStep('details')}
                        className={`inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors sm:w-auto ${
                          isLight
                            ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            : 'border border-slate-300/16 bg-slate-900/65 text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        Back
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting || isSSOProcessing}
                        className="nebula-btn-primary inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <span>
                          {isSSOProcessing ? 'Processing SSO...' : isSubmitting ? 'Creating Account...' : 'Create Account'}
                        </span>
                        {!isSubmitting && !isSSOProcessing && <UserPlus className="h-4 w-4" />}
                      </button>
                    </div>
                  )}

                  <div className={`border-t pt-5 ${dividerClass}`}>
                    <SSOButtons onProviderClick={handleSSORedirect} disabled={isSubmitting || isSSOProcessing} accent="cyan" />
                  </div>
                </form>
              </div>

              <div className={`border-t px-6 py-4 text-center text-sm sm:px-8 ${dividerClass}`}>
                <p className={textMutedClass}>
                  Already have an account?{' '}
                  <Link to="/login" className="font-semibold text-blue-500 transition-colors hover:text-blue-600">
                    Log in
                  </Link>
                </p>
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
