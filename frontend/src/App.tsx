import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';

import Dashboard from './pages/Dashboard';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-gray-400 animate-pulse">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Import Layout
import Layout from './components/Layout';

import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import ResourcesPage from './pages/ResourcesPage';

function App() {
  return (
    <Router>
      <div className="nebula-bg">
        <div className="nebula-spot w-[500px] h-[500px] bg-blue-600/20 -top-20 -left-20 animate-pulse-slow" />
        <div className="nebula-spot w-[600px] h-[600px] bg-purple-600/15 bottom-0 right-0 animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="nebula-spot w-[400px] h-[400px] bg-emerald-600/10 top-1/4 left-1/2 animate-pulse-slow" style={{ animationDelay: '4s' }} />
      </div>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/onboarding" element={
             <ProtectedRoute>
                <Onboarding />
             </ProtectedRoute>
          } />
          
          {/* Protected Routes wrapped in Layout */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
