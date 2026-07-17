import { Badge } from '@/components/ui/badge';
import { LEAD_STATUS_META, PRIORITY_META } from '@/lib/constants';
import type { LeadStatus, Priority } from '@/types';

export function StatusBadge({ status }: { status: LeadStatus }) {
  const meta = LEAD_STATUS_META[status];
  return (
    <Badge variant={meta?.variant ?? 'secondary'} className="gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${meta?.dot ?? 'bg-muted-foreground'}`} />
      {meta?.label ?? status}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const meta = PRIORITY_META[priority];
  return <Badge variant={meta?.variant ?? 'secondary'}>{meta?.label ?? priority}</Badge>;
}
