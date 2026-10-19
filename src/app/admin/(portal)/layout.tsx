// src/app/admin/(portal)/layout.tsx
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import OfflineSessionSaver from "@/components/offline/offline-session-saver";
import ReferenceDataSaver from "@/components/offline/reference-data-saver";
import { getCurrentStaff } from "@/lib/auth/require-role";
import { loadReferenceData } from "@/lib/enrollment/load-reference-data";

export default async function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Not signed in, or not an active whitelisted user -> back to login
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/login");

  // Only admin and staff can encode walk-ins, so only they need a copy of the
  // form's dropdown data on this computer. Teachers skip the extra load.
  const canEncode = staff.role === "admin" || staff.role === "staff";
  const reference = canEncode ? await loadReferenceData() : null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <OfflineSessionSaver role={staff.role} name={staff.name} />
      {reference && <ReferenceDataSaver data={reference} />}
      <AdminSidebar role={staff.role} />
      <main className="min-w-0 flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
