'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect đến dashboard
    router.push('/dashboard');
  }, [router]);

  return (
    <MainLayout>
      <div className="flex items-center justify-center h-64">
        <p>Đang chuyển hướng...</p>
      </div>
    </MainLayout>
  );
}
