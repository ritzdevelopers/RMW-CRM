export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'site_visit'
  | 'negotiation'
  | 'booked'
  | 'lost';

export type LeadSource =
  | 'website'
  | 'meta'
  | 'google'
  | 'referral'
  | 'walk_in'
  | 'manual'
  | 'import'
  | 'other';

export type Priority = 'low' | 'medium' | 'high';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  role: string;
  role_display?: string;
  role_id: number;
  status: 'active' | 'invited' | 'suspended';
  email_verified_at?: string | null;
  last_login_at?: string | null;
  created_at?: string;
}

export interface Lead {
  id: number;
  name: string;
  email?: string | null;
  phone: string;
  alt_phone?: string | null;
  source: LeadSource;
  campaign?: string | null;
  status: LeadStatus;
  score: number;
  priority: Priority;
  budget_min?: number | null;
  budget_max?: number | null;
  property_type?: string | null;
  location_pref?: string | null;
  city?: string | null;
  builder_id?: number | null;
  builder_name?: string | null;
  assigned_to?: number | null;
  assignee_name?: string | null;
  assignee_avatar?: string | null;
  owner_id?: number | null;
  owner_name?: string | null;
  expected_value?: number | null;
  next_follow_up_at?: string | null;
  last_contacted_at?: string | null;
  lost_reason?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  activities?: LeadActivity[];
}

export interface LeadActivity {
  id: number;
  lead_id: number;
  user_id?: number | null;
  user_name?: string | null;
  user_avatar?: string | null;
  type: string;
  title?: string | null;
  body?: string | null;
  meta_json?: any;
  created_at: string;
}

export interface Builder {
  id: number;
  name: string;
  legal_name?: string | null;
  logo_url?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  rera_number?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  contact_person?: string | null;
  status: 'active' | 'inactive' | 'blacklisted';
  tier: 'a' | 'b' | 'c';
  projects_count: number;
  notes?: string | null;
  linkedLeads?: number;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  type: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  title: string;
  body?: string | null;
  link?: string | null;
  read_at?: string | null;
  created_at: string;
}

export interface Paginated<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardOverview {
  stats: {
    totalLeads: number;
    activeDeals: number;
    bookedDeals: number;
    siteVisits: number;
    revenue: number;
    todayFollowUps: number;
  };
  funnel: { status: LeadStatus; count: number }[];
  sources: { source: LeadSource; count: number }[];
  trend: { month: string; leads: number; booked: number }[];
}
