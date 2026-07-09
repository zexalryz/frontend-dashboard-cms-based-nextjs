'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { changePassword, deleteProfile } from '@/lib/api';
import { logActivity } from '@/lib/activity';

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [delMsg, setDelMsg] = useState('');
  const [delErr, setDelErr] = useState('');

  const [passwordChanged, setPasswordChanged] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('password_changed') === 'true';
  });

  useEffect(() => {
    if (!loading && !user) router.replace('/');
  }, [user, loading, router]);

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPwMsg('');
    setPwErr('');
    const form = new FormData(e.currentTarget);
    const res = await changePassword(
      form.get('currentPassword') as string,
      form.get('newPassword') as string,
    );
    if (res.success) {
      setPwMsg('Password changed successfully');
      localStorage.setItem('password_changed', 'true');
      setPasswordChanged(true);
      logActivity('password_change', 'Changed account password');
      (e.target as HTMLFormElement).reset();
    } else {
      setPwErr(res.error?.message || 'Failed to change password');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Permanently delete your account? This cannot be undone.')) return;
    setDelMsg('');
    setDelErr('');
    const res = await deleteProfile();
    if (res.success) {
      logActivity('account_delete', 'Deleted user account');
      await logout();
      router.replace('/');
    } else {
      setDelErr(res.error?.message || 'Failed to delete account');
    }
  };

  if (loading || !user) return <div className="text-center mt-20 text-gray-400 dark:text-gray-500">Loading...</div>;

  const completenessItems = [
    { label: 'Username set', done: !!user.username },
    { label: 'Email set', done: !!user.email },
    { label: 'Password changed', done: passwordChanged },
  ];
  const completenessPct = Math.round(completenessItems.filter(i => i.done).length / completenessItems.length * 100);

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Profile</h1>

      {/* Profile completeness */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 dark:shadow-gray-900/50">
        <h2 className="text-lg font-semibold mb-3 dark:text-white">Profile Completeness</h2>
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Profile strength</span>
          <span className="font-medium dark:text-white">{completenessPct}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
          <div
            className={`h-2.5 rounded-full transition-all ${completenessPct === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${completenessPct}%` }}
          />
        </div>
        <ul className="text-sm space-y-2">
          {completenessItems.map((item, i) => (
            <li key={i} className={`flex items-center gap-2 ${item.done ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {item.done ? '✅' : '⬜'} {item.label}
            </li>
          ))}
        </ul>
        {!passwordChanged && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            💡 Change your password below to reach 100% completeness.
          </p>
        )}
      </div>

      {/* Info card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 dark:shadow-gray-900/50">
        <h2 className="text-lg font-semibold mb-3 dark:text-white">Account Info</h2>
        <div className="text-sm space-y-2">
          <p><span className="font-medium text-gray-600 dark:text-gray-400">Username:</span> <span className="dark:text-white">{user.username}</span></p>
          <p><span className="font-medium text-gray-600 dark:text-gray-400">Email:</span> <span className="dark:text-white">{user.email}</span></p>
          <p><span className="font-medium text-gray-600 dark:text-gray-400">Role:</span> <span className="uppercase tracking-wider text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded dark:text-gray-200">{user.role}</span></p>
          <p><span className="font-medium text-gray-600 dark:text-gray-400">Joined:</span> <span className="dark:text-white">{new Date(user.createdAt).toLocaleDateString()}</span></p>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 dark:shadow-gray-900/50">
        <h2 className="text-lg font-semibold mb-3 dark:text-white">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Current Password</label>
            <input name="currentPassword" type="password" required className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">New Password</label>
            <input name="newPassword" type="password" required className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          {pwMsg && <p className="text-green-600 text-sm">{pwMsg}</p>}
          {pwErr && <p className="text-red-600 text-sm">{pwErr}</p>}
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700">
            Update Password
          </button>
        </form>
      </div>

      {/* Delete account */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-red-200 dark:border-red-800 dark:shadow-gray-900/50">
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-3">Danger Zone</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Permanently delete your account and all associated data.</p>
        {delMsg && <p className="text-green-600 text-sm mb-2">{delMsg}</p>}
        {delErr && <p className="text-red-600 text-sm mb-2">{delErr}</p>}
        <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700">
          Delete My Account
        </button>
      </div>
    </div>
  );
}
