'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Building2,
  IndianRupee,
  CalendarClock,
  Pencil,
  Trash2,
  UserCheck,
  Plus,
  StickyNote,
  PhoneCall,
  Users2,
  Home,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge, PriorityBadge } from '@/components/leads/lead-badges';
import { LeadFormDialog } from '@/components/leads/lead-form-dialog';
import {
  useLead,
  useChangeLeadStatus,
  useAssignLead,
  useAddActivity,
  useDeleteLead,
} from '@/hooks/use-leads';
import { useAssignableUsers } from '@/hooks/use-users';
import { useAuthStore } from '@/lib/auth-store';
import { LEAD_STATUS_META, LEAD_STATUS_ORDER, LEAD_SOURCE_META } from '@/lib/constants';
import { formatCurrency, getInitials } from '@/lib/utils';

const ACTIVITY_ICON: Record<string, any> = {
  note: StickyNote,
  call: PhoneCall,
  email: Mail,
  meeting: Users2,
  site_visit: Home,
  whatsapp: MessageSquare,
  sms: MessageSquare,
  status_change: CalendarClock,
  assignment: UserCheck,
  created: Plus,
  follow_up: CalendarClock,
};

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const leadId = Number(id);
  const router = useRouter();
  const can = useAuthStore((s) => s.can);

  const { data: lead, isLoading } = useLead(leadId);
  const changeStatus = useChangeLeadStatus(leadId);
  const assign = useAssignLead(leadId);
  const addActivity = useAddActivity(leadId);
  const deleteLead = useDeleteLead();
  const { data: users } = useAssignableUsers();

  const [editOpen, setEditOpen] = React.useState(false);
  const [activityType, setActivityType] = React.useState('note');
  const [activityBody, setActivityBody] = React.useState('');

  if (isLoading) return <DetailSkeleton />;
  if (!lead) return null;

  const submitActivity = async () => {
    if (!activityBody.trim()) return;
    await addActivity.mutateAsync({ type: activityType, body: activityBody.trim() });
    setActivityBody('');
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link href="/leads">
          <ArrowLeft className="h-4 w-4" /> Back to leads
        </Link>
      </Button>

      <PageHeader title={lead.name} description={`Lead #${lead.id} · Added ${formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}`}>
        {can('leads.update') && (
          <Select value={lead.status} onValueChange={(v) => changeStatus.mutate({ status: v })}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LEAD_STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>{LEAD_STATUS_META[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {can('leads.assign') && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline"><UserCheck className="h-4 w-4" /> Assign</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => assign.mutate(null)}>Unassign</DropdownMenuItem>
              {(users ?? []).map((u) => (
                <DropdownMenuItem key={u.id} onClick={() => assign.mutate(u.id)}>{u.name}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {can('leads.update') && (
          <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil className="h-4 w-4" /> Edit</Button>
        )}
        {can('leads.delete') && (
          <Button
            variant="outline"
            size="icon"
            className="text-destructive"
            onClick={() => {
              if (!confirm('Delete this lead permanently?')) return;
              deleteLead.mutateAsync(leadId).then(() => router.push('/leads'));
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: details */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Lead details</CardTitle>
              <div className="flex gap-1.5">
                <StatusBadge status={lead.status} />
                <PriorityBadge priority={lead.priority} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailRow icon={Phone} label="Phone" value={lead.phone} />
              {lead.email && <DetailRow icon={Mail} label="Email" value={lead.email} />}
              {lead.city && <DetailRow icon={MapPin} label="City" value={lead.city} />}
              {lead.property_type && <DetailRow icon={Home} label="Property type" value={lead.property_type} />}
              {lead.builder_name && <DetailRow icon={Building2} label="Builder" value={lead.builder_name} />}
              {(lead.budget_min || lead.budget_max) && (
                <DetailRow
                  icon={IndianRupee}
                  label="Budget"
                  value={`${lead.budget_min ? formatCurrency(Number(lead.budget_min), true) : '—'} – ${lead.budget_max ? formatCurrency(Number(lead.budget_max), true) : '—'}`}
                />
              )}
              {lead.expected_value ? <DetailRow icon={IndianRupee} label="Expected value" value={formatCurrency(Number(lead.expected_value))} /> : null}
              <DetailRow icon={CalendarClock} label="Source" value={LEAD_SOURCE_META[lead.source]?.label ?? lead.source} />
              {lead.next_follow_up_at && (
                <DetailRow icon={CalendarClock} label="Next follow-up" value={format(new Date(lead.next_follow_up_at), 'PPp')} />
              )}
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Assigned to</span>
                {lead.assignee_name ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6"><AvatarFallback className="text-[10px]">{getInitials(lead.assignee_name)}</AvatarFallback></Avatar>
                    <span className="text-sm font-medium">{lead.assignee_name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Unassigned</span>
                )}
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Lead score</span>
                  <span className="font-medium">{lead.score}/100</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${lead.score}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {lead.notes && (
            <Card>
              <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
              <CardContent><p className="whitespace-pre-wrap text-sm text-muted-foreground">{lead.notes}</p></CardContent>
            </Card>
          )}
        </div>

        {/* Right: activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Activity timeline</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {can('leads.update') && (
                <div className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Select value={activityType} onValueChange={setActivityType}>
                      <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['note', 'call', 'email', 'whatsapp', 'meeting', 'site_visit', 'follow_up'].map((t) => (
                          <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    rows={2}
                    placeholder="Log a call, add a note, record a site visit…"
                    value={activityBody}
                    onChange={(e) => setActivityBody(e.target.value)}
                  />
                  <div className="mt-2 flex justify-end">
                    <Button size="sm" onClick={submitActivity} disabled={addActivity.isPending || !activityBody.trim()}>
                      {addActivity.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Log activity
                    </Button>
                  </div>
                </div>
              )}

              <div className="relative space-y-5 pl-2">
                {(lead.activities ?? []).length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No activity yet.</p>
                ) : (
                  (lead.activities ?? []).map((a, i, arr) => {
                    const Icon = ACTIVITY_ICON[a.type] ?? StickyNote;
                    return (
                      <div key={a.id} className="relative flex gap-3">
                        {i < arr.length - 1 && <span className="absolute left-[15px] top-8 h-full w-px bg-border" />}
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 pb-1">
                          <div className="flex flex-wrap items-center gap-x-2">
                            <span className="text-sm font-medium">{a.title ?? a.type.replace('_', ' ')}</span>
                            {a.user_name && <span className="text-xs text-muted-foreground">by {a.user_name}</span>}
                            <span className="text-xs text-muted-foreground/70">· {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
                          </div>
                          {a.body && <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground">{a.body}</p>}
                          {a.meta_json?.from && a.meta_json?.to && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {LEAD_STATUS_META[a.meta_json.from as keyof typeof LEAD_STATUS_META]?.label ?? a.meta_json.from} →{' '}
                              {LEAD_STATUS_META[a.meta_json.to as keyof typeof LEAD_STATUS_META]?.label ?? a.meta_json.to}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <LeadFormDialog open={editOpen} onOpenChange={setEditOpen} lead={lead} />
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-96 lg:col-span-1" />
        <Skeleton className="h-96 lg:col-span-2" />
      </div>
    </div>
  );
}
