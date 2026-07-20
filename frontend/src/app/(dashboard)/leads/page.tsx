'use client';

import * as React from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Users,
  LayoutGrid,
  List,
  ArrowUpDown,
  Trash2,
  UserCheck,
  X,
  Download,
  Filter,
  SlidersHorizontal,
  Check,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { LeadFormDialog } from '@/components/leads/lead-form-dialog';
import { LeadsKanban } from '@/components/leads/leads-kanban';
import { LeadsTable } from '@/components/leads/leads-table';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { AppleSpinner } from '@/components/ui/apple-spinner';
import { MpfLeadsPanel } from '@/components/leads/lead-source-boxes';
import { useLeads, useBulkLeads, type LeadFilters } from '@/hooks/use-leads';
import { useDashboardOverview } from '@/hooks/use-dashboard';
import { useAssignableUsers } from '@/hooks/use-users';
import { useAuthStore } from '@/lib/auth-store';
import { LEAD_SOURCE_META, LEAD_STATUS_META, LEAD_STATUS_ORDER } from '@/lib/constants';

function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

const ALL = 'all';

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'created_at', label: 'Date created' },
  { value: 'updated_at', label: 'Last updated' },
  { value: 'name', label: 'Name' },
  { value: 'score', label: 'Score' },
];

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High', color: 'bg-red-500' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-500' },
  { value: 'low', label: 'Low', color: 'bg-green-500' },
];

