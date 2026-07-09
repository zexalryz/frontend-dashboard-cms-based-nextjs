'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { changePassword, deleteProfile } from '@/lib/api';

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [delMsg, setDelMsg] = useState('');
  const [delErr, setDelErr] = useState('');

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
      await logout();
      router.replace('/');
    } else {
      setDelErr(res.error?.message || 'Failed to delete account');
    }
  };

  if (loading || !user) return <div className="text-center mt-20 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      {/* Info card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Account Info</h2>
        <div className="text-sm space-y-2">
          <p><span className="font-medium text-gray-600">Username:</span> {user.username}</p>
          <p><span className="font-medium text-gray-600">Email:</span> {user.email}</p>
          <p><span className="font-medium text-gray-600">Role:</span> <span className="uppercase tracking-wider text-xs bg-gray-100 px-2 py-0.5 rounded">{user.role}</span></p>
          <p><span className="font-medium text-gray-600">Joined:</span> {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Current Password</label>
            <input name="currentPassword" type="password" required className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input name="newPassword" type="password" required className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          {pwMsg && <p className="text-green-600 text-sm">{pwMsg}</p>}
          {pwErr && <p className="text-red-600 text-sm">{pwErr}</p>}
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700">
            Update Password
          </button>
        </form>
      </div>

      {/* Delete account */}
      <div className="bg-white rounded-lg shadow p-6 border border-red-200">
        <h2 className="text-lg font-semibold text-red-700 mb-3">Danger Zone</h2>
        <p className="text-sm text-gray-600 mb-3">Permanently delete your account and all associated data.</p>
        {delMsg && <p className="text-green-600 text-sm mb-2">{delMsg}</p>}
        {delErr && <p className="text-red-600 text-sm mb-2">{delErr}</p>}
        <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700">
          Delete My Account
        </button>
      </div>
    </div>
  );
}
