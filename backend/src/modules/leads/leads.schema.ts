import { z } from 'zod';

export const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'site_visit',
  'negotiation',
  'booked',
  'lost',
] as const;

export const LEAD_SOURCES = [
  'website',
  'meta',
  'google',
  'referral',
  'walk_in',
  'manual',
  'import',
  'other',
] as const;

export const PRIORITIES = ['low', 'medium', 'high'] as const;

const optionalNumber = z.coerce.number().nonnegative().optional().nullable();

export const createLeadSchema = z.object({
  name: z.string().min(2).max(160),
  email: z.string().email().max(191).optional().nullable(),
  phone: z.string().min(7).max(20),
  altPhone: z.string().max(20).optional().nullable(),
  source: z.enum(LEAD_SOURCES).default('manual'),
  campaign: z.string().max(160).optional().nullable(),
  status: z.enum(LEAD_STATUSES).default('new'),
  score: z.coerce.number().int().min(0).max(100).optional().default(0),
  priority: z.enum(PRIORITIES).default('medium'),
  budgetMin: optionalNumber,
  budgetMax: optionalNumber,
  propertyType: z.string().max(80).optional().nullable(),
  locationPref: z.string().max(160).optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  builderId: z.coerce.number().int().positive().optional().nullable(),
  assignedTo: z.coerce.number().int().positive().optional().nullable(),
  expectedValue: optionalNumber,
  nextFollowUpAt: z.string().datetime().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export const updateLeadSchema = createLeadSchema.partial().extend({
  lostReason: z.string().max(255).optional().nullable(),
});

export const listLeadsSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().max(160).optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  assignedTo: z.coerce.number().int().positive().optional(),
  builderId: z.coerce.number().int().positive().optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'name', 'score', 'next_follow_up_at', 'status']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export const changeStatusSchema = z.object({
  status: z.enum(LEAD_STATUSES),
  lostReason: z.string().max(255).optional().nullable(),
});

export const assignLeadSchema = z.object({
  assignedTo: z.coerce.number().int().positive().nullable(),
});

export const addActivitySchema = z.object({
  type: z.enum(['note', 'call', 'email', 'sms', 'whatsapp', 'meeting', 'site_visit', 'follow_up']),
  title: z.string().max(200).optional().nullable(),
  body: z.string().max(5000).optional().nullable(),
});

export const bulkActionSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1).max(200),
  action: z.enum(['assign', 'status', 'delete']),
  assignedTo: z.coerce.number().int().positive().optional().nullable(),
  status: z.enum(LEAD_STATUSES).optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
