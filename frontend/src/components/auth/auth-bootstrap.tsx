'use client';

import * as React from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';

/**
 * On first load, hydrates access token from sessionStorage, then refreshes
 * the httpOnly cookie session and loads the current user.
 */
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { setAuth, setInitialized, hydrateToken } = useAuthStore();

  React.useEffect(() => {
    let mounted = true;

    async function loadSession(token: string): Promise<boolean> {
      if (!token) return false;
      useAuthStore.getState().setAccessToken(token);
      try {
        const meRes = await api.get('/auth/me');
        const { user, permissions } = meRes.data.data;
        if (mounted) setAuth({ user, accessToken: token, permissions });
        return true;
      } catch {
        return false;
      }
    }

    (async () => {
      hydrateToken();
      const storedToken = useAuthStore.getState().accessToken;

      try {
        // 1) Prefer rotating via the httpOnly refresh cookie (if present).
        let refreshedToken: string | null = null;
        try {
          const res = await api.post('/auth/refresh', {});
          refreshedToken = res.data?.data?.accessToken ?? null;
        } catch {
          // Cookie missing/blocked — fall back to the stored access token.
        }

        const ok = await loadSession(refreshedToken ?? storedToken ?? '');

        // 2) Stored token expired/invalid → clear so guards send to login.
        if (!ok && mounted) {
          useAuthStore.getState().clear();
        }
      } finally {
        if (mounted) setInitialized(true);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
