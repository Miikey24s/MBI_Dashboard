'use client';

import { useLanguage } from '@/providers/LanguageProvider';

export default function DashboardTitle() {
  const { t } = useLanguage();
  return (
    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
      {t.dashboardTitle}
    </h1>
  );
}
