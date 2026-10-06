// src/app/admin/(portal)/layout.tsx
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import OfflineSessionSaver from "@/components/offline/offline-session-saver";
import { getCurrentStaff } from "@/lib/auth/require-role";

export default async function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Not signed in, or not an active whitelisted user -> back to login
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/login");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <OfflineSessionSaver role={staff.role} name={staff.name} />
      <AdminSidebar role={staff.role} />
      <main className="min-w-0 flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}

// // src/app/admin/(portal)/layout.tsx
// import { redirect } from "next/navigation";
// import AdminSidebar from "@/components/admin/AdminSidebar";
// import { getCurrentStaff } from "@/lib/auth/require-role";

// export default async function AdminPortalLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   // Not signed in, or not an active whitelisted user -> back to login
//   const staff = await getCurrentStaff();
//   if (!staff) redirect("/admin/login");

//   return (
//     <div className="flex h-screen overflow-hidden bg-slate-100">
//       <AdminSidebar role={staff.role} />
//       <main className="min-w-0 flex-1 overflow-y-auto p-6">{children}</main>
//     </div>
//   );
// }
