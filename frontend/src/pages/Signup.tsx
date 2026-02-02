import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, UserPlus, User } from 'lucide-react';

const signupSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupInputs = z.infer<typeof signupSchema>;

const Signup: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<SignupInputs>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupInputs) => {
    try {
      await api.post('/auth/signup', {
        email: data.email,
        password: data.password,
        full_name: data.full_name
      });
      
      const loginRes = await api.post('/auth/login', {
          email: data.email,
          password: data.password
      });
      login(loginRes.data.token);
      navigate('/onboarding');
    } catch (error) {
      setError('root', { message: 'Registration failed. Explorer ID might be taken.' });
      console.error('Signup failed', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-transparent relative z-10">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-panel p-10 md:p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500" />
        
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-purple-500/10 rounded-3xl mb-6 shadow-inner">
             <UserPlus className="w-10 h-10 text-purple-400" />
          </div>
          <h1 className="text-4xl font-black text-white glow-text tracking-tighter mb-3">Initialize ID</h1>
          <p className="text-gray-400 font-medium">Join the multi-cloud federation.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
           <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Full Identity</label>
            <div className="relative group">
                <input 
                  {...register('full_name')} 
                  className="input-field w-full pl-12" 
                  placeholder="Commander Shepard" 
                />
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
            </div>
            {errors.full_name && <p className="text-red-400 text-xs mt-1 font-bold ml-1">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Universal ID</label>
            <div className="relative group">
                <input 
                  {...register('email')} 
                  type="email" 
                  className="input-field w-full pl-12" 
                  placeholder="name@nexus.com" 
                />
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
            </div>
            {errors.email && <p className="text-red-400 text-xs mt-1 font-bold ml-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Secure Key</label>
            <div className="relative group">
                <input 
                  {...register('password')} 
                  type="password" 
                  className="input-field w-full pl-12" 
                  placeholder="••••••••" 
                />
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1 font-bold ml-1">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Confirm Key</label>
            <div className="relative group">
                <input 
                  {...register('confirmPassword')} 
                  type="password" 
                  className="input-field w-full pl-12" 
                  placeholder="••••••••" 
                />
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
            </div>
            {errors.confirmPassword && <p className="text-red-400 text-xs mt-1 font-bold ml-1">{errors.confirmPassword.message}</p>}
          </div>

          {errors.root && (
             <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-100 text-[11px] text-center font-bold">
                {errors.root.message}
             </div>
          )}

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-2xl shadow-[0_0_30px_rgba(147,51,234,0.3)] transition-all hover:shadow-[0_0_40px_rgba(147,51,234,0.5)] active:scale-95 disabled:opacity-50 mt-2"
          >
            {isSubmitting ? 'Initializing Node...' : 'Establish Connection'}
          </motion.button>
        </form>

        <div className="mt-10 pt-8 border-t border-white/5 text-center">
          <p className="text-gray-500 font-medium">
            Already registered? {' '}
            <Link to="/login" className="text-purple-400 hover:text-purple-300 font-bold underline-offset-4 hover:underline transition-all">
               Access Console
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
