'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Users,
  Handshake,
  IndianRupee,
  CalendarCheck,
  CheckSquare,
  TrendingUp,
  Plus,
  Building2,
  ArrowRight,
  Activity,
  Phone,
  UserPlus,
  Settings2,
  Mail,
  Database,
  Plug,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { EmptyState } from '@/components/shared/empty-state';
import { useDashboardOverview, useTodaysTasks, useRecentActivities } from '@/hooks/use-dashboard';
import { useAuthStore } from '@/lib/auth-store';
import { formatCurrency, formatNumber, getInitials } from '@/lib/utils';
import { LEAD_STATUS_META, LEAD_STATUS_ORDER, LEAD_SOURCE_META } from '@/lib/constants';

const ZOHO_BLUE = '#1d7af3';
const SOURCE_COLORS = [ZOHO_BLUE, '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useDashboardOverview();
  const { data: tasks, isLoading: tasksLoading } = useTodaysTasks();
  const { data: activities, isLoading: actLoading } = useRecentActivities();

  const stats = data?.stats;

  const trendData = (data?.trend ?? []).map((t) => ({
    month: t.month.slice(5),
    leads: Number(t.leads),
    booked: Number(t.booked),
  }));

  const funnelData = LEAD_STATUS_ORDER.filter((s) => s !== 'lost').map((s) => ({
    status: LEAD_STATUS_META[s].label,
    count: Number(data?.funnel.find((f) => f.status === s)?.count ?? 0),
  }));

  const sourceData = (data?.sources ?? []).map((s) => ({
    name: LEAD_SOURCE_META[s.source]?.label ?? s.source,
    value: Number(s.count),
  }));

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome back, ${user?.name?.split(' ')[0] ?? ''}`} description="Here's what's happening across your pipeline today.">
        <Button asChild variant="outline">
          <Link href="/builders?new=1">
            <Building2 className="h-4 w-4" /> Add builder
          </Link>
        </Button>
        <Button asChild>
          <Link href="/leads?new=1">
            <Plus className="h-4 w-4" /> New lead
          </Link>
        </Button>
      </PageHeader>

      {/* Zoho-like onboarding block */}
      <Card className="overflow-hidden bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30">
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-12">
          {/* Left: Hello section with video */}
          <div className="relative p-6 lg:col-span-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Hello</p>
              <p className="text-xl font-semibold tracking-tight">{user?.name ?? 'There'} 👋</p>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              We&apos;re happy to bring you aboard the world&apos;s favorite CRM!
            </p>
            <p className="mt-4 text-sm font-medium">Let&apos;s get started!</p>
            
            <div className="mt-4 rounded-lg border bg-white/80 p-3">
              <p className="text-sm font-medium">Watch a one‑minute video</p>
              <p className="text-xs text-muted-foreground">View the key features we offer</p>
              <div className="mt-3 flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 py-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                  <svg className="h-5 w-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Middle: Setup items */}
          <div className="border-t p-6 lg:col-span-4 lg:border-l lg:border-t-0">
            <div className="mb-4">
              <p className="font-semibold">Set up your CRM</p>
              <p className="mt-1 text-xs text-muted-foreground">Make your CRM smarter and more interactive</p>
            </div>
            <div className="space-y-2">
              <SetupItem icon={UserPlus} title="Invite your team" href="/users" color="#e74c3c" />
              <SetupItem icon={Settings2} title="Configure deals pipeline" href="/leads" color="#3498db" />
              <SetupItem icon={Mail} title="Connect your email" href="/settings?tab=notifications" color="#9b59b6" />
              <SetupItem icon={Database} title="Migrate your data" href="/leads" color="#1abc9c" />
              <SetupItem icon={Plug} title="Integrations" href="/settings" color="#f39c12" />
            </div>
          </div>

          {/* Right: Illustration & CTA */}
          <div className="flex flex-col items-center justify-center border-t bg-gradient-to-br from-blue-50 to-indigo-100/50 p-6 lg:col-span-4 lg:border-l lg:border-t-0">
            <div className="mb-4 flex h-32 w-32 items-center justify-center">
              <svg viewBox="0 0 200 200" className="h-full w-full">
                <circle cx="100" cy="100" r="80" fill="#e0e7ff" />
                <circle cx="100" cy="70" r="25" fill="#6366f1" />
                <ellipse cx="100" cy="130" rx="40" ry="25" fill="#6366f1" />
                <circle cx="55" cy="90" r="15" fill="#a5b4fc" />
                <circle cx="145" cy="90" r="15" fill="#a5b4fc" />
                <circle cx="40" cy="120" r="10" fill="#c7d2fe" />
                <circle cx="160" cy="120" r="10" fill="#c7d2fe" />
              </svg>
            </div>
            <p className="text-center font-semibold text-slate-800">Invite your team</p>
            <p className="mt-2 max-w-[200px] text-center text-xs text-muted-foreground">
              Stay connected and collaborate with your team members to share sales updates from one platform.
            </p>
            <Button asChild size="sm" className="mt-4 bg-primary hover:bg-primary/90">
              <Link href="/users">Invite users</Link>
            </Button>
          </div>
        </div>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard loading={isLoading} index={0} label="Total Leads" value={formatNumber(stats?.totalLeads ?? 0)} icon={Users} accent="bg-primary/10 text-primary" />
        <StatCard loading={isLoading} index={1} label="Active Deals" value={formatNumber(stats?.activeDeals ?? 0)} icon={Handshake} accent="bg-blue-500/10 text-blue-500" />
        <StatCard loading={isLoading} index={2} label="Revenue (Booked)" value={formatCurrency(stats?.revenue ?? 0, true)} icon={IndianRupee} accent="bg-emerald-500/10 text-emerald-500" />
        <StatCard loading={isLoading} index={3} label="Site Visits" value={formatNumber(stats?.siteVisits ?? 0)} icon={CalendarCheck} accent="bg-amber-500/10 text-amber-500" />
        <StatCard loading={isLoading} index={4} label="Today's Tasks" value={formatNumber(stats?.todayFollowUps ?? 0)} icon={CheckSquare} accent="bg-violet-500/10 text-violet-500" />
        <StatCard loading={isLoading} index={5} label="Booked Deals" value={formatNumber(stats?.bookedDeals ?? 0)} icon={TrendingUp} accent="bg-rose-500/10 text-rose-500" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Lead & Booking Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : trendData.length === 0 ? (
              <EmptyState icon={TrendingUp} title="No trend data yet" description="Create leads to see your pipeline trend." className="py-12" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trendData} margin={{ left: -20, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ZOHO_BLUE} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={ZOHO_BLUE} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gBooked" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <RTooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="leads" stroke={ZOHO_BLUE} strokeWidth={2} fill="url(#gLeads)" name="Leads" />
                  <Area type="monotone" dataKey="booked" stroke="#10b981" strokeWidth={2} fill="url(#gBooked)" name="Booked" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : sourceData.length === 0 ? (
              <EmptyState icon={Activity} title="No sources yet" className="py-12" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={sourceData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {sourceData.map((_, i) => (
                      <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RTooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {sourceData.map((s, i) => (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: SOURCE_COLORS[i % SOURCE_COLORS.length] }} />
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="ml-auto font-medium">{s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel + tasks + activities */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={funnelData} layout="vertical" margin={{ left: 20, right: 16 }}>
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis type="category" dataKey="status" tickLine={false} axisLine={false} fontSize={12} width={80} stroke="hsl(var(--muted-foreground))" />
                  <RTooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                  <Bar dataKey="count" fill={ZOHO_BLUE} radius={[0, 6, 6, 0]} barSize={18} name="Leads" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Today&apos;s Follow-ups</CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
              <Link href="/leads">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {tasksLoading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : (tasks ?? []).length === 0 ? (
              <EmptyState icon={CheckSquare} title="No pending follow-ups" description="You're all caught up for today." className="py-10" />
            ) : (
              (tasks ?? []).map((t: any) => (
                <Link
                  key={t.id}
                  href={`/leads/${t.id}`}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.phone}</p>
                  </div>
                  <Badge variant={LEAD_STATUS_META[t.status as keyof typeof LEAD_STATUS_META]?.variant ?? 'secondary'}>
                    {LEAD_STATUS_META[t.status as keyof typeof LEAD_STATUS_META]?.label ?? t.status}
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {actLoading ? (
              [...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
            ) : (activities ?? []).length === 0 ? (
              <EmptyState icon={Activity} title="No activity yet" className="py-10" />
            ) : (
              (activities ?? []).map((a: any) => (
                <div key={a.id} className="flex items-start gap-3 rounded-lg p-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[10px]">{getInitials(a.user_name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{a.user_name ?? 'System'}</span>{' '}
                      <span className="text-muted-foreground">{a.title?.toLowerCase() ?? a.type}</span>{' '}
                      <Link href={`/leads/${a.lead_id}`} className="font-medium text-primary hover:underline">
                        {a.lead_name}
                      </Link>
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs">
      {label && <p className="mb-1 font-medium">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color ?? p.fill }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function SetupItem({
  icon: Icon,
  title,
  href,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-sm transition-all hover:border-transparent hover:shadow-md"
      style={{ ['--item-color' as string]: color }}
    >
      <span 
        className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
        style={{ backgroundColor: color }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="font-medium">{title}</span>
      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
