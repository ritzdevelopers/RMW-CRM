'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { AppleSpinner } from '@/components/ui/apple-spinner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Checkbox } from '@/components/ui/checkbox';
import { useLogin, useSocialLogin } from '@/hooks/use-auth';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const login = useLogin();
  const social = useSocialLogin();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', rememberMe: true },
  });

  const onSubmit = (values: FormValues) => login.mutate(values);
  const rememberMe = watch('rememberMe');

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">to access RMW CRM</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="Email address or mobile number" 
            autoComplete="email" 
            className="h-11"
            {...register('email')} 
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput 
            id="password" 
            placeholder="Enter your password" 
            autoComplete="current-password" 
            className="h-11"
            {...register('password')} 
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="rememberMe"
            checked={watch('rememberMe')}
            onCheckedChange={(v) => setValue('rememberMe', Boolean(v))}
          />
          <Label htmlFor="rememberMe" className="text-sm font-normal text-muted-foreground">
            Remember me for 7 days
          </Label>
        </div>

        <Button type="submit" className="h-11 w-full gap-2 text-base font-medium" disabled={login.isPending}>
          {login.isPending && <AppleSpinner size={18} />}
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      {/* Social login */}
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 text-muted-foreground">or sign in with</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Google */}
          <button
            type="button"
            onClick={() => social.mutate({ provider: 'google', rememberMe })}
            disabled={login.isPending || social.isPending}
            className="flex h-11 items-center justify-center gap-2 rounded-lg border bg-white px-4 shadow-sm transition-all hover:bg-gray-50 hover:shadow"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Google</span>
          </button>

          {/* Facebook */}
          <button
            type="button"
            onClick={() => social.mutate({ provider: 'facebook', rememberMe })}
            disabled={login.isPending || social.isPending}
            className="flex h-11 items-center justify-center gap-2 rounded-lg border bg-[#1877F2] px-4 shadow-sm transition-all hover:bg-[#166FE5] hover:shadow"
          >
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span className="text-sm font-medium text-white">Facebook</span>
          </button>
        </div>
      </div>

      {/* Register link */}
      <p className="text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Sign up now
        </Link>
      </p>
    </div>
  );
}
