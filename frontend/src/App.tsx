import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import AuthCloudBackdrop from './components/auth/AuthCloudBackdrop';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Landing from './pages/Landing';
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
import NetworkDetail from './pages/resources/NetworkDetail';
import CreateNetwork from './pages/resources/CreateNetwork';
import Functions from './pages/resources/Functions';
import CreateFunction from './pages/resources/CreateFunction';
import Messaging from './pages/resources/Messaging';
import CreateMessaging from './pages/resources/CreateMessaging';
import Projects from './pages/Projects';
import Deployments from './pages/Deployments';
import DeploymentDetail from './pages/DeploymentDetail';
import Billing from './pages/Billing';
import CloudAccounts from './pages/CloudAccounts';
import Activity from './pages/Activity';
import Blueprints from './pages/Blueprints';
import CloudConsole from './pages/CloudConsole';
import Profile from './pages/Profile';
import Subscriptions from './pages/Subscriptions';
import HelpPage from './pages/Help';
import Docs from './pages/Docs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import HelpCenter from './pages/HelpCenter';
import ContactUs from './pages/ContactUs';

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
  const location = useLocation();
  
  if (isLoading) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <AuthCloudBackdrop />
        <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
          <div className="rounded-2xl border border-slate-300/15 bg-slate-950/55 px-8 py-7 backdrop-blur-xl shadow-2xl shadow-black/35">
            <div className="flex flex-col items-center space-y-4">
              <div className="h-12 w-12 rounded-full border-4 border-cyan-300/20 border-t-emerald-300 animate-spin" />
              <p className="text-sm font-medium text-slate-200 animate-pulse">Authenticating...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (location.pathname === '/') {
      return <Landing />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <NotificationProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/help-center" element={<HelpCenter />} />
                <Route path="/contact-us" element={<ContactUs />} />
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
                    <Route path="networks/:id" element={<NetworkDetail />} />
                    <Route path="networks/create" element={<CreateNetwork />} />
                    <Route path="functions" element={<Functions />} />
                    <Route path="functions/create" element={<CreateFunction />} />
                    <Route path="queues" element={<Messaging />} />
                    <Route path="queues/create" element={<CreateMessaging />} />
                    <Route path="messages" element={<Messaging />} />
                    <Route path="messages/create" element={<CreateMessaging />} />
                    <Route path="aws/sqs" element={<Navigate to="/resources/queues?provider=aws" replace />} />
                    <Route path="aws/sqs/create" element={<Navigate to="/resources/queues/create?provider=aws" replace />} />
                    <Route path="aws/sns" element={<Navigate to="/resources/messages?provider=aws" replace />} />
                    <Route path="aws/sns/create" element={<Navigate to="/resources/messages/create?provider=aws" replace />} />
                    <Route path="messaging" element={<Navigate to="/resources/queues?provider=aws" replace />} />
                    <Route path="messaging/create" element={<Navigate to="/resources/queues/create?provider=aws" replace />} />
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
                  <Route path="subscriptions" element={<Subscriptions />} />
                  <Route path="profile" element={<Profile />} />

                  <Route path="help" element={<HelpPage />} />
                  <Route path="docs" element={<Docs />} />
                </Route>
              </Routes>
            </NotificationProvider>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
