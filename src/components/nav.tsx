'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';

export default function Nav() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href={user?.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard'} className="font-semibold text-lg dark:text-white">
            Auth Dashboard
          </Link>
          {user && (
            <div className="flex gap-4 text-sm">
              <Link href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Dashboard</Link>
              <Link href="/profile" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Profile</Link>
              {user.role === 'ADMIN' || user.role === 'MODERATOR' ? (
                <Link href="/dashboard/admin" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Admin Panel</Link>
              ) : null}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="text-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 leading-none"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {user && (
            <>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {user.username} <span className="text-xs uppercase tracking-wider ml-1">({user.role})</span>
              </span>
              <button onClick={logout} className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
