'use client';

import { Suspense, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVerifyEmail } from '@/hooks/use-auth';

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const verify = useVerifyEmail();
  const ran = useRef(false);

  useEffect(() => {
    if (token && !ran.current) {
      ran.current = true;
      verify.mutate(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return <StateBlock icon={<XCircle className="h-6 w-6" />} tone="destructive" title="Invalid link" desc="This verification link is missing a token." />;
  }
  if (verify.isPending) {
    return <StateBlock icon={<Loader2 className="h-6 w-6 animate-spin" />} tone="primary" title="Verifying…" desc="Please wait while we confirm your email." />;
  }
  if (verify.isSuccess) {
    return (
      <StateBlock icon={<CheckCircle2 className="h-6 w-6" />} tone="success" title="Email verified!" desc="Your email has been confirmed. You can now sign in.">
        <Button asChild className="w-full">
          <Link href="/login">Continue to sign in</Link>
        </Button>
      </StateBlock>
    );
  }
  return (
    <StateBlock icon={<XCircle className="h-6 w-6" />} tone="destructive" title="Verification failed" desc="This link is invalid or has expired.">
      <Button asChild variant="outline" className="w-full">
        <Link href="/login">Back to sign in</Link>
      </Button>
    </StateBlock>
  );
}

function StateBlock({
  icon,
  tone,
  title,
  desc,
  children,
}: {
  icon: React.ReactNode;
  tone: 'primary' | 'success' | 'destructive';
  title: string;
  desc: string;
  children?: React.ReactNode;
}) {
  const toneClass =
    tone === 'success' ? 'bg-success/10 text-success' : tone === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary';
  return (
    <div className="space-y-6 text-center">
      <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${toneClass}`}>{icon}</div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      {children}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <VerifyInner />
    </Suspense>
  );
}
