'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function Nav() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href={user?.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard'} className="font-semibold text-lg">
            Auth Dashboard
          </Link>
          {user && (
            <div className="flex gap-4 text-sm">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
              <Link href="/profile" className="text-gray-600 hover:text-gray-900">Profile</Link>
              {user.role === 'ADMIN' && (
                <Link href="/dashboard/admin" className="text-gray-600 hover:text-gray-900">Admin Panel</Link>
              )}
            </div>
          )}
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {user.username} <span className="text-xs uppercase tracking-wider ml-1 text-gray-400">({user.role})</span>
            </span>
            <button onClick={logout} className="text-sm text-red-600 hover:text-red-800">Logout</button>
          </div>
        )}
      </div>
    </nav>
  );
}
