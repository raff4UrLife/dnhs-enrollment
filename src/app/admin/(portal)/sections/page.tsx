// src/app/admin/(portal)/sections/page.tsx
import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/require-role";
import { loadRosterData } from "@/lib/sections/roster-data";
import type { RosterPermissions } from "@/lib/sections/types";
import { SectionRosterConnected } from "@/components/sections/section-roster-connected";

export default async function SectionsPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/login");

  // Admin and staff can enter final averages and move learners.
  // Teachers can only view. The server actions check this again on their own.
  const canEdit = staff.role === "admin" || staff.role === "staff";
  const permissions: RosterPermissions = {
    canEditFinalAverage: canEdit,
    canOverrideSection: canEdit,
  };

  const data = await loadRosterData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Section Rosters</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data
            ? `Learners per section for S.Y. ${data.schoolYearLabel}`
            : "Learners per section"}
        </p>
      </div>

      {data ? (
        <SectionRosterConnected data={data} permissions={permissions} />
      ) : (
        <p className="rounded-lg border bg-white px-4 py-10 text-center text-sm text-muted-foreground">
          There is no active school year yet. Set one in School Year Management.
        </p>
      )}
    </div>
  );
}
