'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { listUsers, updateRole, deleteUser, generateInviteCodes, type UserProfile } from '@/lib/api';

const isAdmin = (role: string) => role === 'ADMIN';
const isStaff = (role: string) => role === 'ADMIN' || role === 'MODERATOR';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // ── User management state ──
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [take] = useState(10);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  // ── Invite code state ──
  const [inviteCount, setInviteCount] = useState(1);
  const [codes, setCodes] = useState<string[]>([]);
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviteErr, setInviteErr] = useState('');
  const [generating, setGenerating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Route guard: ADMIN or MODERATOR
  useEffect(() => {
    if (!loading && !user) router.replace('/');
    if (!loading && user && !isStaff(user.role)) router.replace('/dashboard');
  }, [user, loading, router]);

  // Fetch users (ADMIN only)
  useEffect(() => {
    if (!user || !isAdmin(user.role)) return;
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

  const handleGenerate = async () => {
    setInviteMsg('');
    setInviteErr('');
    setGenerating(true);
    const res = await generateInviteCodes(inviteCount);
    if (res.success && res.data) {
      setCodes(res.data.codes);
      setInviteMsg(`Generated ${res.data.codes.length} invite code${res.data.codes.length !== 1 ? 's' : ''}`);
      // Copy to clipboard automatically
      const text = res.data.codes.join('\n');
      try { await navigator.clipboard.writeText(text); } catch { /* fallback: manual copy */ }
    } else {
      setInviteErr(res.error?.message || 'Failed to generate codes');
    }
    setGenerating(false);
  };

  const handleCopy = () => {
    if (!codes.length) return;
    const text = codes.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setInviteMsg('Copied to clipboard');
    }).catch(() => {
      if (textareaRef.current) {
        textareaRef.current.select();
      }
    });
  };

  const totalPages = Math.ceil(total / take);
  const currentPage = Math.floor(skip / take) + 1;

  if (loading) return <div className="text-center mt-20 text-gray-400">Loading...</div>;
  if (!user || !isStaff(user.role)) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {isAdmin(user.role) ? 'Admin Panel' : 'Moderator Panel'}
      </h1>

      {/* ── Invite code generator ── */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Generate Invite Codes</h2>
        <div className="flex items-end gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Count</label>
            <input
              type="number"
              min={1}
              max={10}
              value={inviteCount}
              onChange={e => setInviteCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-20 border rounded px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate'}
          </button>
          {codes.length > 0 && (
            <button
              onClick={handleCopy}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-200"
            >
              Copy All
            </button>
          )}
        </div>
        {inviteMsg && <p className="text-green-600 text-sm mb-2">{inviteMsg}</p>}
        {inviteErr && <p className="text-red-600 text-sm mb-2">{inviteErr}</p>}
        {codes.length > 0 && (
          <textarea
            ref={textareaRef}
            readOnly
            value={codes.join('\n')}
            rows={Math.min(codes.length, 5)}
            className="w-full border rounded px-3 py-2 text-sm font-mono bg-gray-50 resize-none"
            onClick={e => (e.target as HTMLTextAreaElement).select()}
          />
        )}
      </div>

      {/* ── User management (ADMIN only) ── */}
      {isAdmin(user.role) && (
        <>
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
        </>
      )}
    </div>
  );
}
