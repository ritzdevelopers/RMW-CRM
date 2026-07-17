import {
  LayoutDashboard,
  Users,
  Building2,
  UserCog,
  ShieldCheck,
  Bell,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string; // required permission (super_admin bypasses)
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const NAV: NavSection[] = [
  {
    items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'CRM',
    items: [
      { label: 'Leads', href: '/leads', icon: Users, permission: 'leads.read' },
      { label: 'Builders', href: '/builders', icon: Building2, permission: 'builders.read' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Users', href: '/users', icon: UserCog, permission: 'users.read' },
      { label: 'Roles & Permissions', href: '/roles', icon: ShieldCheck, permission: 'roles.read' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Notifications', href: '/notifications', icon: Bell },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];
