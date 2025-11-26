'use client';

import * as React from 'react';
import { Moon, Sun, Languages } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/providers/LanguageProvider';

export function Header() {
  const { setTheme, theme } = useTheme();
  const { locale, setLocale, t } = useLanguage();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <header className="w-full flex justify-end items-center gap-4 p-4 absolute top-0 right-0 z-10">
      <button
        onClick={() => setLocale(locale === 'en' ? 'vi' : 'en')}
        className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
        title={t.language}
      >
        <Languages size={20} />
        <span className="text-sm font-medium">{locale.toUpperCase()}</span>
      </button>

      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
        title={t.theme}
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </header>
  );
}
