import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api, { API_BASE_URL } from '../api/axios';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, UserPlus, Sparkles } from 'lucide-react';

const signupSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  organization: z.string().optional(),
  job_profile: z.string().optional(),
  phone_number: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
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

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<SignupFormInputs>({
    resolver: zodResolver(signupSchema),
  });

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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
       {/* Background Decorative Blobs */}
       <div className="absolute top-[20%] right-[10%] w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
       <div className="absolute bottom-[20%] left-[10%] w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass-panel rounded-2xl p-8 relative z-10 my-8"
      >
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4 shadow-lg shadow-emerald-500/30">
                <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                Join Nebula
            </h2>
            <p className="text-gray-400 mt-2">Start orchestrating your cloud infrastructure</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300 ml-1">Full Name</label>
            <div className="relative group">
                <UserPlus className="absolute left-3 top-3 w-5 h-5 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
                <input 
                {...register('full_name')} 
                className="input-field w-full pl-10 py-2.5 focus:ring-emerald-500"
                placeholder="John Doe"
                />
            </div>
            {errors.full_name && <p className="text-red-400 text-xs ml-1">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300 ml-1">Email</label>
            <div className="relative group">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
                <input 
                {...register('email')} 
                className="input-field w-full pl-10 py-2.5 focus:ring-emerald-500"
                placeholder="user@example.com"
                />
            </div>
            {errors.email && <p className="text-red-400 text-xs ml-1">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300 ml-1">Job Profile</label>
              <input 
              {...register('job_profile')} 
              className="input-field w-full px-4 py-2.5 focus:ring-emerald-500"
              placeholder="DevOps Engineer"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300 ml-1">Organization</label>
              <input 
              {...register('organization')} 
              className="input-field w-full px-4 py-2.5 focus:ring-emerald-500"
              placeholder="Cloud Corp"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300 ml-1">Phone Number</label>
            <input 
            {...register('phone_number')} 
            className="input-field w-full px-4 py-2.5 focus:ring-emerald-500"
            placeholder="+1 (555) 000-0000"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
             <div className="relative group">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
                <input 
                type="password" 
                {...register('password')} 
                className="input-field w-full pl-10 py-2.5 focus:ring-emerald-500"
                placeholder="••••••••"
                />
            </div>
            {errors.password && <p className="text-red-400 text-xs ml-1">{errors.password.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300 ml-1">Confirm Password</label>
             <div className="relative group">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
                <input 
                type="password" 
                {...register('confirmPassword')} 
                className="input-field w-full pl-10 py-2.5 focus:ring-emerald-500"
                placeholder="••••••••"
                />
            </div>
            {errors.confirmPassword && <p className="text-red-400 text-xs ml-1">{errors.confirmPassword.message}</p>}
          </div>

          {errors.root && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {errors.root.message}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-medium py-2.5 rounded-md shadow-lg shadow-emerald-500/20 transition-all duration-200 active:scale-95 flex items-center justify-center space-x-2"
          >
            <span>{isSubmitting ? 'Creating Account...' : 'Create Account'}</span>
             {!isSubmitting && <UserPlus className="w-5 h-5" />}
          </button>
        </form>
         <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account? <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline">Log in</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
