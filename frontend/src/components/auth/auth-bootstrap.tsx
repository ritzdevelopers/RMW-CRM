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
    (async () => {
      hydrateToken();
      try {
        const res = await api.post('/auth/refresh', {});
        const token = res.data?.data?.accessToken;
        if (token && mounted) {
          useAuthStore.getState().setAccessToken(token);
          const meRes = await api.get('/auth/me');
          const { user, permissions } = meRes.data.data;
          setAuth({ user, accessToken: token, permissions });
        }
      } catch {
        // no active session — sessionStorage token may still work until expiry
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
