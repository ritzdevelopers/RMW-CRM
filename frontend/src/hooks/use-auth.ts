'use client';

import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import { api, apiError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { useMutation } from '@/lib/simple-query';

export function useLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (payload: { email: string; password: string; rememberMe?: boolean }) => {
      const res = await api.post('/auth/login', payload);
      return res.data.data as { accessToken: string; user: any };
    },
    onSuccess: async (data) => {
      useAuthStore.getState().setAccessToken(data.accessToken);
      const me = await api.get('/auth/me');
      setAuth({ user: me.data.data.user, accessToken: data.accessToken, permissions: me.data.data.permissions });
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`, {
        description: 'You have been successfully logged in.',
      });
      router.push('/dashboard');
    },
    onError: (err) => toast.error(apiError(err, 'Login failed'), {
      description: 'Please check your credentials and try again.',
    }),
  });
}

export function useRegister() {
  const router = useRouter();
  return useMutation({
    mutationFn: async (payload: { name: string; email: string; phone?: string; password: string }) => {
      const res = await api.post('/auth/register', payload);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Account created successfully!', {
        description: 'Please check your email to verify your account.',
      });
      router.push('/login');
    },
    onError: (err) => toast.error(apiError(err, 'Registration failed'), {
      description: 'Please try again with different details.',
    }),
  });
}

export function useLogout() {
  const router = useRouter();
  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSuccess: () => {
      useAuthStore.getState().clear();
      router.push('/login');
    },
    onError: () => {
      useAuthStore.getState().clear();
      router.push('/login');
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await api.post('/auth/forgot-password', { email });
      return res.data.data;
    },
    onSuccess: () => toast.success('Reset link sent!', {
      description: 'If an account exists, a reset link has been sent to your email.',
    }),
    onError: (err) => toast.error(apiError(err, 'Request failed')),
  });
}

export function useResetPassword() {
  const router = useRouter();
  return useMutation({
    mutationFn: async (payload: { token: string; password: string }) => {
      const res = await api.post('/auth/reset-password', payload);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Password reset successfully!', {
        description: 'You can now sign in with your new password.',
      });
      router.push('/login');
    },
    onError: (err) => toast.error(apiError(err, 'Reset failed'), {
      description: 'The reset link may have expired. Please try again.',
    }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) => {
      const res = await api.post('/auth/change-password', payload);
      return res.data.data;
    },
    onSuccess: () => toast.success('Password changed!', {
      description: 'Your password has been updated successfully.',
    }),
    onError: (err) => toast.error(apiError(err, 'Could not change password'), {
      description: 'Please check your current password and try again.',
    }),
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: async (token: string) => {
      const res = await api.post('/auth/verify-email', { token });
      return res.data.data;
    },
  });
}
