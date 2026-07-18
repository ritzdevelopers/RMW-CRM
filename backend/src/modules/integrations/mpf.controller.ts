import type { Request, Response } from 'express';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { mpfEnquiryWebhookSchema, parseMpfEnquiry } from './mpf.schema.js';
import { syncMpfEnquiries, upsertMpfEnquiry } from './mpf.service.js';
import { logger } from '../../utils/logger.js';

function assertWebhookKey(req: Request) {
  const key = req.header('x-mpf-crm-key') ?? req.header('authorization')?.replace(/^Bearer\s+/i, '');
  if (!env.mpf.webhookKey || key !== env.mpf.webhookKey) {
    throw ApiError.unauthorized('Invalid integration key');
  }
}

export async function webhook(req: Request, res: Response) {
  assertWebhookKey(req);
  const payload = mpfEnquiryWebhookSchema.parse(req.body);
  const lead = await upsertMpfEnquiry(payload);
  res.json({ success: true, data: lead });
}

export async function syncFromMpf(_req: Request, res: Response) {
  if (!env.mpf.apiUrl || !env.mpf.apiKey) {
    throw ApiError.badRequest('MPF sync is not configured. Set MPF_API_URL and MPF_API_KEY.');
  }

  const response = await fetch(`${env.mpf.apiUrl.replace(/\/$/, '')}/enquiry/crm-export`, {
    headers: {
      'x-mpf-crm-key': env.mpf.apiKey,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    const hint =
      response.status === 404
        ? ' The MPF /enquiry/crm-export endpoint may not be deployed yet, or MPF_API_URL is wrong.'
        : response.status === 401
          ? ' Check that MPF_CRM_WEBHOOK_KEY matches crm.webhook.key on the MPF backend.'
          : '';
    throw new ApiError(
      502,
      `MPF export failed (${response.status}): ${text.slice(0, 200)}.${hint}`,
      'bad_gateway',
    );
  }

  const raw = await response.json();
  const list = Array.isArray(raw) ? raw : raw?.data ?? [];

  const enquiries = [];
  let skipped = 0;
  for (const item of list) {
    const parsed = parseMpfEnquiry(item as Record<string, unknown>);
    if (parsed.success) {
      enquiries.push(parsed.data);
    } else {
      skipped += 1;
      logger.warn('Skipped invalid MPF enquiry during sync', {
        id: (item as any)?.id,
        issues: parsed.error.flatten(),
      });
    }
  }

  const result = await syncMpfEnquiries(enquiries);
  res.json({ success: true, data: { ...result, skipped } });
}
