'use client';

import Link from 'next/link';
import { Phone, Mail, Sparkles } from 'lucide-react';
import { StatusBadge } from '@/components/leads/lead-badges';
import { getInitials, isNewLead, cn } from '@/lib/utils';
import type { Lead } from '@/types';

export function LeadMiniCard({ lead }: { lead: Lead }) {
  const isNew = isNewLead(lead);

  return (
    <Link
      href={`/leads/${lead.id}`}
      className={cn(
        'group relative flex flex-col rounded-xl border bg-card p-3 shadow-sm transition-all hover:border-orange-300 hover:shadow-md dark:hover:border-orange-700',
        isNew &&
          'border-orange-400 bg-orange-50/60 ring-2 ring-orange-400/50 dark:border-orange-600 dark:bg-orange-950/25',
      )}
    >
      {isNew && (
        <span className="absolute -right-1.5 -top-1.5 z-10 flex items-center gap-1 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
          <Sparkles className="h-2.5 w-2.5" />
          NEW
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-orange-500/60" />
        </span>
      )}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-xs font-semibold text-orange-600 dark:text-orange-400">
          {getInitials(lead.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium group-hover:text-orange-600 dark:group-hover:text-orange-400">
            {lead.name}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {lead.campaign || lead.property_type || lead.city || 'MPF enquiry'}
          </p>
        </div>
      </div>

      <div className="mt-2.5 space-y-1 text-[11px] text-muted-foreground">
        {lead.phone && (
          <p className="flex items-center gap-1.5 truncate">
            <Phone className="h-3 w-3 shrink-0 opacity-60" />
            {lead.phone}
          </p>
        )}
        {lead.email && (
          <p className="flex items-center gap-1.5 truncate">
            <Mail className="h-3 w-3 shrink-0 opacity-60" />
            {lead.email}
          </p>
        )}
      </div>

      <div className="mt-2.5">
        <StatusBadge status={lead.status} />
      </div>
    </Link>
  );
}
