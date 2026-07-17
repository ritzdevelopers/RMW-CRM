'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Phone, IndianRupee } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { PriorityBadge } from './lead-badges';
import { LEAD_STATUS_META, LEAD_STATUS_ORDER } from '@/lib/constants';
import { formatCurrency, getInitials } from '@/lib/utils';
import type { Lead } from '@/types';

export function LeadsKanban({ leads, loading }: { leads: Lead[]; loading?: boolean }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
      {LEAD_STATUS_ORDER.map((status) => {
        const columnLeads = leads.filter((l) => l.status === status);
        const meta = LEAD_STATUS_META[status];
        return (
          <div key={status} className="flex w-72 shrink-0 flex-col">
            <div className="mb-3 flex items-center gap-2 px-1">
              <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
              <span className="text-sm font-semibold">{meta.label}</span>
              <span className="ml-auto rounded-full bg-muted px-2 text-xs text-muted-foreground">
                {columnLeads.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {loading
                ? [...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
                : columnLeads.map((lead, i) => (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <Link href={`/leads/${lead.id}`}>
                        <Card className="cursor-pointer p-3 transition-shadow hover:shadow-md">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium leading-tight">{lead.name}</p>
                            <PriorityBadge priority={lead.priority} />
                          </div>
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" /> {lead.phone}
                          </p>
                          {lead.expected_value ? (
                            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-500">
                              <IndianRupee className="h-3 w-3" />
                              {formatCurrency(Number(lead.expected_value), true).replace('₹', '')}
                            </p>
                          ) : null}
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">{lead.city ?? '—'}</span>
                            {lead.assignee_name && (
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[9px]">{getInitials(lead.assignee_name)}</AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
              {!loading && columnLeads.length === 0 && (
                <div className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
                  No leads
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
