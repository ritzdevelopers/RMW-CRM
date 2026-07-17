import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(191).toLowerCase(),
  phone: z.string().max(20).optional().nullable(),
  password: z.string().min(8).max(72),
  roleId: z.coerce.number().int().positive(),
  status: z.enum(['active', 'invited', 'suspended']).optional().default('active'),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  phone: z.string().max(20).optional().nullable(),
  avatarUrl: z.string().url().max(500).optional().nullable(),
  roleId: z.coerce.number().int().positive().optional(),
  status: z.enum(['active', 'invited', 'suspended']).optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  phone: z.string().max(20).optional().nullable(),
  avatarUrl: z.string().url().max(500).optional().nullable(),
});

export const listUsersSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().max(160).optional(),
  roleId: z.coerce.number().int().positive().optional(),
  status: z.enum(['active', 'invited', 'suspended']).optional(),
});
