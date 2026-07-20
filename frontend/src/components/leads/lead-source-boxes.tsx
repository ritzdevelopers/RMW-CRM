'use client';

import * as React from 'react';
import { Building2, Globe, Megaphone, Users, Upload, Footprints, PenLine, MoreHorizontal, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { LeadsTable } from '@/components/leads/leads-table';
import { LEAD_SOURCE_META } from '@/lib/constants';
import { useLeads, useSyncMpfEnquiries } from '@/hooks/use-leads';
import { isNewLead } from '@/lib/utils';
import type { LeadSource } from '@/types';

const SOURCE_ICONS: Partial<Record<LeadSource, typeof Globe>> = {
  my_property_fact: Building2,
  website: Globe,
  meta: Megaphone,
  google: Megaphone,
  referral: Users,
  walk_in: Footprints,
  manual: PenLine,
  import: Upload,
  other: MoreHorizontal,
};

const SOURCE_COLORS: Partial<Record<LeadSource, string>> = {
  my_property_fact: 'border-orange-200 bg-orange-50/80 dark:border-orange-900/50 dark:bg-orange-950/20',
  website: 'border-blue-200 bg-blue-50/80 dark:border-blue-900/50 dark:bg-blue-950/20',
  meta: 'border-indigo-200 bg-indigo-50/80 dark:border-indigo-900/50 dark:bg-indigo-950/20',
  google: 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/50 dark:bg-emerald-950/20',
  referral: 'border-violet-200 bg-violet-50/80 dark:border-violet-900/50 dark:bg-violet-950/20',
  walk_in: 'border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/20',
  manual: 'border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/20',
  import: 'border-cyan-200 bg-cyan-50/80 dark:border-cyan-900/50 dark:bg-cyan-950/20',
  other: 'border-border bg-muted/30',
};

export const ALL_SOURCES = 'all';
const MPF = 'my_property_fact';

interface LeadSourceBoxesProps {
  counts: Record<string, number>;
  total: number;
  activeSource: string;
  mpfOpen: boolean;
  onSourceChange: (source: string) => void;
  onMpfToggle: () => void;
  canSync?: boolean;
}

export function LeadSourceBoxes({
  counts,
  total,
  activeSource,
  mpfOpen,
  onSourceChange,
  onMpfToggle,
  canSync,
}: LeadSourceBoxesProps) {
  const sources = (Object.keys(LEAD_SOURCE_META) as LeadSource[]).filter((s) => s !== MPF);
  const mpfCount = counts[MPF] ?? 0;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <SourceBox
          label="All Leads"
          count={total}
          active={activeSource === ALL_SOURCES && !mpfOpen}
          onClick={() => onSourceChange(ALL_SOURCES)}
          className="border-primary/20 bg-primary/5"
        />

        <SourceBox
          label="My Property Fact"
          count={mpfCount}
          active={mpfOpen}
          onClick={onMpfToggle}
          icon={Building2}
          className={SOURCE_COLORS[MPF]}
        />

        {sources.map((source) => {
          const count = counts[source] ?? 0;
          if (count === 0) return null;
          const Icon = SOURCE_ICONS[source] ?? MoreHorizontal;
          return (
            <SourceBox
              key={source}
              label={LEAD_SOURCE_META[source].label}
              count={count}
              active={activeSource === source && !mpfOpen}
              onClick={() => onSourceChange(source)}
              icon={Icon}
              className={SOURCE_COLORS[source]}
            />
          );
        })}
      </div>

      {mpfOpen && <MpfLeadsPanel totalCount={mpfCount} canSync={canSync} />}
    </div>
  );
}

export function MpfLeadsPanel({ totalCount, canSync }: { totalCount: number; canSync?: boolean }) {
  const [page, setPage] = React.useState(1);
  const pageSize = 15;
  const mpfSync = useSyncMpfEnquiries();

  const { data, isLoading } = useLeads({
    page,
    pageSize,
    source: MPF,
    sortBy: 'created_at',
    order: 'desc',
  });

  const leads = data?.data ?? [];
  const newCount = React.useMemo(() => leads.filter((l) => isNewLead(l)).length, [leads]);
  const total = data?.pagination?.total ?? totalCount;
  const pagination = {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };

  return (
    <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-orange-200/80 bg-gradient-to-br from-orange-50/50 to-background dark:from-orange-950/15">
      <div className="flex shrink-0 items-center justify-between border-b border-orange-200/60 px-4 py-3 dark:border-orange-900/40">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">My Property Fact Leads</p>
            {newCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                {newCount} new
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{total} enquiries from mypropertyfact.in</p>
        </div>
        {canSync && (
          <Button
            variant="outline"
            size="sm"
            disabled={mpfSync.isPending}
            onClick={() => mpfSync.mutate()}
            className="border-orange-200 bg-background/80"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${mpfSync.isPending ? 'animate-spin' : ''}`} />
            Sync
          </Button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        {!isLoading && leads.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-background/60 px-6 py-12 text-center">
            <Building2 className="mx-auto h-8 w-8 text-orange-400/60" />
            <p className="mt-2 text-sm font-medium">No MPF leads yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Click Sync to import website enquiries</p>
          </div>
        ) : (
          <>
            <LeadsTable leads={leads} loading={isLoading} showSource={false} fillHeight />
            {pagination.totalPages > 1 && (
              <div className="mt-4 flex shrink-0 items-center justify-between border-t border-orange-200/40 pt-3 dark:border-orange-900/30">
                <span className="text-xs text-muted-foreground">
                  Total Records {pagination.total}
                </span>
                <PaginationBar {...pagination} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

function SourceBox({
  label,
  count,
  active,
  onClick,
  icon: Icon,
  className = '',
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  icon?: typeof Globe;
  className?: string;
}) {
  return (
    <button type="button" onClick={onClick} className="text-left">
      <Card
        className={`h-full p-4 transition-all hover:shadow-md ${className} ${
          active ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{count}</p>
          </div>
          {Icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/70">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
      </Card>
    </button>
  );
}
