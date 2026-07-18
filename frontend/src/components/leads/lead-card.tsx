'use client';

import Link from 'next/link';
import { Mail, Phone, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge } from '@/components/leads/lead-badges';
import { LEAD_SOURCE_META } from '@/lib/constants';
import { getInitials } from '@/lib/utils';
import type { Lead } from '@/types';

interface LeadCardProps {
  lead: Lead;
  selected?: boolean;
  onToggle?: (id: number) => void;
  showSource?: boolean;
}

export function LeadCard({ lead, selected, onToggle, showSource = true }: LeadCardProps) {
  return (
    <Card className="group relative overflow-hidden transition-all hover:border-primary/30 hover:shadow-md">
      {onToggle && (
        <div className="absolute right-3 top-3 z-10">
          <Checkbox checked={selected} onCheckedChange={() => onToggle(lead.id)} aria-label={`Select ${lead.name}`} />
        </div>
      )}
      <Link href={`/leads/${lead.id}`} className="block p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {getInitials(lead.name)}
          </div>
          <div className="min-w-0 flex-1 pr-6">
            <p className="truncate font-medium group-hover:text-primary">{lead.name}</p>
            {lead.builder_name && (
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                <Building2 className="h-3 w-3 shrink-0" />
                {lead.builder_name}
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          {lead.phone && (
            <p className="flex items-center gap-2 truncate">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              {lead.phone}
            </p>
          )}
          {lead.email && (
            <p className="flex items-center gap-2 truncate">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              {lead.email}
            </p>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={lead.status} />
          {showSource && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {LEAD_SOURCE_META[lead.source]?.label ?? lead.source}
            </span>
          )}
        </div>

        {(lead.campaign || lead.city) && (
          <p className="mt-2 truncate text-xs text-muted-foreground">
            {lead.campaign || lead.city}
          </p>
        )}
      </Link>
    </Card>
  );
}
