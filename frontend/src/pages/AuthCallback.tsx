import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      console.error('SSO Error:', error);
      navigate('/login?error=' + error);
      return;
    }

    if (token) {
      login(token);
      navigate('/');
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
