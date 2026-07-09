'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { getTokens, clearTokens, setTokens, login as apiLogin, register as apiRegister, logout as apiLogout, getProfile, type UserProfile, type Tokens } from './api';

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
  const [state, setState] = useState<AuthState>({ user: null, tokens: null, loading: true });

  const fetchUser = useCallback(async () => {
    const tokens = getTokens();
    if (!tokens) {
      setState({ user: null, tokens: null, loading: false });
      return;
    }
    setState(prev => ({ ...prev, tokens, loading: true }));
    const res = await getProfile();
    if (res.success && res.data) {
      setState({ user: res.data, tokens, loading: false });
    } else {
      clearTokens();
      setState({ user: null, tokens: null, loading: false });
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    const res = await apiLogin(username, password);
    if (res.success && res.data) {
      await fetchUser();
      return null;
    }
    return res.error?.message || 'Login failed';
  }, [fetchUser]);

  const register = useCallback(async (username: string, email: string, password: string, inviteCode: string): Promise<string | null> => {
    const res = await apiRegister(username, email, password, inviteCode);
    if (res.success && res.data) {
      await fetchUser();
      return null;
    }
    return res.error?.message || 'Registration failed';
  }, [fetchUser]);

  const logout = useCallback(async () => {
    await apiLogout();
    setState({ user: null, tokens: null, loading: false });
  }, []);

  const refresh = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

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
