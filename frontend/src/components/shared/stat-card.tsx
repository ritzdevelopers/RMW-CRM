'use client';

import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  accent?: string; // tailwind text/bg color classes for the icon chip
  loading?: boolean;
  index?: number;
}

export function StatCard({ label, value, icon: Icon, hint, accent = 'bg-primary/10 text-primary', loading, index = 0 }: StatCardProps) {
  if (loading) {
    return (
      <Card className="p-5">
        <Skeleton className="mb-3 h-9 w-9 rounded-lg" />
        <Skeleton className="mb-2 h-7 w-24" />
        <Skeleton className="h-4 w-20" />
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="p-5 transition-colors hover:bg-muted/40">
        <div className={cn('mb-3 flex h-9 w-9 items-center justify-center rounded-lg', accent)}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        {hint && <p className="mt-2 text-xs text-muted-foreground/70">{hint}</p>}
      </Card>
    </motion.div>
  );
}
