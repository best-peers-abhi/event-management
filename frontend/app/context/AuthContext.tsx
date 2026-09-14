'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthResponse, LoginDto, RegisterDto, User } from '../types';
import { authService } from '../services/auth.service';
import { storage } from '../utils/storage';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (dto: LoginDto) => Promise<AuthResponse>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => void;
  isOrganizer: (eventCreatedBy?: number) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Restore session from localStorage on initial client load
  useEffect(() => {
    try {
      const savedToken = storage.getToken();
      const savedUser = storage.getUser();

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(savedUser);
      }
    } catch (e) {
      console.error('Failed to restore authentication session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (dto: LoginDto): Promise<AuthResponse> => {
      setIsLoading(true);
      try {
        const response = await authService.login(dto);
        // Persist token and user in storage
        storage.setToken(response.token);
        storage.setUser(response.user);

        // Update state
        setToken(response.token);
        setUser(response.user);

        return response;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const register = useCallback(
    async (dto: RegisterDto): Promise<void> => {
      setIsLoading(true);
      try {
        await authService.register(dto);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    storage.clearAuth();
    setUser(null);
    setToken(null);
    router.push('/login');
  }, [router]);

  const isOrganizer = useCallback(
    (eventCreatedBy?: number): boolean => {
      if (!user || eventCreatedBy === undefined) return false;
      return user.id === eventCreatedBy;
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        isOrganizer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
