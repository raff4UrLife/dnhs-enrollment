// src/lib/admin/navItems.ts
import {
  LayoutDashboard,
  FileText,
  GraduationCap,
  ClipboardList,
  LayoutGrid,
  LayoutList,
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
  // Leave out to show the item to every role
  roles?: Role[];
};

// Teacher = view only, staff = can approve, admin = full.
// Items with `roles` are shown only to those roles.
export const mainNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/applications", label: "Applications", icon: FileText },
  { href: "/admin/learners", label: "Learner Records", icon: GraduationCap },
  {
    href: "/admin/enrollment",
    label: "Enrollment",
    icon: ClipboardList,
    roles: ["admin", "staff"],
  },
  { href: "/admin/sections", label: "Section Rosters", icon: LayoutGrid },
  { href: "/admin/school-years", label: "School Years", icon: CalendarDays },
];

// Visible to admin only
export const adminNav: NavItem[] = [
  {
    href: "/admin/manage-sections",
    label: "Manage Sections",
    icon: LayoutList,
  },
  { href: "/admin/tracks-strands", label: "Tracks & Strands", icon: Network },
  { href: "/admin/reference-data", label: "Reference Data", icon: Database },
  { href: "/admin/users", label: "System Users", icon: UserCog },
  { href: "/admin/sessions", label: "Sessions", icon: MonitorSmartphone },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

// Which items a given role can see
export function getNavForRole(role: Role) {
  return {
    main: mainNav.filter((item) => !item.roles || item.roles.includes(role)),
    admin: role === "admin" ? adminNav : [],
  };
}

// // src/lib/admin/navItems.ts
// import {
//   LayoutDashboard,
//   FileText,
//   GraduationCap,
//   LayoutGrid,
//   LayoutList,
//   CalendarDays,
//   Network,
//   Database,
//   UserCog,
//   MonitorSmartphone,
//   Settings,
//   type LucideIcon,
// } from "lucide-react";

// export type Role = "admin" | "staff" | "teacher";

// export type NavItem = {
//   href: string;
//   label: string;
//   icon: LucideIcon;
// };

// // Visible to every role (teacher = view only, staff = can approve, admin = full)
// export const mainNav: NavItem[] = [
//   { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
//   { href: "/admin/applications", label: "Applications", icon: FileText },
//   { href: "/admin/learners", label: "Learner Records", icon: GraduationCap },
//   { href: "/admin/sections", label: "Section Rosters", icon: LayoutGrid },
//   { href: "/admin/school-years", label: "School Years", icon: CalendarDays },
// ];

// // Visible to admin only
// export const adminNav: NavItem[] = [
//   {
//     href: "/admin/manage-sections",
//     label: "Manage Sections",
//     icon: LayoutList,
//   },
//   { href: "/admin/tracks-strands", label: "Tracks & Strands", icon: Network },
//   { href: "/admin/reference-data", label: "Reference Data", icon: Database },
//   { href: "/admin/users", label: "System Users", icon: UserCog },
//   { href: "/admin/sessions", label: "Sessions", icon: MonitorSmartphone },
//   { href: "/admin/settings", label: "Settings", icon: Settings },
// ];

// // Which groups a given role can see
// export function getNavForRole(role: Role) {
//   return {
//     main: mainNav,
//     admin: role === "admin" ? adminNav : [],
//   };
// }
