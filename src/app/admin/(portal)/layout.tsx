import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
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
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar role={staff.role} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
