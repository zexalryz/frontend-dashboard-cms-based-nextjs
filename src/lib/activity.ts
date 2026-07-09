export interface ActivityEvent {
  type: string;
  detail: string;
  timestamp: string;
}

const STORAGE_KEY = 'activity_feed';
const MAX_EVENTS = 50;

export function getActivityFeed(): ActivityEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function logActivity(type: string, detail: string) {
  if (typeof window === 'undefined') return;
  try {
    const feed = getActivityFeed();
    feed.unshift({ type, detail, timestamp: new Date().toISOString() });
    if (feed.length > MAX_EVENTS) feed.length = MAX_EVENTS;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(feed));
  } catch {
    // localStorage full or unavailable
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
