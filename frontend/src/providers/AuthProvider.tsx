'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  login as apiLogin,
  register as apiRegister,
  getProfile,
  saveAuth,
  getToken,
  getStoredUser,
  clearAuth,
} from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    tenantName?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Đảm bảo chỉ chạy trên client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load user from storage on mount (chỉ sau khi mounted)
  useEffect(() => {
    if (!mounted) return;

    const loadUser = async () => {
      try {
        const token = getToken();
        const storedUser = getStoredUser();

        if (token && storedUser) {
          setUser(storedUser);
          // Refresh profile from server
          try {
            const freshUser = await getProfile(token);
            setUser(freshUser);
            saveAuth(token, freshUser);
          } catch {
            // Token expired or invalid
            clearAuth();
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [mounted]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await apiLogin(email, password);
      saveAuth(response.accessToken, response.user);
      setUser(response.user);
      router.push('/');
    },
    [router],
  );

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      fullName: string;
      tenantName?: string;
    }) => {
      const response = await apiRegister(data);
      saveAuth(response.accessToken, response.user);
      setUser(response.user);
      router.push('/');
    },
    [router],
  );

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    router.push('/login');
  }, [router]);

  const refreshProfile = useCallback(async () => {
    const token = getToken();
    if (token) {
      const freshUser = await getProfile(token);
      setUser(freshUser);
      saveAuth(token, freshUser);
    }
  }, []);

  // Trả về loading state cho đến khi mounted
  if (!mounted) {
    return (
      <AuthContext.Provider
        value={{
          user: null,
          isLoading: true,
          isAuthenticated: false,
          login: async () => {},
          register: async () => {},
          logout: () => {},
          refreshProfile: async () => {},
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
