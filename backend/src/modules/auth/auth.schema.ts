import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password too long')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[0-9]/, 'Must contain a number');

export const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(191).toLowerCase(),
  phone: z.string().min(7).max(20).optional(),
  password,
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional().default(false),
});

export const firebaseLoginSchema = z.object({
  idToken: z.string().min(10),
  rememberMe: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(10),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type FirebaseLoginInput = z.infer<typeof firebaseLoginSchema>;
