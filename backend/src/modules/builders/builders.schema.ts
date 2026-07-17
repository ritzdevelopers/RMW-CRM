import { z } from 'zod';

export const BUILDER_STATUSES = ['active', 'inactive', 'blacklisted'] as const;
export const BUILDER_TIERS = ['a', 'b', 'c'] as const;

export const createBuilderSchema = z.object({
  name: z.string().min(2).max(160),
  legalName: z.string().max(200).optional().nullable(),
  logoUrl: z.string().url().max(500).optional().nullable(),
  email: z.string().email().max(191).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  website: z.string().url().max(255).optional().nullable(),
  reraNumber: z.string().max(80).optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  state: z.string().max(80).optional().nullable(),
  address: z.string().max(400).optional().nullable(),
  contactPerson: z.string().max(120).optional().nullable(),
  status: z.enum(BUILDER_STATUSES).default('active'),
  tier: z.enum(BUILDER_TIERS).default('b'),
  projectsCount: z.coerce.number().int().min(0).optional().default(0),
  notes: z.string().max(5000).optional().nullable(),
});

export const updateBuilderSchema = createBuilderSchema.partial();

export const listBuildersSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().max(160).optional(),
  status: z.enum(BUILDER_STATUSES).optional(),
  tier: z.enum(BUILDER_TIERS).optional(),
  city: z.string().max(80).optional(),
  sortBy: z.enum(['created_at', 'name', 'projects_count', 'tier', 'status']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export type CreateBuilderInput = z.infer<typeof createBuilderSchema>;
export type UpdateBuilderInput = z.infer<typeof updateBuilderSchema>;