export default function LeadsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const can = useAuthStore((s) => s.can);

  const [view, setView] = React.useState<'grid' | 'kanban'>('grid');
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounced(search);
  const [status, setStatus] = React.useState<string>(ALL);
  const [source, setSource] = React.useState<string>(ALL);
  const [priority, setPriority] = React.useState<string>(ALL);
  const [sortBy, setSortBy] = React.useState('created_at');
  const [order, setOrder] = React.useState<'asc' | 'desc'>('desc');
  const [page, setPage] = React.useState(1);
  const [mpfOpen, setMpfOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<number[]>([]);
  const [formOpen, setFormOpen] = React.useState(false);

  React.useEffect(() => {
    if (params.get('new') === '1') {
      setFormOpen(true);
      router.replace('/leads');
    }
  }, [params, router]);

  React.useEffect(() => setPage(1), [debouncedSearch, status, source, priority]);

  const filters: LeadFilters = {
    page: view === 'kanban' ? 1 : page,
    pageSize: view === 'kanban' ? 100 : 12,
    search: debouncedSearch || undefined,
    status: status !== ALL ? status : undefined,
    source: source !== ALL ? source : undefined,
    priority: priority !== ALL ? priority : undefined,
    sortBy,
    order,
  };

  const { data, isLoading, isFetching } = useLeads(filters);
  const { data: overview } = useDashboardOverview();
  const bulk = useBulkLeads();
  const { data: users } = useAssignableUsers();

  const leads = data?.data ?? [];
  const pagination = data?.pagination;
  const activeFilters = [status, source, priority].filter((f) => f !== ALL).length;

  const sourceCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const row of overview?.sources ?? []) {
      counts[row.source] = Number(row.count);
    }
    return counts;
  }, [overview?.sources]);

  const mpfCount = sourceCounts['my_property_fact'] ?? 0;

  const handleMpfToggle = () => {
    setMpfOpen((v) => !v);
    if (!mpfOpen) {
      setSource(ALL);
      setPage(1);
    }
  };

  const toggleOne = (id: number) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const toggleAll = (ids: number[]) =>
    setSelected((s) => (ids.every((id) => s.includes(id)) ? s.filter((id) => !ids.includes(id)) : Array.from(new Set([...s, ...ids]))));

  const runBulk = async (payload: { action: string; assignedTo?: number | null; status?: string }) => {
    await bulk.mutateAsync({ ids: selected, ...payload });
    setSelected([]);
  };

  const clearFilters = () => {
    setStatus(ALL);
    setSource(ALL);
    setPriority(ALL);
    setSearch('');
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">Leads</h1>
          <span className="text-sm text-muted-foreground">All Leads</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => import('sonner').then(({ toast }) => toast.info('Export runs in a later phase.'))}>
            <Download className="h-4 w-4" /> Export
          </Button>
          {can('leads.create') && (
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> Create Lead
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9"
          />
        </div>

        {/* Filter popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Filter className="h-4 w-4" /> Filter
              {activeFilters > 0 && (
                <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                  {activeFilters}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-0">
            <div className="max-h-[70vh] overflow-y-auto p-3">
              <FilterGroup label="Status">
                {LEAD_STATUS_ORDER.map((s) => (
                  <FilterOption
                    key={s}
                    active={status === s}
                    onClick={() => setStatus(status === s ? ALL : s)}
                    dot={
                      LEAD_STATUS_META[s].variant === 'success'
                        ? 'bg-green-500'
                        : LEAD_STATUS_META[s].variant === 'warning'
                          ? 'bg-amber-500'
                          : LEAD_STATUS_META[s].variant === 'destructive'
                            ? 'bg-red-500'
                            : 'bg-blue-500'
                    }
                  >
                    {LEAD_STATUS_META[s].label}
                  </FilterOption>
                ))}
              </FilterGroup>

              <FilterGroup label="Source">
                {Object.entries(LEAD_SOURCE_META).map(([k, m]) => (
                  <FilterOption
                    key={k}
                    active={source === k}
                    onClick={() => setSource(source === k ? ALL : k)}
                  >
                    {m.label}
                  </FilterOption>
                ))}
              </FilterGroup>

              <FilterGroup label="Priority">
                {PRIORITY_OPTIONS.map((p) => (
                  <FilterOption
                    key={p.value}
                    active={priority === p.value}
                    onClick={() => setPriority(priority === p.value ? ALL : p.value)}
                    dot={p.color}
                  >
                    {p.label}
                  </FilterOption>
                ))}
              </FilterGroup>
            </div>
            {activeFilters > 0 && (
              <div className="border-t p-2">
                <Button variant="ghost" size="sm" className="w-full" onClick={clearFilters}>
                  <X className="h-4 w-4" /> Clear all filters
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Sort popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <SlidersHorizontal className="h-4 w-4" /> Sort
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-3">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sort by
            </p>
            <div className="space-y-0.5">
              {SORT_OPTIONS.map((o) => (
                <FilterOption key={o.value} active={sortBy === o.value} onClick={() => setSortBy(o.value)}>
                  {o.label}
                </FilterOption>
              ))}
            </div>
            <div className="mt-3 border-t pt-3">
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Order
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  variant={order === 'desc' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setOrder('desc')}
                >
                  Newest
                </Button>
                <Button
                  variant={order === 'asc' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setOrder('asc')}
                >
                  Oldest
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {activeFilters > 0 && (
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={clearFilters}>
            <X className="h-4 w-4" /> Clear
          </Button>
        )}

        <div className="ml-auto flex items-center rounded-lg border p-0.5">
          <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-2" onClick={() => setView('grid')}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant={view === 'kanban' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-2" onClick={() => setView('kanban')}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex min-h-0 flex-1 gap-4">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
          {mpfOpen && (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <Button variant="ghost" size="sm" className="w-fit gap-1.5 text-muted-foreground" onClick={handleMpfToggle}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <MpfLeadsPanel totalCount={mpfCount} canSync={can('leads.import')} />
            </div>
          )}

          {!mpfOpen && source === ALL && view === 'grid' && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <MpfFeatureBox count={mpfCount} onOpen={handleMpfToggle} />
            </div>
          )}

          {!mpfOpen && !(source === ALL && view === 'grid') && (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex shrink-0 items-center justify-between pt-2">
            <h2 className="text-base font-semibold">
              {source !== ALL ? LEAD_SOURCE_META[source as keyof typeof LEAD_SOURCE_META]?.label ?? 'Leads' : 'All Leads'}
            </h2>
            <span className="text-sm text-muted-foreground">
              {pagination?.total ?? 0} total
            </span>
          </div>

          {/* Bulk action bar */}
          {selected.length > 0 && (
            <Card className="mb-3 flex flex-wrap items-center gap-2 border-primary/30 bg-primary/[0.04] p-2">
              <span className="px-2 text-sm font-medium">{selected.length} selected</span>
              {can('leads.assign') && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <UserCheck className="h-4 w-4" /> Assign
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {(users ?? []).map((u) => (
                      <DropdownMenuItem key={u.id} onClick={() => runBulk({ action: 'assign', assignedTo: u.id })}>
                        {u.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {can('leads.update') && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <ArrowUpDown className="h-4 w-4" /> Set status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {LEAD_STATUS_ORDER.map((s) => (
                      <DropdownMenuItem key={s} onClick={() => runBulk({ action: 'status', status: s })}>
                        {LEAD_STATUS_META[s].label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {can('leads.delete') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => {
                    if (confirm(`Delete ${selected.length} lead(s)? This cannot be undone.`)) runBulk({ action: 'delete' });
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              )}
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setSelected([])}>
                Cancel
              </Button>
            </Card>
          )}

          {/* Content */}
          <div className="relative flex min-h-0 flex-1 flex-col">
          {isFetching && !isLoading && view === 'grid' && leads.length > 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 backdrop-blur-sm">
              <div className="flex items-center gap-2 rounded-full border bg-background/90 px-4 py-2 shadow-md">
                <AppleSpinner size={20} className="text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Loading…</span>
              </div>
            </div>
          )}
          {view === 'kanban' ? (
            <LeadsKanban leads={leads} loading={isLoading} />
          ) : !isLoading && leads.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No leads found"
              description={activeFilters > 0 || search ? 'Try adjusting your filters or search.' : 'Get started by creating your first lead.'}
              action={
                can('leads.create') && (
                  <Button onClick={() => setFormOpen(true)}>
                    <Plus className="h-4 w-4" /> New lead
                  </Button>
                )
              }
            />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <LeadsTable
                leads={leads}
                loading={isLoading}
                selected={selected}
                onToggle={toggleOne}
                onToggleAll={toggleAll}
                showSource
                fillHeight
              />
              <div className="flex shrink-0 items-center justify-between px-1">
                <span className="text-sm text-muted-foreground">
                  Total Records <span className="font-medium text-foreground">{pagination?.total ?? 0}</span>
                </span>
                {(pagination?.totalPages ?? 1) > 1 && (
                  <PaginationBar
                    page={page}
                    pageSize={filters.pageSize ?? 12}
                    total={pagination?.total ?? 0}
                    totalPages={pagination?.totalPages ?? 1}
                    onPageChange={setPage}
                  />
                )}
              </div>
            </div>
          )}
          </div>
            </div>
          )}
        </div>
      </div>

      <LeadFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}

function MpfFeatureBox({ count, onOpen }: { count: number; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="block text-left">
      <Card className="group flex aspect-square flex-col items-center justify-center gap-3 overflow-hidden border-orange-200/80 bg-gradient-to-br from-orange-50 to-background p-5 text-center transition-all hover:shadow-lg dark:border-orange-900/50 dark:from-orange-950/25">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-900 p-2.5 shadow-md dark:bg-slate-950">
          <Image
            src="/images/mpf-logo.png"
            alt="My Property Fact"
            width={80}
            height={80}
            className="h-full w-full object-contain"
          />
        </div>
        <div>
          <p className="text-base font-semibold leading-tight tracking-tight">My Property Fact</p>
          <p className="mt-1 text-xs text-muted-foreground">{count} enquiries</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors group-hover:bg-orange-600">
          View leads <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </Card>
    </button>
  );
}
function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b py-2 last:border-0">
      <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function FilterOption({
  active,
  onClick,
  dot,
  children,
}: {
  active: boolean;
  onClick: () => void;
  dot?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent ${active ? 'bg-primary/10 text-primary' : ''}`}
    >
      {dot && <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />}
      <span className="flex-1 truncate">{children}</span>
      {active && <Check className="h-3.5 w-3.5 shrink-0" />}
    </button>
  );
}