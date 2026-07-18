'use client';

import Link from 'next/link';
import { Phone, Mail } from 'lucide-react';
import { StatusBadge } from '@/components/leads/lead-badges';
import { getInitials } from '@/lib/utils';
import type { Lead } from '@/types';

export function LeadMiniCard({ lead }: { lead: Lead }) {
  return (
    <Link
      href={`/leads/${lead.id}`}
      className="group flex flex-col rounded-xl border bg-card p-3 shadow-sm transition-all hover:border-orange-300 hover:shadow-md dark:hover:border-orange-700"
    >
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
