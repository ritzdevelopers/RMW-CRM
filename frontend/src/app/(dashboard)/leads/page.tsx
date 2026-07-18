'use client';

import * as React from 'react';
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
  ChevronDown,
} from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LeadFormDialog } from '@/components/leads/lead-form-dialog';
import { LeadsKanban } from '@/components/leads/leads-kanban';
import { LeadsGridBox } from '@/components/leads/leads-grid-box';
import { LeadSourceBoxes, ALL_SOURCES } from '@/components/leads/lead-source-boxes';
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

  const activeSourceBox = source !== ALL ? source : ALL_SOURCES;
  const handleSourceBoxChange = (next: string) => {
    setMpfOpen(false);
    setSource(next === ALL_SOURCES ? ALL : next);
    setPage(1);
  };

  const handleMpfToggle = () => {
    setMpfOpen((v) => !v);
    if (!mpfOpen) {
      setSource(ALL);
      setPage(1);
    }
  };

  const toggleOne = (id: number) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

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
    <div className="space-y-4">
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
      <div className="flex items-center gap-2 border-b pb-3">
        <Button variant="outline" size="sm" className="gap-1.5">
          <Filter className="h-4 w-4" /> Filter
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5">
          <SlidersHorizontal className="h-4 w-4" /> Sort
        </Button>
        <div className="ml-auto flex items-center rounded-lg border p-0.5">
          <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-2" onClick={() => setView('grid')}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant={view === 'kanban' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-2" onClick={() => setView('kanban')}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main content with sidebar */}
      <div className="flex gap-4">
        {/* Filter Sidebar */}
        <div className="hidden w-64 shrink-0 lg:block">
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold">Filter Leads by</h3>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9"
              />
            </div>

            <div className="space-y-1">
              <FilterSidebarItem 
                label="Status" 
                count={LEAD_STATUS_ORDER.length}
                active={status !== ALL}
                onClick={() => {}}
              >
                <div className="space-y-1 py-2">
                  {LEAD_STATUS_ORDER.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(status === s ? ALL : s)}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent ${status === s ? 'bg-primary/10 text-primary' : ''}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${LEAD_STATUS_META[s].variant === 'success' ? 'bg-green-500' : LEAD_STATUS_META[s].variant === 'warning' ? 'bg-amber-500' : LEAD_STATUS_META[s].variant === 'destructive' ? 'bg-red-500' : 'bg-blue-500'}`} />
                      {LEAD_STATUS_META[s].label}
                    </button>
                  ))}
                </div>
              </FilterSidebarItem>

              <FilterSidebarItem 
                label="Source" 
                count={Object.keys(LEAD_SOURCE_META).length}
                active={source !== ALL}
                onClick={() => {}}
              >
                <div className="space-y-1 py-2">
                  {Object.entries(LEAD_SOURCE_META).map(([k, m]) => (
                    <button
                      key={k}
                      onClick={() => setSource(source === k ? ALL : k)}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent ${source === k ? 'bg-primary/10 text-primary' : ''}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </FilterSidebarItem>

              <FilterSidebarItem 
                label="Priority" 
                count={3}
                active={priority !== ALL}
                onClick={() => {}}
              >
                <div className="space-y-1 py-2">
                  {[{ value: 'high', label: 'High', color: 'bg-red-500' }, { value: 'medium', label: 'Medium', color: 'bg-amber-500' }, { value: 'low', label: 'Low', color: 'bg-green-500' }].map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPriority(priority === p.value ? ALL : p.value)}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent ${priority === p.value ? 'bg-primary/10 text-primary' : ''}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${p.color}`} />
                      {p.label}
                    </button>
                  ))}
                </div>
              </FilterSidebarItem>
            </div>

            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" className="mt-4 w-full" onClick={clearFilters}>
                <X className="h-4 w-4" /> Clear all filters
              </Button>
            )}
          </Card>
        </div>

        {/* Table/Content area */}
        <div className="min-w-0 flex-1 space-y-4">
          <LeadSourceBoxes
            counts={sourceCounts}
            total={overview?.stats?.totalLeads ?? pagination?.total ?? 0}
            activeSource={activeSourceBox}
            mpfOpen={mpfOpen}
            onSourceChange={handleSourceBoxChange}
            onMpfToggle={handleMpfToggle}
            canSync={can('leads.import')}
          />

          {!mpfOpen && (
            <>
          <div className="flex items-center justify-between pt-2">
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
          {view === 'kanban' ? (
            <LeadsKanban leads={leads} loading={isLoading} />
          ) : isLoading ? (
            <GridSkeleton />
          ) : leads.length === 0 ? (
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
            <div className={isFetching ? 'opacity-70 transition-opacity' : 'transition-opacity'}>
              <LeadsGridBox
                title=""
                leads={leads}
                total={pagination?.total ?? 0}
                page={page}
                pageSize={filters.pageSize ?? 12}
                selected={selected}
                onToggle={toggleOne}
                onPageChange={setPage}
                showSource
              />
            </div>
          )}
            </>
          )}
        </div>
      </div>

      <LeadFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-36 w-full rounded-xl" />
      ))}
    </div>
  );
}
function FilterSidebarItem({
  label,
  count,
  active,
  children,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border-b last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between py-2.5 text-left text-sm hover:text-primary ${active ? 'font-medium text-primary' : ''}`}
      >
        <span>{label}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && children}
    </div>
  );
}