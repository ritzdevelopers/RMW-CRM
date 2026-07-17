'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/lib/auth-store';
import { useUpdateProfile } from '@/hooks/use-users';
import { useChangePassword } from '@/hooks/use-auth';
import { getInitials, cn } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/constants';

function SettingsInner() {
  const params = useSearchParams();
  const defaultTab = params.get('tab') === 'security' ? 'security' : 'profile';
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const profileForm = useForm({
    resolver: zodResolver(z.object({ name: z.string().min(2), phone: z.string().optional() })),
    values: { name: user?.name ?? '', phone: user?.phone ?? '' },
  });

  const pwForm = useForm({
    resolver: zodResolver(
      z
        .object({
          currentPassword: z.string().min(1, 'Required'),
          newPassword: z
            .string()
            .min(8, 'At least 8 characters')
            .regex(/[a-z]/, 'Add a lowercase letter')
            .regex(/[A-Z]/, 'Add an uppercase letter')
            .regex(/[0-9]/, 'Add a number'),
          confirm: z.string(),
        })
        .refine((d) => d.newPassword === d.confirm, { message: 'Passwords do not match', path: ['confirm'] }),
    ),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your profile, security, and appearance." />

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your personal information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {user?.avatar_url && <AvatarImage src={user.avatar_url} />}
                  <AvatarFallback className="text-lg">{getInitials(user?.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <p className="text-xs text-primary">{ROLE_LABELS[user?.role ?? ''] ?? user?.role}</p>
                </div>
              </div>

              <form
                onSubmit={profileForm.handleSubmit(async (v) => {
                  const updated = await updateProfile.mutateAsync(v);
                  if (updated) setUser(updated as any);
                })}
                className="grid max-w-lg grid-cols-1 gap-4 sm:grid-cols-2"
              >
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" {...profileForm.register('name')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" {...profileForm.register('phone')} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email ?? ''} disabled />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={updateProfile.isPending}>
                    {updateProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change password</CardTitle>
              <CardDescription>Use a strong password you don&apos;t reuse elsewhere.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={pwForm.handleSubmit(async (v) => {
                  await changePassword.mutateAsync({ currentPassword: v.currentPassword, newPassword: v.newPassword });
                  pwForm.reset();
                })}
                className="max-w-md space-y-4"
              >
                <div className="space-y-2">
                  <Label>Current password</Label>
                  <PasswordInput {...pwForm.register('currentPassword')} />
                  {pwForm.formState.errors.currentPassword && (
                    <p className="text-xs text-destructive">{pwForm.formState.errors.currentPassword.message as string}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>New password</Label>
                  <PasswordInput {...pwForm.register('newPassword')} />
                  {pwForm.formState.errors.newPassword && (
                    <p className="text-xs text-destructive">{pwForm.formState.errors.newPassword.message as string}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Confirm new password</Label>
                  <PasswordInput {...pwForm.register('confirm')} />
                  {pwForm.formState.errors.confirm && (
                    <p className="text-xs text-destructive">{pwForm.formState.errors.confirm.message as string}</p>
                  )}
                </div>
                <Button type="submit" disabled={changePassword.isPending}>
                  {changePassword.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Update password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance">
          <AppearanceCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AppearanceCard() {
  const { theme, setTheme } = useTheme();
  const options = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Customize how RMW CRM looks on your device.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid max-w-md grid-cols-3 gap-3">
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => setTheme(o.value)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-accent',
                theme === o.value && 'border-primary bg-primary/5 ring-1 ring-primary',
              )}
            >
              <o.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{o.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <SettingsInner />
    </Suspense>
  );
}
