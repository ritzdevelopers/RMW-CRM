import type { LeadStatus, LeadSource, Priority } from '@/types';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline';

export const LEAD_STATUS_META: Record<LeadStatus, { label: string; variant: BadgeVariant; dot: string }> = {
  new: { label: 'New', variant: 'default', dot: 'bg-primary' },
  contacted: { label: 'Contacted', variant: 'secondary', dot: 'bg-blue-500' },
  qualified: { label: 'Qualified', variant: 'secondary', dot: 'bg-violet-500' },
  site_visit: { label: 'Site Visit', variant: 'warning', dot: 'bg-amber-500' },
  negotiation: { label: 'Negotiation', variant: 'warning', dot: 'bg-orange-500' },
  booked: { label: 'Booked', variant: 'success', dot: 'bg-emerald-500' },
  lost: { label: 'Lost', variant: 'destructive', dot: 'bg-rose-500' },
};

export const LEAD_STATUS_ORDER: LeadStatus[] = [
  'new',
  'contacted',
  'qualified',
  'site_visit',
  'negotiation',
  'booked',
  'lost',
];

export const LEAD_SOURCE_META: Record<LeadSource, { label: string }> = {
  website: { label: 'Website' },
  meta: { label: 'Meta Ads' },
  google: { label: 'Google Ads' },
  referral: { label: 'Referral' },
  walk_in: { label: 'Walk-in' },
  manual: { label: 'Manual' },
  import: { label: 'Import' },
  other: { label: 'Other' },
};

export const PRIORITY_META: Record<Priority, { label: string; variant: BadgeVariant }> = {
  low: { label: 'Low', variant: 'secondary' },
  medium: { label: 'Medium', variant: 'default' },
  high: { label: 'High', variant: 'destructive' },
};

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  sales_manager: 'Sales Manager',
  sales_executive: 'Sales Executive',
  telecaller: 'Telecaller',
  marketing: 'Marketing',
  customer_support: 'Customer Support',
};

export const BUILDER_TIER_META: Record<string, { label: string; variant: BadgeVariant }> = {
  a: { label: 'Tier A', variant: 'success' },
  b: { label: 'Tier B', variant: 'default' },
  c: { label: 'Tier C', variant: 'secondary' },
};

export const BUILDER_STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  active: { label: 'Active', variant: 'success' },
  inactive: { label: 'Inactive', variant: 'secondary' },
  blacklisted: { label: 'Blacklisted', variant: 'destructive' },
};
