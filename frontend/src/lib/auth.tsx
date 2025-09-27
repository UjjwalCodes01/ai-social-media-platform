'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, tokenUtils } from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  connectedAccounts: {
    twitter: { connected: boolean; username?: string };
    linkedin: { connected: boolean; username?: string };
    instagram: { connected: boolean; username?: string };
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = tokenUtils.getToken();
      if (token) {
        try {
          const response = await authAPI.verifyToken();
          if (response.success) {
            setUser(response.user);
          } else {
            // Invalid token, remove it
            tokenUtils.removeToken();
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          tokenUtils.removeToken();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authAPI.login({ email, password });
      if (response.success) {
        tokenUtils.setToken(response.token);
        setUser(response.user);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof Error) {
        // Check if it's a connection error
        if (error.message.includes('Unable to connect to server')) {
          throw new Error('Cannot connect to server. Please make sure the backend is running on http://localhost:5000');
        }
        throw error;
      } else {
        throw new Error('An unexpected error occurred during login');
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authAPI.register({ name, email, password });
      if (response.success) {
        tokenUtils.setToken(response.token);
        setUser(response.user);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof Error) {
        // Check if it's a connection error
        if (error.message.includes('Unable to connect to server')) {
          throw new Error('Cannot connect to server. Please make sure the backend is running on http://localhost:5000');
        }
        throw error;
      } else {
        throw new Error('An unexpected error occurred during registration');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    tokenUtils.removeToken();
    setUser(null);
    router.push('/auth');
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};