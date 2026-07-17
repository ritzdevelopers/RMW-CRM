'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ChevronLeft, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NAV } from '@/lib/nav';
import { useAuthStore } from '@/lib/auth-store';
import { useUIStore } from '@/lib/ui-store';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function AppSidebar() {
  const pathname = usePathname();
  const can = useAuthStore((s) => s.can);
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();

  const content = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div
        className={cn(
          'flex h-16 items-center border-b px-4',
          sidebarCollapsed && 'justify-center px-2',
        )}
      >
        <Link href="/dashboard" className="flex items-center">
          {sidebarCollapsed ? (
            <Image
              src="/images/logo-light.png"
              alt="RMW CRM"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
          ) : (
            <Image
              src="/images/logo-light.png"
              alt="Ritz Media World CRM"
              width={130}
              height={40}
              className="h-10 w-auto"
            />
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-6 overflow-y-auto scrollbar-thin px-3 py-4">
        {NAV.map((section, i) => {
          const items = section.items.filter((it) => !it.permission || can(it.permission));
          if (items.length === 0) return null;
          return (
            <div key={i} className="space-y-1">
              {section.title && !sidebarCollapsed && (
                <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </p>
              )}
              {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                const link = (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                      sidebarCollapsed && 'justify-center px-0',
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="sidebar-active"
                        className="absolute left-0 h-6 w-1 rounded-r-full bg-primary"
                      />
                    )}
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                );
                return sidebarCollapsed ? (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  link
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle (desktop) */}
      <div className="hidden border-t p-3 lg:block">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full justify-center"
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', sidebarCollapsed && 'rotate-180')} />
          {!sidebarCollapsed && <span>Collapse</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 border-r bg-card transition-all duration-300 lg:block',
          sidebarCollapsed ? 'w-[72px]' : 'w-64',
        )}
      >
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r bg-card">{content}</aside>
        </div>
      )}
    </>
  );
}
