'use client';

import { Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/lib/ui-store';
import { ThemeToggle } from './theme-toggle';
import { NotificationBell } from './notification-bell';
import { UserMenu } from './user-menu';

export function AppTopbar() {
  const { setMobileSidebarOpen, setCommandOpen } = useUIStore();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-card px-4">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileSidebarOpen(true)}>
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search trigger */}
      <button
        onClick={() => setCommandOpen(true)}
        className="group flex h-9 w-full max-w-md items-center gap-2 rounded-lg border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-accent/40"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search leads, builders, people…</span>
        <kbd className="pointer-events-none hidden select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium sm:flex">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
