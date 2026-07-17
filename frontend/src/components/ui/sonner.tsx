'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      position="top-right"
      expand={true}
      visibleToasts={5}
      duration={4000}
      gap={8}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg',
          success: 'group-[.toaster]:border-emerald-200 group-[.toaster]:bg-emerald-50 group-[.toaster]:text-emerald-800 dark:group-[.toaster]:border-emerald-800 dark:group-[.toaster]:bg-emerald-950 dark:group-[.toaster]:text-emerald-200',
          error: 'group-[.toaster]:border-red-200 group-[.toaster]:bg-red-50 group-[.toaster]:text-red-800 dark:group-[.toaster]:border-red-800 dark:group-[.toaster]:bg-red-950 dark:group-[.toaster]:text-red-200',
          warning: 'group-[.toaster]:border-amber-200 group-[.toaster]:bg-amber-50 group-[.toaster]:text-amber-800 dark:group-[.toaster]:border-amber-800 dark:group-[.toaster]:bg-amber-950 dark:group-[.toaster]:text-amber-200',
          info: 'group-[.toaster]:border-blue-200 group-[.toaster]:bg-blue-50 group-[.toaster]:text-blue-800 dark:group-[.toaster]:border-blue-800 dark:group-[.toaster]:bg-blue-950 dark:group-[.toaster]:text-blue-200',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
