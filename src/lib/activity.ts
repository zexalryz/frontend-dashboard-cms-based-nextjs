import { logActivityAPI, getActivityFeedAPI } from './api';

export interface ActivityEvent {
  id?: string;
  type: string;
  detail: string;
  timestamp: string;
  createdAt?: string;
}

const STORAGE_KEY = 'activity_feed';
const MAX_EVENTS = 50;

export function logActivity(type: string, detail: string) {
  // Fire-and-forget API call — does not block UI
  logActivityAPI(type, detail).catch(() => {
    // Fallback to localStorage if API fails
    if (typeof window === 'undefined') return;
    try {
      const feed = getLocalActivityFeed();
      feed.unshift({ type, detail, timestamp: new Date().toISOString() });
      if (feed.length > MAX_EVENTS) feed.length = MAX_EVENTS;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(feed));
    } catch { /* ignore */ }
  });
}

export async function getActivityFeed(take = 50): Promise<ActivityEvent[]> {
  // Try API first, fallback to localStorage
  try {
    const res = await getActivityFeedAPI(take);
    if (res.success && res.data) {
      return res.data.map((e: any) => ({
        id: e.id,
        type: e.type,
        detail: e.detail,
        timestamp: e.createdAt,
      }));
    }
  } catch { /* fallback */ }

  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getLocalActivityFeed(): ActivityEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearActivityFeed() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export const ACTIVITY_LABELS: Record<string, string> = {
  login: 'Logged in',
  register: 'Created account',
  logout: 'Logged out',
  password_change: 'Changed password',
  account_delete: 'Deleted account',
};

export const ACTIVITY_ICONS: Record<string, string> = {
  login: '🔑',
  register: '📝',
  logout: '🚪',
  password_change: '🔐',
  account_delete: '🗑️',
};
