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
import { useCreateLead, useUpdateLead } from '@/hooks/use-leads';
import { useBuilderOptions } from '@/hooks/use-builders';
import { useAssignableUsers } from '@/hooks/use-users';
import { LEAD_SOURCE_META, LEAD_STATUS_META, LEAD_STATUS_ORDER, PRIORITY_META } from '@/lib/constants';
import type { Lead } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(7, 'Valid phone required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  source: z.string(),
  status: z.string(),
  priority: z.string(),
  city: z.string().optional(),
  propertyType: z.string().optional(),
  budgetMin: z.string().optional(),
  budgetMax: z.string().optional(),
  expectedValue: z.string().optional(),
  builderId: z.string().optional(),
  assignedTo: z.string().optional(),
  nextFollowUpAt: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const NONE = 'none';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead?: Lead | null;
}

export function LeadFormDialog({ open, onOpenChange, lead }: Props) {
  const isEdit = Boolean(lead);
  const create = useCreateLead();
  const update = useUpdateLead(lead?.id ?? 0);
  const { data: builders } = useBuilderOptions();
  const { data: users } = useAssignableUsers();

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
        name: lead?.name ?? '',
        phone: lead?.phone ?? '',
        email: lead?.email ?? '',
        source: lead?.source ?? 'manual',
        status: lead?.status ?? 'new',
        priority: lead?.priority ?? 'medium',
        city: lead?.city ?? '',
        propertyType: lead?.property_type ?? '',
        budgetMin: lead?.budget_min ? String(lead.budget_min) : '',
        budgetMax: lead?.budget_max ? String(lead.budget_max) : '',
        expectedValue: lead?.expected_value ? String(lead.expected_value) : '',
        builderId: lead?.builder_id ? String(lead.builder_id) : NONE,
        assignedTo: lead?.assigned_to ? String(lead.assigned_to) : NONE,
        nextFollowUpAt: lead?.next_follow_up_at ? lead.next_follow_up_at.slice(0, 16) : '',
        notes: lead?.notes ?? '',
      });
    }
  }, [open, lead, reset]);

  const onSubmit = async (v: FormValues) => {
    const payload: any = {
      name: v.name,
      phone: v.phone,
      email: v.email || null,
      source: v.source,
      status: v.status,
      priority: v.priority,
      city: v.city || null,
      propertyType: v.propertyType || null,
      budgetMin: v.budgetMin ? Number(v.budgetMin) : null,
      budgetMax: v.budgetMax ? Number(v.budgetMax) : null,
      expectedValue: v.expectedValue ? Number(v.expectedValue) : null,
      builderId: v.builderId && v.builderId !== NONE ? Number(v.builderId) : null,
      assignedTo: v.assignedTo && v.assignedTo !== NONE ? Number(v.assignedTo) : null,
      nextFollowUpAt: v.nextFollowUpAt ? new Date(v.nextFollowUpAt).toISOString() : null,
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
          <DialogTitle>{isEdit ? 'Edit lead' : 'Create new lead'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the lead details below.' : 'Capture a new lead into your pipeline.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name" error={errors.name?.message} required>
              <Input placeholder="e.g. Rahul Sharma" {...register('name')} />
            </Field>
            <Field label="Phone" error={errors.phone?.message} required>
              <Input placeholder="+91 98765 43210" {...register('phone')} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <Input placeholder="name@email.com" {...register('email')} />
            </Field>
            <Field label="City">
              <Input placeholder="e.g. Bangalore" {...register('city')} />
            </Field>

            <Field label="Source">
              <SelectField value={watch('source')} onChange={(v) => setValue('source', v)} options={Object.entries(LEAD_SOURCE_META).map(([k, m]) => ({ value: k, label: m.label }))} />
            </Field>
            <Field label="Status">
              <SelectField value={watch('status')} onChange={(v) => setValue('status', v)} options={LEAD_STATUS_ORDER.map((s) => ({ value: s, label: LEAD_STATUS_META[s].label }))} />
            </Field>
            <Field label="Priority">
              <SelectField value={watch('priority')} onChange={(v) => setValue('priority', v)} options={Object.entries(PRIORITY_META).map(([k, m]) => ({ value: k, label: m.label }))} />
            </Field>
            <Field label="Property type">
              <Input placeholder="e.g. 3BHK, Villa, Plot" {...register('propertyType')} />
            </Field>

            <Field label="Budget min (₹)">
              <Input type="number" placeholder="3000000" {...register('budgetMin')} />
            </Field>
            <Field label="Budget max (₹)">
              <Input type="number" placeholder="8000000" {...register('budgetMax')} />
            </Field>
            <Field label="Expected deal value (₹)">
              <Input type="number" placeholder="6500000" {...register('expectedValue')} />
            </Field>
            <Field label="Next follow-up">
              <Input type="datetime-local" {...register('nextFollowUpAt')} />
            </Field>

            <Field label="Interested builder">
              <SelectField
                value={watch('builderId') ?? NONE}
                onChange={(v) => setValue('builderId', v)}
                options={[{ value: NONE, label: 'None' }, ...(builders ?? []).map((b) => ({ value: String(b.id), label: b.name }))]}
              />
            </Field>
            <Field label="Assign to">
              <SelectField
                value={watch('assignedTo') ?? NONE}
                onChange={(v) => setValue('assignedTo', v)}
                options={[{ value: NONE, label: 'Unassigned' }, ...(users ?? []).map((u) => ({ value: String(u.id), label: u.name }))]}
              />
            </Field>
          </div>

          <Field label="Notes">
            <Textarea rows={3} placeholder="Any context about this lead…" {...register('notes')} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Save changes' : 'Create lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SelectField({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
