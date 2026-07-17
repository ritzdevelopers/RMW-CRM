'use client';

import * as React from 'react';
import axios from 'axios';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

/**
 * On first load, silently refreshes the session (httpOnly cookie) and
 * hydrates the auth store. Renders children immediately; guards handle gating.
 */
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { setAuth, setInitialized } = useAuthStore();

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        const token = res.data?.data?.accessToken;
        if (token && mounted) {
          useAuthStore.getState().setAccessToken(token);
          const meRes = await api.get('/auth/me');
          const { user, permissions } = meRes.data.data;
          setAuth({ user, accessToken: token, permissions });
        }
      } catch {
        // no active session — that's fine
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
