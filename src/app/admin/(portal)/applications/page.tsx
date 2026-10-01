import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/require-role";

export default async function ApplicationsPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/login");

  return (
    <div>
      <h1 className="text-2xl font-semibold">Hello, {staff.role}</h1>
      <p className="mt-2 text-muted-foreground">This is applications.</p>
    </div>
  );
}
