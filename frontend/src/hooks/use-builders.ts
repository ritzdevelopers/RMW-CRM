'use client';

import { toast } from '@/lib/toast';
import { apiGet, apiPost, apiPatch, apiDelete, apiError } from '@/lib/api';
import type { Builder, Paginated } from '@/types';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@/lib/simple-query';

export interface BuilderFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  tier?: string;
  city?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

const key = {
  all: ['builders'] as const,
  list: (f: BuilderFilters) => ['builders', 'list', f] as const,
  detail: (id: number) => ['builders', 'detail', id] as const,
  options: ['builders', 'options'] as const,
};

function toParams(f: BuilderFilters) {
  const p = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) p.set(k, String(v));
  });
  return p.toString();
}

export function useBuilders(filters: BuilderFilters) {
  return useQuery({
    queryKey: key.list(filters),
    queryFn: () => apiGet<Paginated<Builder>>(`/builders?${toParams(filters)}`),
    placeholderData: keepPreviousData,
  });
}

export function useBuilderOptions() {
  return useQuery({
    queryKey: key.options,
    queryFn: () => apiGet<{ id: number; name: string }[]>('/builders/options'),
    staleTime: 5 * 60_000,
  });
}

export function useCreateBuilder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Builder>) => apiPost<Builder>('/builders', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key.all });
      toast.success('Builder added!', { description: 'New builder has been added to your list.' });
    },
    onError: (err) => toast.error(apiError(err, 'Could not add builder')),
  });
}

export function useUpdateBuilder(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Builder>) => apiPatch<Builder>(`/builders/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key.all });
      toast.success('Builder updated!', { description: 'Changes saved successfully.' });
    },
    onError: (err) => toast.error(apiError(err, 'Could not update builder')),
  });
}

export function useDeleteBuilder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(`/builders/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key.all });
      toast.success('Builder deleted!', { description: 'The builder has been removed.' });
    },
    onError: (err) => toast.error(apiError(err, 'Could not delete builder')),
  });
}
