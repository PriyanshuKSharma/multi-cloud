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
  Sun,
} from 'lucide-react';
import AuthCloudBackdrop from '../components/auth/AuthCloudBackdrop';
import AuthNetworkShowcase from '../components/auth/AuthNetworkShowcase';
import SSOButtons from '../components/auth/SSOButtons';
import { useTheme } from '../context/ThemeContext';
import {
  getAuthErrorCode,
  getAuthErrorDetail,
  getAuthErrorStatus,
  hasAuthErrorResponse,
} from '../utils/authErrors';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const getLoginErrorMessage = (error: unknown): string => {
  const backendMessage = getAuthErrorDetail(error);
  if (backendMessage) {
    return backendMessage;
  }

  if (getAuthErrorCode(error) === 'ERR_NETWORK' || !hasAuthErrorResponse(error)) {
    return `Cannot reach API server (${API_BASE_URL}). Set VITE_API_URL to your deployed backend URL and allow your frontend origin in backend CORS.`;
  }

  if (getAuthErrorStatus(error) === 404) {
    return `Login endpoint not found at ${API_BASE_URL}/auth/login. Verify VITE_API_URL and backend deployment.`;
  }

  return 'Login failed. Please try again.';
};

const LOGIN_HIGHLIGHTS = [
  'Route operator access through one India-centered control layer with governed cloud visibility.',
  'Track transfer motion between AWS, Azure, and GCP before you enter the workspace.',
  'Keep sign-in, deployment telemetry, and policy context aligned in a single operator flow.',
];

const LOGIN_STATS = [
  { label: 'Cloud fabric', value: 'AWS + Azure + GCP' },
  { label: 'Transfer view', value: 'Live path animation' },
  { label: 'Access posture', value: 'Policy-governed sign-in' },
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
      } catch (error: unknown) {
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
    } catch (err: unknown) {
      setError('root', {
        message: getLoginErrorMessage(err),
      });
      console.error('Login failed', err);
    }
  };

  const isLight = theme === 'light';
  const formShellClass = isLight
    ? 'border border-white/75 bg-white/64 shadow-[0_30px_80px_-42px_rgba(37,99,235,0.3)]'
    : 'border border-white/8 bg-slate-950/18';
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

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AuthCloudBackdrop />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-10">
        <div className="w-full space-y-6">
          <header className={`px-1 py-2 pb-5 sm:px-0 ${headerClass}`}>
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
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${headerActionClass}`}
                  aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
                  title={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
                >
                  {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  {isLight ? 'Dark' : 'Light'}
                </button>

                <Link
                  to="/signup"
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${headerLinkClass}`}
                >
                  Create Account
                </Link>
              </div>
            </div>
          </header>

          <div className="lg:hidden">
            <AuthNetworkShowcase
              compact
              eyebrow="India-Centered Cloud Grid"
              title="Watch global cloud traffic converge before you sign in."
              description="Nebula presents AWS, Azure, and GCP activity as one operational network anchored on India-led control and visible transfer lanes."
              highlights={LOGIN_HIGHLIGHTS}
              stats={LOGIN_STATS}
            />
          </div>

          <div className="grid w-full gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="hidden lg:block"
            >
              <AuthNetworkShowcase
                eyebrow="India-Centered Cloud Grid"
                title="Watch global cloud traffic converge before you sign in."
                description="Nebula presents AWS, Azure, and GCP activity as one operational network anchored on India-led control and visible transfer lanes."
                highlights={LOGIN_HIGHLIGHTS}
                stats={LOGIN_STATS}
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
                    <CloudLightning className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${textStrongClass}`}>Secure Sign In</h2>
                    <p className={`mt-1 text-sm ${textMutedClass}`}>Enter your workspace and continue multi-cloud operations with live transfer context.</p>
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
