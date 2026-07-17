'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, UserCog, MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PasswordInput } from '@/components/ui/password-input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUsers, useRoleOptions, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/use-users';
import { useAuthStore } from '@/lib/auth-store';
import { getInitials } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/constants';
import type { User } from '@/types';

const STATUS_VARIANT: Record<string, 'success' | 'secondary' | 'destructive'> = {
  active: 'success',
  invited: 'secondary',
  suspended: 'destructive',
};

function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export default function UsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [search, setSearch] = React.useState('');
  const debounced = useDebounced(search);
  const [page, setPage] = React.useState(1);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<User | null>(null);

  React.useEffect(() => setPage(1), [debounced]);

  const { data, isLoading } = useUsers({ page, pageSize: 15, search: debounced || undefined });
  const del = useDeleteUser();
  const users = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage team members, roles, and access.">
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" /> Invite user
        </Button>
      </PageHeader>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <Card className="divide-y">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-24" /></div>
            </div>
          ))}
        </Card>
      ) : users.length === 0 ? (
        <EmptyState icon={UserCog} title="No users found" description="Invite your first team member." action={<Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Invite user</Button>} />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{getInitials(u.name)}</AvatarFallback></Avatar>
                      <div>
                        <p className="font-medium">{u.name}{u.id === currentUser?.id && <span className="ml-1 text-xs text-muted-foreground">(You)</span>}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{ROLE_LABELS[u.role] ?? u.role}</Badge></TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[u.status] ?? 'secondary'} className="capitalize">{u.status}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email_verified_at ? 'Yes' : 'Pending'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditing(u); setFormOpen(true); }}><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem>
                        {u.id !== currentUser?.id && (
                          <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm(`Delete ${u.name}?`)) del.mutate(u.id); }}>
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pagination && <div className="border-t p-3"><PaginationBar {...pagination} onPageChange={setPage} /></div>}
        </Card>
      )}

      <UserFormDialog open={formOpen} onOpenChange={(v) => { setFormOpen(v); if (!v) setEditing(null); }} user={editing} />
    </div>
  );
}

function UserFormDialog({ open, onOpenChange, user }: { open: boolean; onOpenChange: (v: boolean) => void; user: User | null }) {
  const isEdit = Boolean(user);
  const { data: roles } = useRoleOptions();
  const create = useCreateUser();
  const update = useUpdateUser(user?.id ?? 0);

  const schema = isEdit
    ? z.object({ name: z.string().min(2), phone: z.string().optional(), roleId: z.string(), status: z.string() })
    : z.object({
        name: z.string().min(2),
        email: z.string().email(),
        phone: z.string().optional(),
        password: z.string().min(8, 'At least 8 characters'),
        roleId: z.string(),
        status: z.string(),
      });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<any>({ resolver: zodResolver(schema) });

  React.useEffect(() => {
    if (open) {
      reset({
        name: user?.name ?? '',
        email: user?.email ?? '',
        phone: user?.phone ?? '',
        password: '',
        roleId: user?.role_id ? String(user.role_id) : '',
        status: user?.status ?? 'active',
      });
    }
  }, [open, user, reset]);

  const onSubmit = async (v: any) => {
    const payload: any = { name: v.name, phone: v.phone || null, roleId: Number(v.roleId), status: v.status };
    if (!isEdit) { payload.email = v.email; payload.password = v.password; }
    if (isEdit) await update.mutateAsync(payload);
    else await create.mutateAsync(payload);
    onOpenChange(false);
  };

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{isEdit ? 'Edit user' : 'Invite user'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message as string}</p>}
          </div>
          {!isEdit && (
            <>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label>Temporary password</Label>
                <PasswordInput {...register('password')} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message as string}</p>}
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input {...register('phone')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={watch('roleId')} onValueChange={(v) => setValue('roleId', v)}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {(roles ?? []).map((r) => (<SelectItem key={r.id} value={String(r.id)}>{r.display_name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={watch('status')} onValueChange={(v) => setValue('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="invited">Invited</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Save' : 'Create user'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
