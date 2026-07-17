'use client';

import * as React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCheck } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotifications, useMarkAllRead, useMarkRead } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';

const PRIORITY_VARIANT: Record<string, 'default' | 'secondary' | 'warning' | 'destructive'> = {
  low: 'secondary',
  normal: 'default',
  high: 'warning',
  urgent: 'destructive',
};

export default function NotificationsPage() {
  const [tab, setTab] = React.useState<'all' | 'unread'>('all');
  const { data, isLoading } = useNotifications(tab === 'unread');
  const markAll = useMarkAllRead();
  const markOne = useMarkRead();
  const items = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Stay on top of assignments, reminders, and updates.">
        <Button variant="outline" onClick={() => markAll.mutate()}>
          <CheckCheck className="h-4 w-4" /> Mark all read
        </Button>
      </PageHeader>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <Card className="divide-y">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </Card>
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
      ) : (
        <Card className="divide-y">
          {items.map((n) => {
            const inner = (
              <div className={cn('flex items-start gap-3 p-4 transition-colors hover:bg-accent/40', !n.read_at && 'bg-primary/[0.03]')}>
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Bell className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.priority !== 'normal' && (
                      <Badge variant={PRIORITY_VARIANT[n.priority] ?? 'secondary'} className="capitalize">{n.priority}</Badge>
                    )}
                    {!n.read_at && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-xs text-muted-foreground/70">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                </div>
              </div>
            );
            return (
              <div key={n.id} onClick={() => !n.read_at && markOne.mutate(n.id)} className="cursor-pointer">
                {n.link ? <Link href={n.link}>{inner}</Link> : inner}
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
