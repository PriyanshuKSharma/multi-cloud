import React from 'react';
import { Chrome } from 'lucide-react';

const SSOLogin: React.FC = () => {
  const handleGoogleLogin = () => {
    // Redirect to backend SSO endpoint
    window.location.href = 'http://localhost:8000/auth/sso/google/login';
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-gray-900 text-gray-400">Or continue with</span>
        </div>
      </div>

      <button
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center space-x-3 px-4 py-2.5 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
      >
        <Chrome className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Sign in with Google</span>
      </button>
    </div>
  );
};

export default SSOLogin;
