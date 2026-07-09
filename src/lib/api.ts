const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

function getTokens(): Tokens | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('tokens');
  return raw ? JSON.parse(raw) : null;
}

function setTokens(t: Tokens) {
  localStorage.setItem('tokens', JSON.stringify(t));
}

function clearTokens() {
  localStorage.removeItem('tokens');
  localStorage.removeItem('user');
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: number; message: string };
  message?: string;
  timestamp: string;
}

async function rawFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  return res.json();
}

async function authFetch<T>(path: string, init?: RequestInit, retry = true): Promise<ApiResponse<T>> {
  const tokens = getTokens();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (tokens) headers['Authorization'] = `Bearer ${tokens.accessToken}`;

  let res = await fetch(`${BASE}${path}`, { ...init, headers });

  // Auto-refresh on 401
  if (res.status === 401 && tokens && retry) {
    const refreshRes = await rawFetch<Tokens>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });

    if (refreshRes.success && refreshRes.data) {
      setTokens(refreshRes.data);
      headers['Authorization'] = `Bearer ${refreshRes.data.accessToken}`;
      res = await fetch(`${BASE}${path}`, { ...init, headers });
    } else {
      clearTokens();
      window.location.href = '/';
      throw new Error('Session expired');
    }
  }

  // Safely parse JSON — handle non-JSON error bodies (e.g. dev proxy HTML pages)
  if (!res.ok) {
    try {
      return await res.json();
    } catch {
      return {
        success: false,
        error: { code: res.status, message: `Request failed (${res.status})` },
        timestamp: new Date().toISOString(),
      };
    }
  }

  return res.json();
}

// ── Auth ──

export async function login(username: string, password: string) {
  const res = await rawFetch<{ accessToken: string; refreshToken: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (res.success && res.data) setTokens(res.data);
  return res;
}

export async function register(username: string, email: string, password: string, inviteCode: string) {
  const res = await rawFetch<{ accessToken: string; refreshToken: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, inviteCode }),
  });
  if (res.success && res.data) setTokens(res.data);
  return res;
}

export async function logout() {
  const tokens = getTokens();
  if (tokens) {
    await rawFetch('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });
  }
  clearTokens();
}

export async function refreshTokens() {
  const tokens = getTokens();
  if (!tokens) throw new Error('No tokens');
  const res = await rawFetch<Tokens>('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: tokens.refreshToken }),
  });
  if (res.success && res.data) setTokens(res.data);
  return res;
}

// ── User ──

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'MODERATOR' | 'DONATOR' | 'USER';
  createdAt: string;
}

export async function getProfile() {
  return authFetch<UserProfile>('/api/user/profile');
}

export interface UserList {
  users: UserProfile[];
  total: number;
  skip: number;
  take: number;
}

export async function listUsers(skip = 0, take = 100) {
  return authFetch<UserList>(`/api/user?skip=${skip}&take=${take}`);
}

export async function updateRole(userId: string, role: string) {
  return authFetch<UserProfile>(`/api/user/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function changePassword(currentPassword: string, newPassword: string) {
  return authFetch<{ message: string }>('/api/user/profile/password', {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function deleteProfile() {
  return authFetch<{ message: string }>('/api/user/profile', { method: 'DELETE' });
}

export async function deleteUser(userId: string) {
  return authFetch<{ message: string }>(`/api/user/${userId}`, { method: 'DELETE' });
}

// ── Admin ──

export async function generateInviteCodes(count: number = 1) {
  return authFetch<{ codes: string[] }>('/api/auth/invite-codes', {
    method: 'POST',
    body: JSON.stringify({ count }),
  });
}

// ── Activity ──

export async function logActivityAPI(type: string, detail = '') {
  return authFetch<{ id: string }>('/api/activity', {
    method: 'POST',
    body: JSON.stringify({ type, detail }),
  });
}

export async function getActivityFeedAPI(take = 50) {
  return authFetch<{ id: string; type: string; detail: string; createdAt: string }[]>(`/api/activity?take=${take}`);
}

// ── Stats ──

export async function getDashboardStats() {
  return authFetch<{
    totalUsers: number;
    newUsers7d: number;
    roleDistribution: { role: string; count: number }[];
  }>('/api/user/stats');
}

// ── Profile ──

export async function updateProfile(data: { email?: string }) {
  return authFetch<{ id: string; username: string; email: string; role: string; createdAt: string }>('/api/user/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export { getTokens, setTokens, clearTokens };
export type { Tokens };
