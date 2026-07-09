'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const { user, loading, login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace(user.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const errMsg = mode === 'login'
      ? await login(form.get('username') as string, form.get('password') as string)
      : await register(
          form.get('username') as string,
          form.get('email') as string,
          form.get('password') as string,
          form.get('inviteCode') as string,
        );
    if (errMsg) setError(errMsg);
    setSubmitting(false);
  };

  return (
    <div className="max-w-sm mx-auto mt-20">
      <h1 className="text-2xl font-bold text-center mb-6 dark:text-white">
        {mode === 'login' ? 'Sign In' : 'Create Account'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">Username</label>
          <input name="username" required className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>

        {mode === 'register' && (
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Email</label>
            <input name="email" type="email" required className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">Password</label>
          <input name="password" type="password" required className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>

        {mode === 'register' && (
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Invite Code</label>
            <input name="inviteCode" required className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
        )}

        {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Register'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
        {mode === 'login' ? (
          <>No account?{' '}<button onClick={() => { setMode('register'); setError(''); }} className="text-blue-600 underline">Register</button></>
        ) : (
          <>Already have an account?{' '}<button onClick={() => { setMode('login'); setError(''); }} className="text-blue-600 underline">Sign In</button></>
        )}
      </p>
    </div>
  );
}
