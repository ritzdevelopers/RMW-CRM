import { z } from 'zod';
import { normalizeLeadName, resolveMpfPhone } from '../../utils/phone.js';

export const mpfEnquiryWebhookSchema = z.object({
  externalId: z.union([z.string(), z.number()]).transform(String),
  name: z.preprocess(normalizeLeadName, z.string().min(1).max(160)),
  email: z.string().max(191).optional().nullable().transform((v) => {
    if (!v || !v.trim()) return null;
    const parsed = z.string().email().safeParse(v.trim());
    return parsed.success ? parsed.data : null;
  }),
  phone: z.string().min(7).max(20),
  message: z.string().max(5000).optional().nullable(),
  enquiryFrom: z.string().max(160).optional().nullable(),
  pageName: z.string().max(160).optional().nullable(),
  projectLink: z.string().max(500).optional().nullable(),
  status: z.string().max(50).optional().nullable(),
  createdAt: z.string().optional().nullable(),
});

export type MpfEnquiryPayload = z.infer<typeof mpfEnquiryWebhookSchema>;

export function parseMpfEnquiry(raw: Record<string, unknown>) {
  const externalId = raw.id ?? raw.externalId;
  return mpfEnquiryWebhookSchema.safeParse({
    externalId,
    name: raw.name,
    email: raw.email,
    phone: resolveMpfPhone(raw.phone, externalId as string | number | undefined),
    message: raw.message,
    enquiryFrom: raw.enquiryFrom,
    pageName: raw.pageName,
    projectLink: raw.projectLink,
    status: raw.status,
    createdAt: raw.createdAt,
  });
}
