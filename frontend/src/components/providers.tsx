'use client';

import * as React from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { AuthBootstrap } from '@/components/auth/auth-bootstrap';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <TooltipProvider delayDuration={200}>
        <AuthBootstrap>{children}</AuthBootstrap>
        <Toaster richColors closeButton />
      </TooltipProvider>
    </ThemeProvider>
  );
}
