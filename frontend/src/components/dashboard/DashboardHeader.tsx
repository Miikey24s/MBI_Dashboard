'use client';

import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useLanguage } from '@/providers/LanguageProvider';

export function DashboardHeader() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.dashboardTitle}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t.dashboardDescription}</p>
      </div>
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        {t.refresh}
      </button>
    </div>
  );
}
