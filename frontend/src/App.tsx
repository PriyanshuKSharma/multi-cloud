import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';

// New Layout
import AppLayout from './components/layout/AppLayout';

// New Pages
import DashboardNew from './pages/DashboardNew';
import VirtualMachines from './pages/resources/VirtualMachines';
import VMDetail from './pages/resources/VMDetail';
import CreateVM from './pages/resources/CreateVM';
import Storage from './pages/resources/Storage';
import CreateStorage from './pages/resources/CreateStorage';
import Networks from './pages/resources/Networks';
import CreateNetwork from './pages/resources/CreateNetwork';
import Projects from './pages/Projects';
import Deployments from './pages/Deployments';
import DeploymentDetail from './pages/DeploymentDetail';
import Billing from './pages/Billing';
import CloudAccounts from './pages/CloudAccounts';
import Activity from './pages/Activity';
import Blueprints from './pages/Blueprints';
import CloudConsole from './pages/CloudConsole';
import Profile from './pages/Profile';
import HelpPage from './pages/Help';
import Docs from './pages/Docs';

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Onboarding */}
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } />
            
            {/* Protected Routes with New Layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardNew />} />
              
              {/* Resources */}
              <Route path="resources">
                <Route path="vms" element={<VirtualMachines />} />
                <Route path="vms/:id" element={<VMDetail />} />
                <Route path="vms/create" element={<CreateVM />} />
                <Route path="storage" element={<Storage />} />
                <Route path="storage/create" element={<CreateStorage />} />
                <Route path="networks" element={<Networks />} />
                <Route path="networks/create" element={<CreateNetwork />} />
              </Route>
              
              {/* Other Routes */}
              <Route path="projects" element={<Projects />} />
              <Route path="deployments" element={<Deployments />} />
              <Route path="deployments/:id" element={<DeploymentDetail />} />
              <Route path="billing" element={<Billing />} />
              <Route path="accounts" element={<CloudAccounts />} />
              <Route path="activity" element={<Activity />} />
              <Route path="console" element={<CloudConsole />} />
              <Route path="blueprints" element={<Blueprints />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
              <Route path="help" element={<HelpPage />} />
              <Route path="docs" element={<Docs />} />
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
