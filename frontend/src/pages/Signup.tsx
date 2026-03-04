import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api, { API_BASE_URL } from '../api/axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Rocket,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import AuthCloudBackdrop from '../components/auth/AuthCloudBackdrop';
import SSOButtons from '../components/auth/SSOButtons';
import { useAuth } from '../context/AuthContext';

const signupSchema = z
  .object({
    full_name: z.string().min(2, 'Full name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    organization: z.string().optional(),
    job_profile: z.string().optional(),
    phone_number: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupFormInputs = z.infer<typeof signupSchema>;

const getErrorDetail = (error: any): string | null => {
  const detail = error?.response?.data?.detail;
  if (!detail) {
    return null;
  }

  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(detail)) {
    const message = detail
      .map((item) => (typeof item?.msg === 'string' ? item.msg : ''))
      .filter(Boolean)
      .join(', ');
    return message || null;
  }

  return null;
};

const getSignupErrorMessage = (error: any): string => {
  const backendMessage = getErrorDetail(error);
  if (backendMessage) {
    return backendMessage;
  }

  if (error?.code === 'ERR_NETWORK' || !error?.response) {
    return `Cannot reach API server (${API_BASE_URL}). For Vercel, set VITE_API_URL to your deployed backend URL and enable backend CORS for your frontend domain.`;
  }

  if (error?.response?.status === 404) {
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

const Signup: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isSSOProcessing, setIsSSOProcessing] = React.useState(false);
  const [ssoProviderName, setSsoProviderName] = React.useState<string>('');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignupFormInputs>({
    resolver: zodResolver(signupSchema),
  });
  const passwordValue = watch('password') ?? '';
  const passwordStrength = getPasswordStrength(passwordValue);
  const strengthWidth = `${Math.max(8, (passwordStrength.score / 4) * 100)}%`;

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
      } catch (error: any) {
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
      await api.post('/auth/register', {
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        job_profile: data.job_profile,
        organization: data.organization,
        phone_number: data.phone_number,
      });
      navigate('/login');
    } catch (err: any) {
      setError('root', {
        message: getSignupErrorMessage(err),
      });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AuthCloudBackdrop />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-10">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <motion.section
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
            className="hidden rounded-3xl border border-slate-300/15 bg-slate-950/35 p-8 backdrop-blur-xl lg:flex lg:flex-col lg:justify-between"
          >
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/30 bg-blue-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
                <Sparkles className="h-3.5 w-3.5" />
                Build With Nebula
              </div>
              <h1 className="mt-5 text-4xl font-bold leading-tight text-white">
                Create your workspace and launch in minutes.
              </h1>
              <p className="mt-4 max-w-lg text-sm text-slate-300/90">
                Join teams that provision infrastructure faster with cloud-agnostic workflows, policy guardrails, and operational visibility.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-300/10 bg-slate-900/45 p-4">
              <div className="flex items-start gap-3 text-slate-200">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-blue-300" />
                <p className="text-sm">Unified dashboard for compute, storage, functions, queues, and messages.</p>
              </div>
              <div className="flex items-start gap-3 text-slate-200">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-blue-300" />
                <p className="text-sm">Secure access model with isolated projects and cloud credentials.</p>
              </div>
              <div className="flex items-start gap-3 text-slate-200">
                <Sparkles className="mt-0.5 h-4 w-4 text-blue-300" />
                <p className="text-sm">Ready to scale workflows with GitOps, policies, and AI copilots.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-300/10 bg-slate-900/55 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300/80">Day 1</p>
                <p className="mt-1 text-sm text-slate-200">Connect cloud accounts</p>
              </div>
              <div className="rounded-xl border border-slate-300/10 bg-slate-900/55 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300/80">Day 2</p>
                <p className="mt-1 text-sm text-slate-200">Provision first stack</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <img src="/provider-logos/aws.svg" alt="AWS" className="rounded-xl border border-slate-300/10 bg-slate-900/50 p-2" />
              <img src="/provider-logos/azure.svg" alt="Azure" className="rounded-xl border border-slate-300/10 bg-slate-900/50 p-2" />
              <img src="/provider-logos/gcp.svg" alt="Google Cloud" className="rounded-xl border border-slate-300/10 bg-slate-900/50 p-2" />
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="rounded-3xl border border-slate-300/15 bg-slate-950/55 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8"
          >
            <div className="mb-7 text-center">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                <UserPlus className="h-7 w-7 text-white" />
              </div>
              <h2 className="mt-4 text-3xl font-bold text-white">Create Account</h2>
              <p className="mt-2 text-sm text-slate-300">Start orchestrating across AWS, Azure, and GCP.</p>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 rounded-lg border border-slate-300/10 bg-slate-900/60 px-3 py-2 text-slate-200">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-300" />
                Guardrails Ready
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-300/10 bg-slate-900/60 px-3 py-2 text-slate-200">
                <Rocket className="h-3.5 w-3.5 text-blue-300" />
                Fast Onboarding
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="ml-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-300/90">
                  Full Name
                </label>
                <div className="group relative">
                  <UserPlus className="absolute left-3 top-3 h-5 w-5 text-slate-500 transition-colors group-focus-within:text-blue-300" />
                  <input
                    {...register('full_name')}
                    className="input-field w-full py-2.5 pl-10"
                    placeholder="John Doe"
                  />
                </div>
                {errors.full_name && <p className="ml-1 text-xs text-rose-300">{errors.full_name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-300/90">
                  Email Address
                </label>
                <div className="group relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-500 transition-colors group-focus-within:text-blue-300" />
                  <input
                    {...register('email')}
                    className="input-field w-full py-2.5 pl-10"
                    placeholder="user@company.com"
                  />
                </div>
                {errors.email && <p className="ml-1 text-xs text-rose-300">{errors.email.message}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="ml-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-300/90">
                    Job Profile
                  </label>
                  <input
                    {...register('job_profile')}
                    className="input-field w-full px-3 py-2.5"
                    placeholder="DevOps Engineer"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="ml-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-300/90">
                    Organization
                  </label>
                  <input
                    {...register('organization')}
                    className="input-field w-full px-3 py-2.5"
                    placeholder="Cloud Corp"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-300/90">
                  Phone Number
                </label>
                <input
                  {...register('phone_number')}
                  className="input-field w-full px-3 py-2.5"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-300/90">
                  Password
                </label>
                <div className="group relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500 transition-colors group-focus-within:text-blue-300" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className="input-field w-full py-2.5 pl-10 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="absolute right-3 top-3 text-slate-500 transition-colors hover:text-blue-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="ml-1 text-xs text-rose-300">{errors.password.message}</p>}
              </div>

              <div className="rounded-xl border border-slate-300/10 bg-slate-900/60 p-3">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-slate-300">Password strength</span>
                  <span className="font-semibold uppercase tracking-wide text-emerald-200">{passwordStrength.label}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800">
                  <motion.div
                    className="h-1.5 rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-300"
                    initial={{ width: '8%' }}
                    animate={{ width: strengthWidth }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-slate-400">
                  <p className={passwordValue.length >= 8 ? 'text-emerald-300' : ''}>8+ chars</p>
                  <p className={/[A-Z]/.test(passwordValue) ? 'text-emerald-300' : ''}>Uppercase</p>
                  <p className={/[0-9]/.test(passwordValue) ? 'text-emerald-300' : ''}>Number</p>
                  <p className={/[^A-Za-z0-9]/.test(passwordValue) ? 'text-emerald-300' : ''}>Symbol</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-300/90">
                  Confirm Password
                </label>
                <div className="group relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500 transition-colors group-focus-within:text-blue-300" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    className="input-field w-full py-2.5 pl-10 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((previous) => !previous)}
                    className="absolute right-3 top-3 text-slate-500 transition-colors hover:text-blue-300"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="ml-1 text-xs text-rose-300">{errors.confirmPassword.message}</p>}
              </div>

              {errors.root && (
                <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {errors.root.message}
                </div>
              )}

              {isSSOProcessing && (
                <div className="rounded-xl border border-blue-300/35 bg-blue-500/10 px-3 py-2 text-sm text-blue-100">
                  Completing {ssoProviderName || 'SSO'} sign-in...
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || isSSOProcessing}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:from-blue-400 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span>
                  {isSSOProcessing ? 'Processing SSO...' : isSubmitting ? 'Creating Account...' : 'Create Account'}
                </span>
                {!isSubmitting && !isSSOProcessing && <UserPlus className="h-4 w-4" />}
              </button>

              <SSOButtons onProviderClick={handleSSORedirect} disabled={isSubmitting || isSSOProcessing} accent="cyan" />
            </form>

            <p className="mt-4 text-center text-xs text-slate-400">
              Your workspace starts with secure defaults, and you can onboard teams later.
            </p>

            <p className="mt-6 text-center text-sm text-slate-300">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-300 transition-colors hover:text-blue-200">
                Log in
              </Link>
            </p>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default Signup;
