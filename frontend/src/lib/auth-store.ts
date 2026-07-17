import { create } from 'zustand';
import type { User } from '@/types';

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
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  permissions: [],
  isInitialized: false,
  setAuth: ({ user, accessToken, permissions }) =>
    set({ user, accessToken, permissions: permissions ?? get().permissions }),
  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  setInitialized: (v) => set({ isInitialized: v }),
  clear: () => set({ user: null, accessToken: null, permissions: [] }),
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
};
