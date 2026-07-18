/** Strip formatting and fit Indian/international numbers into DB limit (20 chars). */
export function normalizePhone(raw: unknown): string {
  const value = String(raw ?? '').trim();
  if (!value) return '';

  const hasPlus = value.startsWith('+');
  const digits = value.replace(/\D/g, '');
  if (!digits) return value.slice(0, 20);

  // Prefer last 10 digits for typical Indian mobile numbers
  const core = digits.length > 10 ? digits.slice(-10) : digits;
  const normalized = hasPlus ? `+${core}` : core;
  return normalized.slice(0, 20);
}

/** MPF enquiries may omit phone — generate a stable placeholder so sync never skips. */
export function resolveMpfPhone(raw: unknown, externalId?: string | number): string {
  const normalized = normalizePhone(raw);
  const digits = normalized.replace(/\D/g, '');
  if (digits.length >= 7) return normalized.slice(0, 20);

  const rawDigits = String(raw ?? '').replace(/\D/g, '');
  if (rawDigits.length >= 7) {
    const core = rawDigits.length > 10 ? rawDigits.slice(-10) : rawDigits;
    return core.slice(0, 20);
  }

  const id = String(externalId ?? '0').replace(/\D/g, '') || '0';
  return `MPF${id.padStart(7, '0')}`.slice(0, 20);
}

export function normalizeLeadName(raw: unknown): string {
  const value = String(raw ?? '').trim();
  return value.slice(0, 160) || 'Unknown';
}
