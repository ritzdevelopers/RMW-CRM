'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/lib/auth-store';

export default function Home() {
  const router = useRouter();
  const { isInitialized, user } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) return;
    router.replace(user ? '/dashboard' : '/login');
  }, [isInitialized, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/images/logo-light.png"
          alt="Ritz Media World CRM"
          width={160}
          height={80}
          className="h-16 w-auto animate-pulse"
          priority
        />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}
