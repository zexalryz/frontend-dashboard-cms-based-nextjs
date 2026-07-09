'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { getTokens, clearTokens, login as apiLogin, register as apiRegister, logout as apiLogout, getProfile, type UserProfile, type Tokens } from './api';
import { logActivity } from './activity';

interface AuthState {
  user: UserProfile | null;
  tokens: Tokens | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<string | null>;
  register: (username: string, email: string, password: string, inviteCode: string) => Promise<string | null>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Sync check on mount — no cascade risk outside effect
  const [state, setState] = useState<AuthState>(() => {
    const tokens = getTokens();
    return { user: null, tokens, loading: !!tokens };
  });

  // Fetch profile on mount when tokens exist; setState only in async .then()
  useEffect(() => {
    const tokens = getTokens();
    if (!tokens) return;
    let cancelled = false;
    getProfile().then(res => {
      if (cancelled) return;
      if (res.success && res.data) {
        setState({ user: res.data, tokens, loading: false });
      } else {
        clearTokens();
        setState({ user: null, tokens: null, loading: false });
      }
    });
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    const res = await apiLogin(username, password);
    if (res.success && res.data) {
      const newTokens = res.data;
      setState(prev => ({ ...prev, tokens: newTokens, loading: true }));
      const profileRes = await getProfile();
      if (profileRes.success && profileRes.data) {
        setState({ user: profileRes.data, tokens: newTokens, loading: false });
      }
      logActivity('login', `Logged in as ${username}`);
      return null;
    }
    return res.error?.message || 'Login failed';
  }, []);

  const register = useCallback(async (username: string, email: string, password: string, inviteCode: string): Promise<string | null> => {
    const res = await apiRegister(username, email, password, inviteCode);
    if (res.success && res.data) {
      const newTokens = res.data;
      setState(prev => ({ ...prev, tokens: newTokens, loading: true }));
      const profileRes = await getProfile();
      if (profileRes.success && profileRes.data) {
        setState({ user: profileRes.data, tokens: newTokens, loading: false });
      }
      logActivity('register', `Created account ${username}`);
      return null;
    }
    return res.error?.message || 'Registration failed';
  }, []);

  const logout = useCallback(async () => {
    logActivity('logout', 'Logged out');
    await apiLogout();
    setState({ user: null, tokens: null, loading: false });
  }, []);

  const refresh = useCallback(async () => {
    const tokens = getTokens();
    if (!tokens) return;
    setState(prev => ({ ...prev, tokens, loading: true }));
    const res = await getProfile();
    if (res.success && res.data) {
      setState({ user: res.data, tokens, loading: false });
    } else {
      clearTokens();
      setState({ user: null, tokens: null, loading: false });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
