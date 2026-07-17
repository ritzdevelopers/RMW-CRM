'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Search, Building2, MapPin, Pencil, Trash2, MoreHorizontal, Globe, Phone, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BuilderFormDialog } from '@/components/builders/builder-form-dialog';
import { useBuilders, useDeleteBuilder, type BuilderFilters } from '@/hooks/use-builders';
import { useAuthStore } from '@/lib/auth-store';
import { BUILDER_STATUS_META, BUILDER_TIER_META } from '@/lib/constants';
import { getInitials } from '@/lib/utils';
import type { Builder } from '@/types';

function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

const ALL = 'all';

export default function BuildersPage() {
  const params = useSearchParams();
  const router = useRouter();
  const can = useAuthStore((s) => s.can);

  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounced(search);
  const [status, setStatus] = React.useState(ALL);
  const [tier, setTier] = React.useState(ALL);
  const [page, setPage] = React.useState(1);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Builder | null>(null);

  React.useEffect(() => {
    if (params.get('new') === '1') {
      setFormOpen(true);
      router.replace('/builders');
    }
  }, [params, router]);

  React.useEffect(() => setPage(1), [debouncedSearch, status, tier]);

  const filters: BuilderFilters = {
    page,
    pageSize: 12,
    search: debouncedSearch || undefined,
    status: status !== ALL ? status : undefined,
    tier: tier !== ALL ? tier : undefined,
  };

  const { data, isLoading, isFetching } = useBuilders(filters);
  const del = useDeleteBuilder();
  const builders = data?.data ?? [];
  const pagination = data?.pagination;
  const activeFilters = [status, tier].filter((f) => f !== ALL).length;

  const openEdit = (b: Builder) => {
    setEditing(b);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Builders" description="Manage developer and promoter partners across MPF projects.">
        {can('builders.create') && (
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" /> Add builder
          </Button>
        )}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search builders…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="blacklisted">Blacklisted</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tier} onValueChange={setTier}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Tier" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All tiers</SelectItem>
            <SelectItem value="a">Tier A</SelectItem>
            <SelectItem value="b">Tier B</SelectItem>
            <SelectItem value="c">Tier C</SelectItem>
          </SelectContent>
        </Select>
        {activeFilters > 0 && (
          <Button variant="ghost" size="sm" onClick={() => { setStatus(ALL); setTier(ALL); }}>
            <X className="h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44" />)}
        </div>
      ) : builders.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No builders yet"
          description={search || activeFilters ? 'Try adjusting your filters.' : 'Add your first builder partner to get started.'}
          action={can('builders.create') && <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Add builder</Button>}
        />
      ) : (
        <>
          <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${isFetching ? 'opacity-70' : ''}`}>
            {builders.map((b, i) => (
              <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
                          {getInitials(b.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{b.name}</p>
                          {b.city && (
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" /> {b.city}
                            </p>
                          )}
                        </div>
                      </div>
                      {(can('builders.update') || can('builders.delete')) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {can('builders.update') && (
                              <DropdownMenuItem onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem>
                            )}
                            {can('builders.delete') && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => { if (confirm(`Delete ${b.name}?`)) del.mutate(b.id); }}
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Badge variant={BUILDER_TIER_META[b.tier]?.variant ?? 'secondary'}>{BUILDER_TIER_META[b.tier]?.label}</Badge>
                      <Badge variant={BUILDER_STATUS_META[b.status]?.variant ?? 'secondary'}>{BUILDER_STATUS_META[b.status]?.label}</Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Projects</p>
                        <p className="font-semibold">{b.projects_count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Contact</p>
                        <p className="truncate font-medium">{b.contact_person ?? '—'}</p>
                      </div>
                    </div>

                    {(b.phone || b.website) && (
                      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                        {b.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {b.phone}</span>}
                        {b.website && (
                          <a href={b.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary">
                            <Globe className="h-3 w-3" /> Website
                          </a>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          {pagination && <PaginationBar {...pagination} onPageChange={setPage} />}
        </>
      )}

      <BuilderFormDialog open={formOpen} onOpenChange={(v) => { setFormOpen(v); if (!v) setEditing(null); }} builder={editing} />
    </div>
  );
}
