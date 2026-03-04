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
  Cpu,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import AuthCloudBackdrop from '../components/auth/AuthCloudBackdrop';
import SSOButtons from '../components/auth/SSOButtons';

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

const Login: React.FC = () => {
  const { login } = useAuth();
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

  const pulseItems = [
    { label: 'Deploy Queue', value: '52ms' },
    { label: 'Cloud Sync', value: 'active' },
    { label: 'Policy Gate', value: 'pass' },
  ];

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

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AuthCloudBackdrop />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-10">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
          <motion.section
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
            className="hidden rounded-3xl border border-slate-300/15 bg-slate-950/35 p-8 backdrop-blur-xl lg:flex lg:flex-col lg:justify-between"
          >
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
                <CloudLightning className="h-3.5 w-3.5" />
                Nebula Control Plane
              </div>
              <h1 className="mt-5 text-4xl font-bold leading-tight text-white">
                Operate multi-cloud workloads from one cockpit.
              </h1>
              <p className="mt-4 max-w-lg text-sm text-slate-300/90">
                Sign in to provision, monitor, and automate resources across AWS, Azure, and GCP with one unified dashboard.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <img src="/provider-logos/aws.svg" alt="AWS" className="rounded-xl border border-slate-300/10 bg-slate-900/50 p-2" />
              <img src="/provider-logos/azure.svg" alt="Azure" className="rounded-xl border border-slate-300/10 bg-slate-900/50 p-2" />
              <img src="/provider-logos/gcp.svg" alt="Google Cloud" className="rounded-xl border border-slate-300/10 bg-slate-900/50 p-2" />
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-300/10 bg-slate-900/45 p-4">
              <div className="flex items-start gap-3 text-slate-200">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-300" />
                <p className="text-sm">Centralized authentication with JWT-secured API access.</p>
              </div>
              <div className="flex items-start gap-3 text-slate-200">
                <Sparkles className="mt-0.5 h-4 w-4 text-cyan-300" />
                <p className="text-sm">Live deployment tracking, inventory sync, and guided operations.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-300/10 bg-slate-900/45 p-4">
              <div className="mb-3 flex items-center justify-between text-slate-200">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300/80">Platform Pulse</p>
                <TrendingUp className="h-4 w-4 text-cyan-300" />
              </div>
              <div className="space-y-2">
                {pulseItems.map((item, index) => (
                  <div key={item.label} className="rounded-lg border border-slate-300/10 bg-slate-900/60 p-2.5">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-slate-300">{item.label}</span>
                      <span className="font-semibold uppercase tracking-wide text-emerald-200">{item.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800">
                      <motion.div
                        className="h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                        initial={{ width: '24%' }}
                        animate={{ width: ['24%', '72%', '38%', '84%', '24%'] }}
                        transition={{ duration: 8 + index, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="rounded-3xl border border-slate-300/15 bg-slate-950/55 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8"
          >
            <div className="mb-7 text-center">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30">
                <CloudLightning className="h-7 w-7 text-white" />
              </div>
              <h2 className="mt-4 text-3xl font-bold text-white">Welcome Back</h2>
              <p className="mt-2 text-sm text-slate-300">Sign in to continue building across clouds.</p>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 rounded-lg border border-slate-300/10 bg-slate-900/60 px-3 py-2 text-slate-200">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                Zero-Trust Auth
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-300/10 bg-slate-900/60 px-3 py-2 text-slate-200">
                <Cpu className="h-3.5 w-3.5 text-cyan-300" />
                Cloud Runtime
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <label className="ml-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-300/90">
                  Email Address
                </label>
                <div className="group relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-500 transition-colors group-focus-within:text-cyan-300" />
                  <input
                    {...register('email')}
                    className="input-field w-full py-2.5 pl-10"
                    placeholder="you@company.com"
                  />
                </div>
                {errors.email && <p className="ml-1 text-xs text-rose-300">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-300/90">
                  Password
                </label>
                <div className="group relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500 transition-colors group-focus-within:text-cyan-300" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className="input-field w-full py-2.5 pl-10 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="absolute right-3 top-3 text-slate-500 transition-colors hover:text-cyan-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="ml-1 text-xs text-rose-300">{errors.password.message}</p>}
              </div>

              {errors.root && (
                <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {errors.root.message}
                </div>
              )}

              {isSSOProcessing && (
                <div className="rounded-xl border border-cyan-300/35 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">
                  Completing {ssoProviderName || 'SSO'} sign-in...
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || isSSOProcessing}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 transition-all hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span>{isSSOProcessing ? 'Processing SSO...' : isSubmitting ? 'Signing In...' : 'Sign In'}</span>
                {!isSubmitting && !isSSOProcessing && <ArrowRight className="h-4 w-4" />}
              </button>

              <SSOButtons onProviderClick={handleSSORedirect} disabled={isSubmitting || isSSOProcessing} accent="cyan" />
            </form>

            <p className="mt-4 text-center text-xs text-slate-400">
              Tip: use your work email to auto-map activity to project audit trails.
            </p>

            <p className="mt-6 text-center text-sm text-slate-300">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="font-semibold text-cyan-300 transition-colors hover:text-cyan-200">
                Create Free Account
              </Link>
            </p>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default Login;
