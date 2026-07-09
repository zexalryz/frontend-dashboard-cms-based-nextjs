'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { listUsers, updateRole, deleteUser, type UserProfile } from '@/lib/api';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [take] = useState(10);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    if (!loading && !user) router.replace('/');
    if (!loading && user && user.role !== 'ADMIN') router.replace('/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    let cancelled = false;
    listUsers(0, take).then(res => {
      if (cancelled) return;
      if (res.success && res.data) {
        setUsers(res.data.users);
        setTotal(res.data.total);
        setSkip(0);
      } else {
        setError(res.error?.message || 'Failed to load users');
      }
    });
    return () => { cancelled = true; };
  }, [user, take]);

  const refetch = (s: number) => {
    listUsers(s, take).then(res => {
      if (res.success && res.data) {
        setUsers(res.data.users);
        setTotal(res.data.total);
        setSkip(s);
      } else {
        setError(res.error?.message || 'Failed to load users');
      }
    });
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionMsg('');
    const res = await updateRole(userId, newRole);
    if (res.success) {
      setActionMsg('Role updated');
      refetch(skip);
    } else {
      setError(res.error?.message || 'Failed to update role');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    setActionMsg('');
    const res = await deleteUser(userId);
    if (res.success) {
      setActionMsg('User deleted');
      refetch(skip);
    } else {
      setError(res.error?.message || 'Failed to delete user');
    }
  };

  const totalPages = Math.ceil(total / take);
  const currentPage = Math.floor(skip / take) + 1;

  if (loading) return <div className="text-center mt-20 text-gray-400">Loading...</div>;
  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
      <p className="text-sm text-gray-500 mb-4">{total} user{total !== 1 ? 's' : ''} total</p>

      {actionMsg && <p className="text-green-600 text-sm mb-2">{actionMsg}</p>}
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">{u.username}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    defaultValue={u.role}
                    onChange={e => handleRoleChange(u.id, e.target.value)}
                    className="border rounded px-2 py-1 text-xs"
                    disabled={u.id === user.id}
                  >
                    <option value="USER">USER</option>
                    <option value="DONATOR">DONATOR</option>
                    <option value="MODERATOR">MODERATOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {u.id !== user.id && (
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="text-red-600 hover:text-red-800 text-xs font-medium"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6 text-sm">
          <button
            onClick={() => refetch(skip - take)}
            disabled={skip === 0}
            className="px-3 py-1 border rounded disabled:opacity-30 hover:bg-gray-100"
          >
            Previous
          </button>
          <span className="text-gray-500">Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => refetch(skip + take)}
            disabled={skip + take >= total}
            className="px-3 py-1 border rounded disabled:opacity-30 hover:bg-gray-100"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
