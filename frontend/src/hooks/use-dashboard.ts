'use client';

import { apiGet } from '@/lib/api';
import type { DashboardOverview } from '@/types';
import { useQuery } from '@/lib/simple-query';

export function useDashboardOverview() {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => apiGet<DashboardOverview>('/dashboard/overview'),
  });
}

export function useTeamPerformance() {
  return useQuery({
    queryKey: ['dashboard', 'team'],
    queryFn: () => apiGet<any[]>('/dashboard/team'),
  });
}

export function useTodaysTasks() {
  return useQuery({
    queryKey: ['dashboard', 'tasks'],
    queryFn: () => apiGet<any[]>('/dashboard/tasks'),
  });
}

export function useRecentActivities() {
  return useQuery({
    queryKey: ['dashboard', 'activities'],
    queryFn: () => apiGet<any[]>('/dashboard/activities'),
  });
}
