'use client';

import { useEffect, useState, useLayoutEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthProviderProps {
  children: React.ReactNode;
}

// Các route không cần đăng nhập
const publicRoutes = ['/login', '/register'];

// Dùng useLayoutEffect trên client, useEffect trên server
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Đánh dấu đã mount
  useIsomorphicLayoutEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const checkAuth = () => {
      const token = localStorage.getItem('accessToken');
      const isPublicRoute = publicRoutes.includes(pathname);

      if (!token && !isPublicRoute) {
        router.push('/login');
        return;
      }
      
      if (token && isPublicRoute) {
        router.push('/dashboard');
        return;
      }
      
      setIsAuthenticated(!!token || isPublicRoute);
      setIsChecking(false);
    };

    checkAuth();
  }, [pathname, router, mounted]);

  // Render loading state nhất quán giữa server và client
  if (!mounted || isChecking) {
    return null; // Không render gì để tránh hydration mismatch
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
