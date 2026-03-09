import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api, { API_BASE_URL } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CloudLightning,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
  Workflow,
} from 'lucide-react';
import AuthCloudBackdrop from '../components/auth/AuthCloudBackdrop';
import SSOButtons from '../components/auth/SSOButtons';
import { useTheme } from '../context/ThemeContext';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

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

const getLoginErrorMessage = (error: any): string => {
  const backendMessage = getErrorDetail(error);
  if (backendMessage) {
    return backendMessage;
  }

  if (error?.code === 'ERR_NETWORK' || !error?.response) {
    return `Cannot reach API server (${API_BASE_URL}). Set VITE_API_URL to your deployed backend URL and allow your frontend origin in backend CORS.`;
  }

  if (error?.response?.status === 404) {
    return `Login endpoint not found at ${API_BASE_URL}/auth/login. Verify VITE_API_URL and backend deployment.`;
  }

  return 'Login failed. Please try again.';
};

const LOGIN_HIGHLIGHTS = [
  'Centralized authentication with project-level access boundaries.',
  'Unified visibility into deployments, inventory, and activity.',
  'Cross-cloud operating model for AWS, Azure, and GCP.',
];

const Login: React.FC = () => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSSOProcessing, setIsSSOProcessing] = React.useState(false);
  const [ssoProviderName, setSsoProviderName] = React.useState<string>('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const handleSSORedirect = React.useCallback(
    (provider: 'google' | 'microsoft' | 'github') => {
      if (typeof window === 'undefined') {
        return;
      }
      const frontendRedirect = `${window.location.origin}/login`;
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
          const message = getLoginErrorMessage(error);
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

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', data.email);
      formData.append('password', data.password);

      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      await login(response.data.access_token);
      navigate('/');
    } catch (err: any) {
      setError('root', {
        message: getLoginErrorMessage(err),
      });
      console.error('Login failed', err);
    }
  };

  const isLight = theme === 'light';
  const shellClass = isLight
    ? 'border border-slate-200/90 bg-white/90 shadow-[0_28px_72px_-42px_rgba(15,23,42,0.34)]'
    : 'border border-slate-300/14 bg-slate-950/68 shadow-[0_34px_80px_-42px_rgba(2,6,23,0.92)]';
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
                  <CloudLightning className="h-4.5 w-4.5" />
                </span>
                <span>
                  <span className={`block text-sm font-semibold ${textStrongClass}`}>Nebula Cloud</span>
                  <span className="block text-[11px] uppercase tracking-[0.14em] text-blue-500">Platform Access</span>
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
                  to="/signup"
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    isLight
                      ? 'border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-slate-900'
                      : 'border border-slate-300/16 bg-slate-900/65 text-slate-200 hover:border-blue-300/40'
                  }`}
                >
                  Create Account
                </Link>
              </div>
            </div>
          </header>

          <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className={`hidden rounded-[30px] p-8 backdrop-blur-md lg:flex lg:min-h-[640px] lg:flex-col ${shellClass}`}
            >
              <div className="space-y-7">
                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${chipClass}`}>
                  <Workflow className="h-3.5 w-3.5" />
                  Enterprise Sign-In
                </div>

                <h1 className={`text-4xl font-bold leading-tight ${textStrongClass}`}>
                  Operate your cloud organization from one secure control plane.
                </h1>

                <p className={`text-sm leading-relaxed ${textMutedClass}`}>
                  Continue to your workspace and manage infrastructure delivery, governance, and deployment visibility.
                </p>

                <div className={`rounded-2xl p-4 ${softClass}`}>
                  {LOGIN_HIGHLIGHTS.map((item, index) => (
                    <div
                      key={item}
                      className={`flex items-start gap-3 py-2 ${
                        index !== LOGIN_HIGHLIGHTS.length - 1 ? `border-b ${dividerClass}` : ''
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
                  Trusted cloud providers
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
                    <CloudLightning className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${textStrongClass}`}>Welcome Back</h2>
                    <p className={`mt-1 text-sm ${textMutedClass}`}>Sign in to continue your platform operations.</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-6 sm:px-8 sm:py-7">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-1.5">
                  <label className={`ml-1 block text-[11px] font-semibold uppercase tracking-[0.12em] ${isLight ? 'text-slate-600' : 'text-slate-300/90'}`}>
                    Email Address
                  </label>
                  <div className="group relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-500" />
                    <input
                      {...register('email')}
                      className="input-field h-11 w-full pl-10"
                      placeholder="you@company.com"
                    />
                  </div>
                  {errors.email && <p className="ml-1 text-xs text-rose-500">{errors.email.message}</p>}
                </div>

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
                  <span>{isSSOProcessing ? 'Processing SSO...' : isSubmitting ? 'Signing In...' : 'Sign In'}</span>
                  {!isSubmitting && !isSSOProcessing && <ArrowRight className="h-4 w-4" />}
                </button>

                  <div className={`border-t pt-5 ${dividerClass}`}>
                    <SSOButtons onProviderClick={handleSSORedirect} disabled={isSubmitting || isSSOProcessing} accent="cyan" />
                  </div>
                </form>
              </div>

              <div className={`border-t px-6 py-4 text-center text-sm sm:px-8 ${dividerClass}`}>
                <p className={textMutedClass}>
                  Don&apos;t have an account?{' '}
                  <Link to="/signup" className="font-semibold text-blue-500 transition-colors hover:text-blue-600">
                    Create account
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

export default Login;
