'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/');
  }, [user, loading, router]);

  if (loading || !user) return <div className="text-center mt-20 text-gray-400">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-2">Welcome, {user.username}</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <p><span className="font-medium">Email:</span> {user.email}</p>
          <p><span className="font-medium">Role:</span> <span className="uppercase tracking-wider text-xs bg-gray-100 px-2 py-0.5 rounded">{user.role}</span></p>
          <p><span className="font-medium">Joined:</span> {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/profile" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition block">
          <h3 className="font-semibold">Profile Settings</h3>
          <p className="text-sm text-gray-500 mt-1">View profile, change password, delete account</p>
        </Link>

        {user.role === 'ADMIN' && (
          <Link href="/dashboard/admin" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition block">
            <h3 className="font-semibold">Admin Panel</h3>
            <p className="text-sm text-gray-500 mt-1">Manage users, roles, and more</p>
          </Link>
        )}
      </div>
    </div>
  );
}
