import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Cloud, User } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

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

      const response = await api.post('/auth/login', data);
      login(response.data.token);
      navigate('/');
    } catch (error) {
      setError('root', { 
            message: 'Invalid email or password' 
        });
      console.error('Login failed', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-transparent relative z-10">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-panel p-10 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500" />
        
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-blue-500/10 rounded-3xl mb-6 shadow-inner">
             <Cloud className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-4xl font-black text-white glow-text tracking-tighter mb-3">Nebula OS</h1>
          <p className="text-gray-400 font-medium">Access your multi-cloud command center.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Universal ID</label>
            <div className="relative group">
                <input 
                  {...register('email')} 
                  type="email" 
                  className="input-field w-full pl-12" 
                  placeholder="name@nexus.com" 
                />
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
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
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1 font-bold ml-1">{errors.password.message}</p>}
          </div>

          {errors.root && ( // Added root error display
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {errors.root.message}
            </div>
          )}

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={isSubmitting}
            className="btn-primary w-full py-4 rounded-2xl text-lg font-bold shadow-[0_0_30px_rgba(37,99,235,0.3)] mt-2"
          >
            {isSubmitting ? 'Authenticating...' : 'Enter Console'}
          </motion.button>
        </form>

        <div className="mt-10 pt-8 border-t border-white/5 text-center">
          <p className="text-gray-500 font-medium">
            New explorer? {' '}
            <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-bold underline-offset-4 hover:underline transition-all">
               Initialize Account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
