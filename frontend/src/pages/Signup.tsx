import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../api/axios';
import { Link, useNavigate } from 'react-router-dom';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormInputs = z.infer<typeof signupSchema>;

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
      });
      // Redirect to login after successful registration
      navigate('/login');
    } catch (err: any) {
      setError('root', { 
        message: err.response?.data?.detail || 'Registration failed.' 
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
        <h2 className="text-3xl font-bold mb-6 text-center text-green-400">Create Account</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Email</label>
            <input 
              {...register('email')} 
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition"
              placeholder="user@example.com"
            />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Password</label>
            <input 
              type="password" 
              {...register('password')} 
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Confirm Password</label>
            <input 
              type="password" 
              {...register('confirmPassword')} 
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition"
              placeholder="••••••••"
            />
            {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword.message}</p>}
          </div>

          {errors.root && <div className="text-red-400 text-sm text-center">{errors.root.message}</div>}

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-2 bg-green-600 hover:bg-green-700 rounded font-semibold transition disabled:opacity-50"
          >
            {isSubmitting ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-400">
          Already have an account? <Link to="/login" className="text-green-400 hover:underline">Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
