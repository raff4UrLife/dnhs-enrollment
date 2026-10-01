import {
  LayoutDashboard,
  FileText,
  GraduationCap,
  LayoutGrid,
  CalendarDays,
  Network,
  Database,
  UserCog,
  MonitorSmartphone,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type Role = "admin" | "staff" | "teacher";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

// Visible to every role (teacher = view only, staff = can approve, admin = full)
export const mainNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/applications", label: "Applications", icon: FileText },
  { href: "/admin/learners", label: "Learner Records", icon: GraduationCap },
  { href: "/admin/sections", label: "Section Rosters", icon: LayoutGrid },
];

// Visible to admin only
export const adminNav: NavItem[] = [
  { href: "/admin/school-years", label: "School Years", icon: CalendarDays },
  { href: "/admin/tracks-strands", label: "Tracks & Strands", icon: Network },
  { href: "/admin/reference-data", label: "Reference Data", icon: Database },
  { href: "/admin/users", label: "System Users", icon: UserCog },
  { href: "/admin/sessions", label: "Sessions", icon: MonitorSmartphone },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

// Which groups a given role can see
export function getNavForRole(role: Role) {
  return {
    main: mainNav,
    admin: role === "admin" ? adminNav : [],
  };
}
