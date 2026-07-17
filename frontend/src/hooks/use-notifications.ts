'use client';

import { apiGet, apiPatch } from '@/lib/api';
import type { Notification, Paginated } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@/lib/simple-query';

export function useNotifications(unread = false) {
  return useQuery({
    queryKey: ['notifications', { unread }],
    queryFn: () => apiGet<Paginated<Notification>>(`/notifications?unread=${unread}&pageSize=50`),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => apiGet<{ count: number }>('/notifications/unread-count'),
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiPatch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiPatch('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
