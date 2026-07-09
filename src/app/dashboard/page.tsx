'use client';

import { useAuth } from '@/lib/auth-context';
import { getActivityFeed, clearActivityFeed, getLocalActivityFeed, ACTIVITY_LABELS, ACTIVITY_ICONS, type ActivityEvent } from '@/lib/activity';
import { getDashboardStats } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  MODERATOR: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  DONATOR: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  USER: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

interface DashboardStats {
  totalUsers: number;
  newUsers7d: number;
  roleDistribution: { role: string; count: number }[];
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [feed, setFeed] = useState<ActivityEvent[]>(() => {
    if (typeof window === 'undefined') return [];
    return getLocalActivityFeed();
  });
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    getActivityFeed().then(setFeed).catch(() => {});
    getDashboardStats().then(res => { if (res.success && res.data) setStats(res.data); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace('/');
  }, [user, loading, router]);

  if (loading || !user) return <div className="text-center mt-20 text-gray-400 dark:text-gray-500">Loading...</div>;

  const accountAgeDays = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)); // eslint-disable-line react-hooks/purity

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Dashboard</h1>

      {/* Welcome card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 dark:shadow-gray-900/50">
        <h2 className="text-lg font-semibold mb-2 dark:text-white">Welcome, {user.username}</h2>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p><span className="font-medium">Email:</span> {user.email}</p>
          <p>
            <span className="font-medium">Role:</span>{' '}
            <span className={`uppercase tracking-wider text-xs px-2 py-0.5 rounded ${ROLE_COLORS[user.role] || ''}`}>
              {user.role}
            </span>
          </p>
          <p><span className="font-medium">Joined:</span> {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Stats row — merged personal + dashboard stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 dark:shadow-gray-900/50">
          <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Member for</p>
          <p className="text-2xl font-bold dark:text-white">
            {accountAgeDays} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">days</span>
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 dark:shadow-gray-900/50">
          <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Total Users</p>
          <p className="text-2xl font-bold dark:text-white">{stats?.totalUsers ?? '—'}</p>
          {stats && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">+{stats.newUsers7d} this week</p>}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 dark:shadow-gray-900/50">
          <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Email</p>
          <p className="text-lg font-bold dark:text-white truncate">{user.email}</p>
        </div>
      </div>

      {/* Quick actions */}
      <h2 className="text-lg font-semibold mb-3 dark:text-white">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Link href="/profile" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition block dark:shadow-gray-900/50">
          <h3 className="font-semibold dark:text-white">Profile Settings</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View profile, change password, delete account</p>
        </Link>

        {(user.role === 'ADMIN' || user.role === 'MODERATOR') && (
          <Link href="/dashboard/admin" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition block dark:shadow-gray-900/50">
            <h3 className="font-semibold dark:text-white">Admin Panel</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage users, roles, and invite codes</p>
          </Link>
        )}
      </div>

      {/* Activity feed */}
      {feed.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold dark:text-white">Recent Activity</h2>
            <button
              onClick={() => { clearActivityFeed(); setFeed([]); }}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Clear
            </button>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50">
            {feed.slice(0, 10).map((event, i) => (
              <div key={event.id || i} className="flex items-center gap-3 px-4 py-3 border-b last:border-0 dark:border-gray-700">
                <span className="text-lg">{ACTIVITY_ICONS[event.type] || '📌'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm dark:text-white truncate">{ACTIVITY_LABELS[event.type] || event.type}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(event.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
