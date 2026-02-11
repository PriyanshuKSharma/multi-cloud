import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api, { API_BASE_URL } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, CloudLightning } from 'lucide-react';

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
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', data.email);
      formData.append('password', data.password);

      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      login(response.data.access_token);
      navigate('/');
    } catch (err: any) {
        setError('root', {
            message: getLoginErrorMessage(err),
        });
        console.error('Login failed', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass-panel rounded-2xl p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 shadow-lg shadow-blue-500/30">
            <CloudLightning className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Welcome Back
          </h2>
          <p className="text-gray-400 mt-2">Sign in to manage your cloud universe</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300 ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
              <input 
                {...register('email')} 
                className="input-field w-full pl-10 py-2.5"
                placeholder="you@example.com"
              />
            </div>
            {errors.email && <p className="text-red-400 text-xs ml-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-medium text-gray-300">Password</label>
            </div>
            <div className="relative group">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
              <input 
                type="password" 
                {...register('password')} 
                className="input-field w-full pl-10 py-2.5"
                placeholder="••••••••"
              />
            </div>
            {errors.password && <p className="text-red-400 text-xs ml-1">{errors.password.message}</p>}
          </div>

          {errors.root && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {errors.root.message}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="btn-primary w-full flex items-center justify-center space-x-2 group"
          >
            <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
            {!isSubmitting && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-medium hover:underline transition-all">
            Create Free Account
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
