import { create } from 'zustand';
import type { User } from '@/types';

const TOKEN_KEY = 'mpf_access_token';

function readStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeStoredToken(token: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // private browsing / storage blocked
  }
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  permissions: string[];
  isInitialized: boolean;
  setAuth: (data: { user: User; accessToken: string; permissions?: string[] }) => void;
  setAccessToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setInitialized: (v: boolean) => void;
  clear: () => void;
  can: (permission: string) => boolean;
  hydrateToken: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  permissions: [],
  isInitialized: false,
  setAuth: ({ user, accessToken, permissions }) => {
    writeStoredToken(accessToken);
    set({ user, accessToken, permissions: permissions ?? get().permissions });
  },
  setAccessToken: (token) => {
    writeStoredToken(token);
    set({ accessToken: token });
  },
  setUser: (user) => set({ user }),
  setInitialized: (v) => set({ isInitialized: v }),
  clear: () => {
    writeStoredToken(null);
    set({ user: null, accessToken: null, permissions: [] });
  },
  hydrateToken: () => {
    const token = readStoredToken();
    if (token) set({ accessToken: token });
  },
  can: (permission) => {
    const { user, permissions } = get();
    if (user?.role === 'super_admin') return true;
    return permissions.includes(permission);
  },
}));

// Non-hook accessors for the axios layer.
export const authToken = {
  get: () => useAuthStore.getState().accessToken,
  set: (t: string | null) => useAuthStore.getState().setAccessToken(t),
  clear: () => useAuthStore.getState().clear(),
  hydrate: () => useAuthStore.getState().hydrateToken(),
};
