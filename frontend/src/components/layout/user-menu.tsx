'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LogOut, Settings, User as UserIcon, KeyRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AppleSpinner } from '@/components/ui/apple-spinner';
import { useAuthStore } from '@/lib/auth-store';
import { useLogout } from '@/hooks/use-auth';
import { getInitials } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/constants';

export function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const [confirmOpen, setConfirmOpen] = useState(false);
  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9 gap-2 pl-1 pr-2">
            <Avatar className="h-7 w-7">
              {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline">{user.name.split(' ')[0]}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="truncate text-sm font-medium">{user.name}</span>
              <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
              <span className="mt-1 text-xs font-normal text-primary">{ROLE_LABELS[user.role] ?? user.role}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <UserIcon /> Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings?tab=security">
              <KeyRound /> Change password
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings /> Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setConfirmOpen(true);
            }}
            className="text-destructive focus:text-destructive"
          >
            <LogOut /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={(open) => !logout.isPending && setConfirmOpen(open)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign out?</DialogTitle>
            <DialogDescription>
              You&apos;ll be signed out of RMW CRM and returned to the login page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={logout.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              {logout.isPending && <AppleSpinner size={16} />}
              {logout.isPending ? 'Signing out…' : 'Sign out'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
