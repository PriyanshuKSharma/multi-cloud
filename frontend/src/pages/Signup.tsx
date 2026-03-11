import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api, { API_BASE_URL } from '../api/axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Moon,
  Rocket,
  ShieldCheck,
  Sparkles,
  Sun,
  UserPlus,
} from 'lucide-react';
import AuthCloudBackdrop from '../components/auth/AuthCloudBackdrop';
import SSOButtons from '../components/auth/SSOButtons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

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

const SIGNUP_HIGHLIGHTS = [
  'Provision cloud resources from one operational surface.',
  'Apply governance controls without slowing engineering delivery.',
  'Scale teams with project boundaries and audit-ready activity flows.',
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

  const isLight = theme === 'light';
  const shellClass = isLight
    ? 'border border-slate-200 bg-white/95 shadow-[0_32px_80px_-24px_rgba(15,23,42,0.12)] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-slate-50/50 to-white'
    : 'border border-slate-700/50 bg-slate-900/90 shadow-[0_40px_100px_-24px_rgba(2,6,23,1)] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/40 via-slate-900/80 to-slate-950';

  const softClass = isLight
    ? 'border border-slate-200/85 bg-slate-50/92'
    : 'border border-slate-300/12 bg-slate-900/60';
  const chipClass = isLight
    ? 'border border-blue-200/90 bg-blue-50 text-blue-700'
    : 'border border-blue-400/30 bg-blue-500/12 text-blue-300';
  const logoTileClass = isLight
    ? 'border border-slate-200/90 bg-white shadow-[0_10px_24px_-18px_rgba(15,23,42,0.3)]'
    : 'border border-slate-300/12 bg-slate-900/70 shadow-[0_12px_24px_-16px_rgba(2,6,23,0.8)]';
  const dividerClass = isLight ? 'border-slate-200/85' : 'border-slate-300/14';
  const textStrongClass = isLight ? 'text-slate-900' : 'text-slate-50';
  const textMutedClass = isLight ? 'text-slate-600' : 'text-slate-300';

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AuthCloudBackdrop />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-10">
        <div className="w-full space-y-6">
          <header className={`rounded-2xl px-4 py-3 backdrop-blur-md sm:px-5 ${shellClass}`}>
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
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                    isLight
                      ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      : 'border border-slate-300/16 bg-slate-900/65 text-slate-200 hover:bg-slate-900'
                  }`}
                  aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
                  title={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
                >
                  {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  {isLight ? 'Dark' : 'Light'}
                </button>

                <Link
                  to="/login"
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    isLight
                      ? 'border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-slate-900'
                      : 'border border-slate-300/16 bg-slate-900/65 text-slate-200 hover:border-blue-300/40'
                  }`}
                >
                  Log in
                </Link>
              </div>
            </div>
          </header>

          <div className="grid w-full gap-6 lg:grid-cols-[0.94fr_1.06fr]">
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className={`hidden rounded-[30px] p-8 backdrop-blur-md lg:flex lg:min-h-[700px] lg:flex-col ${shellClass}`}
            >
              <div className="space-y-7">
                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${chipClass}`}>
                  <Rocket className="h-3.5 w-3.5" />
                  Enterprise Onboarding
                </div>

                <h1 className={`text-4xl font-bold leading-tight ${textStrongClass}`}>
                  Create your organization workspace and standardize cloud delivery.
                </h1>

                <p className={`text-sm leading-relaxed ${textMutedClass}`}>
                  Register once to establish your secure control plane for provisioning, policies, and cross-team operations.
                </p>

                <div className={`rounded-2xl p-4 ${softClass}`}>
                  {SIGNUP_HIGHLIGHTS.map((item, index) => (
                    <div
                      key={item}
                      className={`flex items-start gap-3 py-2 ${
                        index !== SIGNUP_HIGHLIGHTS.length - 1 ? `border-b ${dividerClass}` : ''
                      }`}
                    >
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-blue-500" />
                      <p className={`text-sm leading-relaxed ${textMutedClass}`}>{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-7">
                <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Launch on familiar cloud platforms
                </p>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {[
                    { src: '/provider-logos/aws.svg', alt: 'AWS' },
                    { src: '/provider-logos/azure.svg', alt: 'Azure' },
                    { src: '/provider-logos/gcp.svg', alt: 'Google Cloud' },
                  ].map((provider) => (
                    <div key={provider.alt} className={`flex items-center justify-center rounded-xl p-3 ${logoTileClass}`}>
                      <img src={provider.src} alt={provider.alt} className="h-7 w-auto object-contain" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className={`overflow-hidden rounded-[30px] backdrop-blur-md ${shellClass}`}
            >
              <div className={`border-b px-6 py-6 sm:px-8 ${dividerClass}`}>
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-blue-400/35 bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/25">
                    <UserPlus className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${textStrongClass}`}>Create Account</h2>
                    <p className={`mt-1 text-sm ${textMutedClass}`}>Set up your secure workspace for multi-cloud operations.</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-6 sm:px-8 sm:py-7">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
