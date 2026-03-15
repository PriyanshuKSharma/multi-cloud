import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api, { AUTH_INVALID_EVENT } from '../api/axios';

interface AuthContextType {
  user: any;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const logout = React.useCallback(() => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    queryClient.removeQueries({ queryKey: ['auth', 'me'], exact: true });
  }, [queryClient]);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data);
          queryClient.setQueryData(['auth', 'me'], response.data);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Failed to fetch user profile during auth initialization', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [logout, queryClient]);

  useEffect(() => {
    const handleAuthInvalid = () => logout();
    window.addEventListener(AUTH_INVALID_EVENT, handleAuthInvalid);
    return () => window.removeEventListener(AUTH_INVALID_EVENT, handleAuthInvalid);
  }, [logout]);

  const refreshUser = React.useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      logout();
      return;
    }

    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      queryClient.setQueryData(['auth', 'me'], response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to refresh user profile', error);
      logout();
      throw error;
    }
  }, [logout, queryClient]);

  const login = async (token: string) => {
    localStorage.setItem('token', token);
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      queryClient.setQueryData(['auth', 'me'], response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to fetch user profile after login', error);
      logout();
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
