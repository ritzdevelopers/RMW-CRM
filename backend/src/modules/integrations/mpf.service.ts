import { pool, queryOne } from '../../db/pool.js';
import type { MpfEnquiryPayload } from './mpf.schema.js';

export const MPF_EXTERNAL_SOURCE = 'mpf_enquiry';

const SELECT_BASE = `
  SELECT l.*,
         b.name AS builder_name,
         a.name AS assignee_name, a.avatar_url AS assignee_avatar,
         o.name AS owner_name
  FROM leads l
  LEFT JOIN builders b ON b.id = l.builder_id
  LEFT JOIN users a ON a.id = l.assigned_to
  LEFT JOIN users o ON o.id = l.owner_id
`;

function mapMpfStatus(raw?: string | null): { status: string; lostReason?: string | null } {
  const value = (raw ?? 'New').trim().toLowerCase();
  switch (value) {
    case 'shared':
    case 'pending':
      return { status: 'contacted' };
    case 'test':
    case 'duplicate':
    case 'irrelevant':
    case 'rejected':
      return { status: 'lost', lostReason: raw ?? 'Closed on MPF' };
    default:
      return { status: 'new' };
  }
}

function buildNotes(payload: MpfEnquiryPayload): string {
  const parts = [
    payload.message ? `Message: ${payload.message}` : null,
    payload.enquiryFrom ? `Enquiry from: ${payload.enquiryFrom}` : null,
    payload.pageName ? `Page: ${payload.pageName}` : null,
    payload.projectLink ? `Link: ${payload.projectLink}` : null,
  ].filter(Boolean);
  return parts.join('\n') || 'Imported from My Property Fact';
}

export async function upsertMpfEnquiry(payload: MpfEnquiryPayload) {
  const externalId = payload.externalId;
  const { status, lostReason } = mapMpfStatus(payload.status);
  const notes = buildNotes(payload);
  const campaign = payload.enquiryFrom ?? payload.pageName ?? 'My Property Fact';
  const propertyType = payload.pageName ?? null;
  const locationPref = payload.projectLink ?? null;
  const email = payload.email?.trim() || null;

  const existing = await queryOne<{ id: number }>(
    `SELECT id FROM leads WHERE external_source = ? AND external_id = ? LIMIT 1`,
    [MPF_EXTERNAL_SOURCE, externalId],
  );

  if (existing) {
    await pool.execute(
      `UPDATE leads SET
         name = ?, email = ?, phone = ?, status = ?, lost_reason = ?,
         campaign = ?, property_type = ?, location_pref = ?, notes = ?, source = 'my_property_fact'
       WHERE id = ?`,
      [
        payload.name,
        email,
        payload.phone,
        status,
        lostReason ?? null,
        campaign,
        propertyType,
        locationPref,
        notes,
        existing.id,
      ],
    );
    return queryOne(`${SELECT_BASE} WHERE l.id = ?`, [existing.id]);
  }

  const [result]: any = await pool.execute(
    `INSERT INTO leads (
       name, email, phone, source, external_source, external_id,
       campaign, status, lost_reason, property_type, location_pref, notes, priority
     ) VALUES (?, ?, ?, 'my_property_fact', ?, ?, ?, ?, ?, ?, ?, ?, 'medium')`,
    [
      payload.name,
      email,
      payload.phone,
      MPF_EXTERNAL_SOURCE,
      externalId,
      campaign,
      status,
      lostReason ?? null,
      propertyType,
      locationPref,
      notes,
    ],
  );

  const leadId = result.insertId as number;
  await pool.execute(
    `INSERT INTO lead_activities (lead_id, type, title, body)
     VALUES (?, 'created', 'Imported from My Property Fact', ?)`,
    [leadId, `MPF enquiry #${externalId}`],
  );

  return queryOne(`${SELECT_BASE} WHERE l.id = ?`, [leadId]);
}

export async function syncMpfEnquiries(enquiries: MpfEnquiryPayload[]) {
  let created = 0;
  let updated = 0;
  for (const enquiry of enquiries) {
    const before = await queryOne<{ id: number }>(
      `SELECT id FROM leads WHERE external_source = ? AND external_id = ? LIMIT 1`,
      [MPF_EXTERNAL_SOURCE, enquiry.externalId],
    );
    await upsertMpfEnquiry(enquiry);
    if (before) updated += 1;
    else created += 1;
  }
  return { created, updated, total: enquiries.length };
}
