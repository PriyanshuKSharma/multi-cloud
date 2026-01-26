import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Link, useNavigate } from 'react-router-dom';

const loginSchema = z.object({
  username: z.string().email('Invalid email address'),
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
      // API expects form-data for OAuth2PasswordRequestForm
      const formData = new URLSearchParams();
      formData.append('username', data.username);
      formData.append('password', data.password);

      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      login(response.data.access_token);
      navigate('/');
    } catch (err: any) {
      setError('root', { 
        message: err.response?.data?.detail || 'Login failed. Please check your credentials.' 
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">Login</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Email</label>
            <input 
              {...register('username')} 
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              placeholder="admin@example.com"
            />
            {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Password</label>
            <input 
              type="password" 
              {...register('password')} 
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>}
          </div>

          {errors.root && <div className="text-red-400 text-sm text-center">{errors.root.message}</div>}

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold transition disabled:opacity-50"
          >
            {isSubmitting ? 'Logging in...' : 'Sign In'}
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-400">
          Don't have an account? <Link to="/signup" className="text-blue-400 hover:underline">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
