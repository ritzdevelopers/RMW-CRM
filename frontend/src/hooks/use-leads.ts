'use client';

import { toast } from '@/lib/toast';
import { apiGet, apiPost, apiPatch, apiDelete, apiError } from '@/lib/api';
import type { Lead, Paginated } from '@/types';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@/lib/simple-query';

export interface LeadFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  source?: string;
  priority?: string;
  assignedTo?: number;
  builderId?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

const key = {
  all: ['leads'] as const,
  list: (f: LeadFilters) => ['leads', 'list', f] as const,
  detail: (id: number) => ['leads', 'detail', id] as const,
};

function toParams(f: LeadFilters) {
  const p = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) p.set(k, String(v));
  });
  return p.toString();
}

export function useLeads(filters: LeadFilters, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: key.list(filters),
    queryFn: () => apiGet<Paginated<Lead>>(`/leads?${toParams(filters)}`),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

export function useLead(id: number) {
  return useQuery({
    queryKey: key.detail(id),
    queryFn: () => apiGet<Lead>(`/leads/${id}`),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Lead>) => apiPost<Lead>('/leads', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key.all });
      toast.success('Lead created!', { description: 'New lead has been added to your pipeline.' });
    },
    onError: (err) => toast.error(apiError(err, 'Could not create lead'), {
      description: 'Please check the details and try again.',
    }),
  });
}

export function useUpdateLead(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Lead>) => apiPatch<Lead>(`/leads/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key.all });
      qc.invalidateQueries({ queryKey: key.detail(id) });
      toast.success('Lead updated!', { description: 'Changes saved successfully.' });
    },
    onError: (err) => toast.error(apiError(err, 'Update failed')),
  });
}

export function useChangeLeadStatus(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { status: string; lostReason?: string | null }) =>
      apiPatch<Lead>(`/leads/${id}/status`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key.all });
      qc.invalidateQueries({ queryKey: key.detail(id) });
    },
    onError: (err) => toast.error(apiError(err)),
  });
}

export function useAssignLead(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignedTo: number | null) => apiPatch<Lead>(`/leads/${id}/assign`, { assignedTo }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key.all });
      qc.invalidateQueries({ queryKey: key.detail(id) });
      toast.success('Lead reassigned!', { description: 'The lead assignment has been updated.' });
    },
    onError: (err) => toast.error(apiError(err, 'Assignment failed')),
  });
}

export function useAddActivity(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { type: string; title?: string; body?: string }) =>
      apiPost<Lead>(`/leads/${id}/activities`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key.detail(id) });
      toast.success('Activity logged!', { description: 'New activity has been recorded.' });
    },
    onError: (err) => toast.error(apiError(err, 'Could not log activity')),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(`/leads/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key.all });
      toast.success('Lead deleted!', { description: 'The lead has been removed from your pipeline.' });
    },
    onError: (err) => toast.error(apiError(err, 'Could not delete lead')),
  });
}

export function useBulkLeads() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { ids: number[]; action: string; assignedTo?: number | null; status?: string }) =>
      apiPost('/leads/bulk', payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: key.all });
      toast.success('Bulk action completed!', { 
        description: `${vars.ids.length} lead(s) have been updated.` 
      });
    },
    onError: (err) => toast.error(apiError(err, 'Bulk action failed')),
  });
}

export function useSyncMpfEnquiries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiPost<{ created: number; updated: number; total: number; skipped?: number }>('/integrations/mpf/sync', {}),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: key.all });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      const skipped = data.skipped ? `, ${data.skipped} skipped` : '';
      toast.success('My Property Fact sync complete', {
        description: `${data.created} new, ${data.updated} updated (${data.total} total${skipped}).`,
      });
    },
    onError: (err) => toast.error(apiError(err, 'Could not sync MPF enquiries')),
  });
}
