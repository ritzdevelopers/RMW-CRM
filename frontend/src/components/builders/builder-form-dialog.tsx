'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateBuilder, useUpdateBuilder } from '@/hooks/use-builders';
import type { Builder } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  legalName: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  reraNumber: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  address: z.string().optional(),
  status: z.string(),
  tier: z.string(),
  projectsCount: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  builder?: Builder | null;
}

export function BuilderFormDialog({ open, onOpenChange, builder }: Props) {
  const isEdit = Boolean(builder);
  const create = useCreateBuilder();
  const update = useUpdateBuilder(builder?.id ?? 0);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  React.useEffect(() => {
    if (open) {
      reset({
        name: builder?.name ?? '',
        legalName: builder?.legal_name ?? '',
        contactPerson: builder?.contact_person ?? '',
        email: builder?.email ?? '',
        phone: builder?.phone ?? '',
        website: builder?.website ?? '',
        reraNumber: builder?.rera_number ?? '',
        city: builder?.city ?? '',
        state: builder?.state ?? '',
        address: builder?.address ?? '',
        status: builder?.status ?? 'active',
        tier: builder?.tier ?? 'b',
        projectsCount: builder?.projects_count ? String(builder.projects_count) : '0',
        notes: builder?.notes ?? '',
      });
    }
  }, [open, builder, reset]);

  const onSubmit = async (v: FormValues) => {
    const payload: any = {
      name: v.name,
      legalName: v.legalName || null,
      contactPerson: v.contactPerson || null,
      email: v.email || null,
      phone: v.phone || null,
      website: v.website || null,
      reraNumber: v.reraNumber || null,
      city: v.city || null,
      state: v.state || null,
      address: v.address || null,
      status: v.status,
      tier: v.tier,
      projectsCount: v.projectsCount ? Number(v.projectsCount) : 0,
      notes: v.notes || null,
    };
    if (isEdit) await update.mutateAsync(payload);
    else await create.mutateAsync(payload);
    onOpenChange(false);
  };

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit builder' : 'Add builder'}</DialogTitle>
          <DialogDescription>Manage developer & promoter partners for MPF.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Builder name" error={errors.name?.message} required>
              <Input placeholder="e.g. Prestige Group" {...register('name')} />
            </Field>
            <Field label="Legal name">
              <Input placeholder="Prestige Estates Projects Ltd." {...register('legalName')} />
            </Field>
            <Field label="Contact person">
              <Input placeholder="e.g. Anil Kumar" {...register('contactPerson')} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <Input placeholder="contact@builder.com" {...register('email')} />
            </Field>
            <Field label="Phone">
              <Input placeholder="+91 98765 43210" {...register('phone')} />
            </Field>
            <Field label="Website" error={errors.website?.message}>
              <Input placeholder="https://builder.com" {...register('website')} />
            </Field>
            <Field label="RERA number">
              <Input placeholder="PRM/KA/RERA/…" {...register('reraNumber')} />
            </Field>
            <Field label="Projects count">
              <Input type="number" {...register('projectsCount')} />
            </Field>
            <Field label="City">
              <Input placeholder="e.g. Bangalore" {...register('city')} />
            </Field>
            <Field label="State">
              <Input placeholder="e.g. Karnataka" {...register('state')} />
            </Field>
            <Field label="Status">
              <SelectField value={watch('status')} onChange={(v) => setValue('status', v)} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'blacklisted', label: 'Blacklisted' }]} />
            </Field>
            <Field label="Partnership tier">
              <SelectField value={watch('tier')} onChange={(v) => setValue('tier', v)} options={[{ value: 'a', label: 'Tier A' }, { value: 'b', label: 'Tier B' }, { value: 'c', label: 'Tier C' }]} />
            </Field>
          </div>

          <Field label="Address">
            <Textarea rows={2} placeholder="Registered / office address" {...register('address')} />
          </Field>
          <Field label="Notes">
            <Textarea rows={2} placeholder="Internal notes about this builder…" {...register('notes')} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Save changes' : 'Add builder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label} {required && <span className="text-destructive">*</span>}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SelectField({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
      </SelectContent>
    </Select>
  );
}
