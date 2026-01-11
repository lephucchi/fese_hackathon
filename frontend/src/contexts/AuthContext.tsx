'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/utils/constants/api';
import { apiClient } from '@/services/api/client';

// Types
export interface RoleInfo {
  role_id: number;
  role_name: string;
}

export interface User {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  avatar_url?: string;
  risk_appetite?: string;
  role?: RoleInfo;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to refresh token first
        const refreshSuccess = await refreshToken();
        if (!refreshSuccess) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Fetch current user info from /api/auth/me
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Register 401 listener
    apiClient.setUnauthorizedListener(() => {
      setUser(null);
      router.push('/');
    });
  }, [refreshToken, router]);

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      refreshToken();
    }, 14 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, refreshToken]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail?.message || 'Login failed');
      }

      const data = await response.json();
      setUser(data.user);
      
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  }, [router]);

  const register = useCallback(async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    displayName?: string
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          display_name: displayName || `${firstName} ${lastName}`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail?.message || 'Registration failed');
      }

      const data = await response.json();
      setUser(data.user);
      
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
    } finally {
      setUser(null);
      router.push('/');
    }
  }, [router]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
