import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';

import Dashboard from './pages/Dashboard';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated } = useAuth();
  const token = localStorage.getItem('token'); 
  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Import Layout
import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected Routes wrapped in Layout */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            {/* Future routes like /resources can go here */}
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
