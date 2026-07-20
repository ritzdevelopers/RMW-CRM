'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Sparkles, SlidersHorizontal, Check, ChevronDown, Eye, MoreHorizontal, Copy } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/leads/lead-badges';
import { LEAD_SOURCE_META, LEAD_STATUS_META } from '@/lib/constants';
import { isNewLead, cn } from '@/lib/utils';
import type { Lead } from '@/types';

interface LeadsTableProps {
  leads: Lead[];
  loading?: boolean;
  selected?: number[];
  onToggle?: (id: number) => void;
  onToggleAll?: (ids: number[]) => void;
  showSource?: boolean;
  fillHeight?: boolean;
}

type ColumnKey = 'company' | 'email' | 'phone' | 'source' | 'status';

const cellDivider = 'border-r border-border/60';

export function LeadsTable({
  leads,
  loading,
  selected = [],
  onToggle,
  onToggleAll,
  showSource = true,
  fillHeight = false,
}: LeadsTableProps) {
  const router = useRouter();
  const selectable = Boolean(onToggle);

  const [cols, setCols] = React.useState<Record<ColumnKey, boolean>>({
    company: true,
    email: true,
    phone: true,
    source: true,
    status: true,
  });

  const columnDefs: { key: ColumnKey; label: string; available: boolean }[] = [
    { key: 'company', label: 'Company', available: true },
    { key: 'email', label: 'Email', available: true },
    { key: 'phone', label: 'Phone', available: true },
    { key: 'source', label: 'Lead Source', available: showSource },
    { key: 'status', label: 'Status', available: true },
  ];

  const visible = (k: ColumnKey) => cols[k] && columnDefs.find((c) => c.key === k)?.available;

  const allIds = React.useMemo(() => leads.map((l) => l.id), [leads]);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.includes(id));
  const someSelected = allIds.some((id) => selected.includes(id));

  const visibleCount = columnDefs.filter((c) => visible(c.key)).length;
  const colSpan = 1 + (selectable ? 1 : 0) + visibleCount + 1;

  const copy = (text?: string | null) => {
    if (text) navigator.clipboard?.writeText(text);
  };

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border bg-card',
        fillHeight && 'flex min-h-0 flex-1 flex-col',
      )}
    >
      <Table wrapperClassName={fillHeight ? 'h-full' : undefined}>
        <TableHeader className="sticky top-0 z-10">
          <TableRow className="bg-muted hover:bg-muted">
            {selectable && (
              <TableHead className={cn('w-10', cellDivider)}>
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={() => onToggleAll?.(allIds)}
                  aria-label="Select all leads"
                />
              </TableHead>
            )}
            <TableHead className={cn('normal-case text-foreground', cellDivider)}>
              <span className="inline-flex items-center gap-1.5">
                Lead Name
                <span className="inline-flex items-center gap-0.5 rounded px-1 text-[11px] font-normal text-muted-foreground">
                  All <ChevronDown className="h-3 w-3" />
                </span>
              </span>
            </TableHead>
            {visible('company') && <TableHead className={cn('normal-case text-foreground', cellDivider)}>Company</TableHead>}
            {visible('email') && <TableHead className={cn('normal-case text-foreground', cellDivider)}>Email</TableHead>}
            {visible('phone') && <TableHead className={cn('normal-case text-foreground', cellDivider)}>Phone</TableHead>}
            {visible('source') && <TableHead className={cn('normal-case text-foreground', cellDivider)}>Lead Source</TableHead>}
            {visible('status') && <TableHead className={cn('normal-case text-foreground', cellDivider)}>Status</TableHead>}
            <TableHead className="w-10 text-right">
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="Manage columns"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel>Manage columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {columnDefs
                    .filter((c) => c.available)
                    .map((c) => (
                      <DropdownMenuItem
                        key={c.key}
                        onSelect={(e) => {
                          e.preventDefault();
                          setCols((prev) => ({ ...prev, [c.key]: !prev[c.key] }));
                        }}
                      >
                        <span className="flex h-4 w-4 items-center justify-center">
                          {cols[c.key] && <Check className="h-3.5 w-3.5" />}
                        </span>
                        {c.label}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            [...Array(8)].map((_, i) => (
              <TableRow key={i}>
                {selectable && <TableCell className={cellDivider}><Skeleton className="h-4 w-4 rounded" /></TableCell>}
                <TableCell className={cellDivider}><Skeleton className="h-4 w-36" /></TableCell>
                {visible('company') && <TableCell className={cellDivider}><Skeleton className="h-4 w-28" /></TableCell>}
                {visible('email') && <TableCell className={cellDivider}><Skeleton className="h-4 w-40" /></TableCell>}
                {visible('phone') && <TableCell className={cellDivider}><Skeleton className="h-4 w-24" /></TableCell>}
                {visible('source') && <TableCell className={cellDivider}><Skeleton className="h-4 w-20" /></TableCell>}
                {visible('status') && <TableCell className={cellDivider}><Skeleton className="h-4 w-16" /></TableCell>}
                <TableCell />
              </TableRow>
            ))
          ) : leads.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={colSpan} className="h-24 text-center text-sm text-muted-foreground">
                No leads found.
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => {
              const isNew = isNewLead(lead);
              const isSelected = selected.includes(lead.id);
              const statusDot = LEAD_STATUS_META[lead.status]?.dot ?? 'bg-muted-foreground';
              return (
                <TableRow
                  key={lead.id}
                  data-state={isSelected ? 'selected' : undefined}
                  className="group cursor-pointer"
                  onClick={() => router.push(`/leads/${lead.id}`)}
                >
                  {selectable && (
                    <TableCell className={cellDivider} onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggle?.(lead.id)}
                        aria-label={`Select ${lead.name}`}
                      />
                    </TableCell>
                  )}
                  <TableCell className={cellDivider}>
                    <div className="flex items-center gap-2">
                      <span className={cn('h-2 w-2 shrink-0 rounded-full', statusDot)} title={LEAD_STATUS_META[lead.status]?.label} />
                      <span className="font-medium text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400">
                        {lead.name}
                      </span>
                      {isNew && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          <Sparkles className="h-2.5 w-2.5" />
                          NEW
                        </span>
                      )}
                    </div>
                  </TableCell>
                  {visible('company') && (
                    <TableCell className={cn('text-muted-foreground', cellDivider)}>
                      <span className="block max-w-[180px] truncate">{lead.builder_name || lead.campaign || '—'}</span>
                    </TableCell>
                  )}
                  {visible('email') && (
                    <TableCell className={cn('text-muted-foreground', cellDivider)}>
                      <span className="block max-w-[220px] truncate">{lead.email || '—'}</span>
                    </TableCell>
                  )}
                  {visible('phone') && (
                    <TableCell className={cellDivider}>
                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-foreground hover:text-orange-600"
                        >
                          {lead.phone}
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}
                  {visible('source') && (
                    <TableCell className={cn('text-foreground', cellDivider)}>
                      {LEAD_SOURCE_META[lead.source]?.label ?? lead.source}
                    </TableCell>
                  )}
                  {visible('status') && (
                    <TableCell className={cellDivider}>
                      <StatusBadge status={lead.status} />
                    </TableCell>
                  )}
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100 data-[state=open]:opacity-100"
                        aria-label="Lead actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onSelect={() => router.push(`/leads/${lead.id}`)}>
                          <Eye className="h-4 w-4" /> View details
                        </DropdownMenuItem>
                        {lead.phone && (
                          <DropdownMenuItem onSelect={() => copy(lead.phone)}>
                            <Copy className="h-4 w-4" /> Copy phone
                          </DropdownMenuItem>
                        )}
                        {lead.email && (
                          <DropdownMenuItem onSelect={() => copy(lead.email)}>
                            <Copy className="h-4 w-4" /> Copy email
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
