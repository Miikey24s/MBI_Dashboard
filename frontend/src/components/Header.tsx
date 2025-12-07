'use client';

import * as React from 'react';
import Link from 'next/link';
import { Moon, Sun, Languages, Bell, BellOff, BarChart3, LogOut, Users, Home, Building2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/providers/LanguageProvider';
import { useNotification } from '@/providers/NotificationProvider';
import { useAuth } from '@/providers/AuthProvider';

export function Header() {
  const { setTheme, theme } = useTheme();
  const { locale, setLocale, t } = useLanguage();
  const { notificationsEnabled, toggleNotifications } = useNotification();
  const { user, logout, isAuthenticated } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg" />
              <span className="text-lg font-bold">MBI Dashboard</span>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-md">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">MBI Dashboard</span>
              {user?.tenantName && (
                <span className="hidden sm:inline text-xs text-gray-500 dark:text-gray-400 ml-2">
                  {user.tenantName}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleNotifications}
              className={`p-2 rounded-lg transition-colors ${
                notificationsEnabled
                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
              title={notificationsEnabled ? 'Tắt thông báo' : 'Bật thông báo'}
            >
              {notificationsEnabled ? <Bell size={18} /> : <BellOff size={18} />}
            </button>

            <button
              onClick={() => setLocale(locale === 'en' ? 'vi' : 'en')}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5"
              title={t.language}
            >
              <Languages size={18} />
              <span className="text-xs font-medium">{locale.toUpperCase()}</span>
            </button>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title={t.theme}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* User Menu */}
            {isAuthenticated && user && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                    {user.fullName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200">
                    {user.fullName}
                  </span>
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20">
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.fullName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          {user.roles?.join(', ')}
                        </p>
                      </div>
                      <Link
                        href="/"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Home size={16} />
                        {t.dashboard}
                      </Link>
                      {user.roles?.includes('Admin') && (
                        <>
                          <Link
                            href="/users"
                            onClick={() => setShowUserMenu(false)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Users size={16} />
                            {t.manageUsers}
                          </Link>
                          <Link
                            href="/departments"
                            onClick={() => setShowUserMenu(false)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Building2 size={16} />
                            {t.manageDepartments}
                          </Link>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      >
                        <LogOut size={16} />
                        {t.logout}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
