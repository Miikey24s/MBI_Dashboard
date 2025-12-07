'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn, Loader2, BarChart3 } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error(t.fillAllFields);
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      toast.success(t.success);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t.error;
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg mb-4">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">MBI Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t.biForSme}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{t.loginTitle}</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.email}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@company.com"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                disabled={isLoading} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.password}</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pr-12"
                  disabled={isLoading} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              {isLoading ? t.loggingIn : t.loginButton}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {t.noAccount}{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">{t.registerNow}</Link>
            </p>
          </div>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t.demoAccount}:</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Email: <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">admin@demo.com</code>
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Password: <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">admin123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
