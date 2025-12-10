'use client';

import { useLanguage } from '@/providers/LanguageProvider';

export function DashboardHeader() {
  const { t } = useLanguage();

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.dashboardTitle}</h1>
      <p className="text-gray-500 dark:text-gray-400 mt-1">{t.dashboardDescription}</p>
    </div>
  );
}
