'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { ShieldCheck, Loader2, Users2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { apiGet, apiPut, apiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/constants';
import { useMutation, useQuery, useQueryClient } from '@/lib/simple-query';

interface Role {
  id: number;
  name: string;
  display_name: string;
  description: string;
  users_count: number;
  permissions_count: number;
}
interface Permission {
  id: number;
  name: string;
  module: string;
  description: string;
}

export default function RolesPage() {
  const qc = useQueryClient();
  const [activeRoleId, setActiveRoleId] = React.useState<number | null>(null);
  const [draft, setDraft] = React.useState<Set<number>>(new Set());

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => apiGet<Role[]>('/roles'),
  });
  const { data: permissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => apiGet<Permission[]>('/roles/permissions'),
  });

  const activeRole = roles?.find((r) => r.id === activeRoleId) ?? roles?.[0] ?? null;
  const effectiveRoleId = activeRole?.id ?? null;

  const { data: rolePerms, isLoading: rpLoading } = useQuery({
    queryKey: ['role-permissions', effectiveRoleId],
    queryFn: () => apiGet<{ role: Role; permissions: { id: number }[] }>(`/roles/${effectiveRoleId}/permissions`),
    enabled: Boolean(effectiveRoleId),
  });

  React.useEffect(() => {
    if (rolePerms) setDraft(new Set(rolePerms.permissions.map((p) => p.id)));
  }, [rolePerms]);

  const save = useMutation({
    mutationFn: () => apiPut(`/roles/${effectiveRoleId}/permissions`, { permissionIds: [...draft] }),
    onSuccess: () => {
      toast.success('Permissions updated');
      qc.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (err) => toast.error(apiError(err)),
  });

  const grouped = React.useMemo(() => {
    const map: Record<string, Permission[]> = {};
    (permissions ?? []).forEach((p) => {
      (map[p.module] ??= []).push(p);
    });
    return map;
  }, [permissions]);

  const isSuperAdmin = activeRole?.name === 'super_admin';
  const toggle = (id: number) =>
    setDraft((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="space-y-6">
      <PageHeader title="Roles & Permissions" description="Configure what each role can access across the CRM." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Roles list */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Roles</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {rolesLoading
              ? [...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
              : (roles ?? []).map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setActiveRoleId(role.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent',
                      effectiveRoleId === role.id && 'border-primary bg-primary/5',
                    )}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{ROLE_LABELS[role.name] ?? role.display_name}</p>
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users2 className="h-3 w-3" /> {role.users_count} users · {role.permissions_count} permissions
                      </p>
                    </div>
                  </button>
                ))}
          </CardContent>
        </Card>

        {/* Permission matrix */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">{activeRole ? ROLE_LABELS[activeRole.name] ?? activeRole.display_name : 'Permissions'}</CardTitle>
              {activeRole?.description && <p className="mt-1 text-sm text-muted-foreground">{activeRole.description}</p>}
            </div>
            {!isSuperAdmin && (
              <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending || rpLoading}>
                {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            {isSuperAdmin && (
              <Badge variant="secondary">Super Admin has full, non-editable access to everything.</Badge>
            )}
            {rpLoading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
            ) : (
              Object.entries(grouped).map(([module, perms]) => (
                <div key={module}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{module}</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {perms.map((p) => {
                      const checked = isSuperAdmin || draft.has(p.id);
                      return (
                        <label
                          key={p.id}
                          className={cn(
                            'flex items-center gap-3 rounded-lg border p-3',
                            isSuperAdmin ? 'opacity-60' : 'cursor-pointer hover:bg-accent',
                          )}
                        >
                          <Checkbox checked={checked} disabled={isSuperAdmin} onCheckedChange={() => toggle(p.id)} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{p.description ?? p.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{p.name}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <Separator className="mt-4" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
