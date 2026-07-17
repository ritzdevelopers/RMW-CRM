'use client';

import { toast } from '@/lib/toast';
import { apiGet, apiPost, apiPatch, apiDelete, apiError } from '@/lib/api';
import type { Paginated, User } from '@/types';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@/lib/simple-query';

export interface UserFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  roleId?: number;
  status?: string;
}

export function useUsers(filters: UserFilters) {
  const p = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) p.set(k, String(v));
  });
  return useQuery({
    queryKey: ['users', 'list', filters],
    queryFn: () => apiGet<Paginated<User>>(`/users?${p.toString()}`),
    placeholderData: keepPreviousData,
  });
}

export function useAssignableUsers() {
  return useQuery({
    queryKey: ['users', 'assignable'],
    queryFn: () => apiGet<{ id: number; name: string; avatar_url?: string; role: string }[]>('/users/assignable'),
    staleTime: 5 * 60_000,
  });
}

export function useRoleOptions() {
  return useQuery({
    queryKey: ['roles', 'options'],
    queryFn: () => apiGet<{ id: number; name: string; display_name: string }[]>('/roles/options'),
    staleTime: 10 * 60_000,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => apiPost<User>('/users', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created!', { description: 'New team member has been added.' });
    },
    onError: (err) => toast.error(apiError(err, 'Could not create user')),
  });
}

export function useUpdateUser(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => apiPatch<User>(`/users/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated!', { description: 'Changes saved successfully.' });
    },
    onError: (err) => toast.error(apiError(err, 'Could not update user')),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(`/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted!', { description: 'The user has been removed.' });
    },
    onError: (err) => toast.error(apiError(err, 'Could not delete user')),
  });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (payload: { name?: string; phone?: string; avatarUrl?: string }) =>
      apiPatch<User>('/users/me/profile', payload),
    onSuccess: () => toast.success('Profile updated!', { description: 'Your changes have been saved.' }),
    onError: (err) => toast.error(apiError(err, 'Could not update profile')),
  });
}
