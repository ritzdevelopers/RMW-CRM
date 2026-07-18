'use client';

import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { LeadCard } from '@/components/leads/lead-card';
import type { Lead } from '@/types';

interface LeadsGridBoxProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  headerClassName?: string;
  leads: Lead[];
  total: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  headerAction?: React.ReactNode;
  selected?: number[];
  onToggle?: (id: number) => void;
  onPageChange?: (page: number) => void;
  showSource?: boolean;
}

export function LeadsGridBox({
  title,
  description,
  icon: Icon,
  iconClassName = 'bg-primary text-primary-foreground',
  headerClassName = '',
  leads,
  total,
  page,
  pageSize,
  loading,
  emptyTitle = 'No leads found',
  emptyDescription = 'Leads will appear here once available.',
  headerAction,
  selected = [],
  onToggle,
  onPageChange,
  showSource = true,
}: LeadsGridBoxProps) {
  const pagination = {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };

  return (
    <Card className={headerClassName}>
      {(title || description || headerAction || Icon) && (
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4">
          <div className="space-y-1">
            {(title || Icon) && (
              <div className="flex items-center gap-2">
                {Icon && (
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconClassName}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                )}
                <div>
                  {title && <CardTitle className="text-lg">{title}</CardTitle>}
                  {description && <CardDescription>{description}</CardDescription>}
                </div>
              </div>
            )}
          </div>
          {headerAction}
        </CardHeader>
      )}
      <CardContent className={!(title || description || headerAction || Icon) ? 'pt-6' : undefined}>
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-background/60 px-6 py-10 text-center">
            <p className="text-sm font-medium">{emptyTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  selected={selected.includes(lead.id)}
                  onToggle={onToggle}
                  showSource={showSource}
                />
              ))}
            </div>
            {onPageChange && pagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t pt-3">
                <span className="text-sm text-muted-foreground">Total {total} leads</span>
                <PaginationBar {...pagination} onPageChange={onPageChange} />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
