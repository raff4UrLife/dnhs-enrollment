import { requireRole } from "@/lib/auth/require-role";
import { getSchoolYears } from "@/lib/school-years/data";
import { SchoolYearsTable } from "@/components/school-years/school-years-table";
import { CreateSchoolYearDialog } from "@/components/school-years/create-school-year-dialog";
import {
  createSchoolYear,
  setActiveSchoolYear,
  setApplicationEnabled,
} from "./actions";

// "2026-2027" -> "2027-2028". Empty if there is no year yet.
function nextSchoolYearName(latest?: string): string {
  const match = latest ? /^(\d{4})-(\d{4})$/.exec(latest) : null;
  if (!match) return "";
  return `${Number(match[1]) + 1}-${Number(match[2]) + 1}`;
}

export default async function SchoolYearsPage() {
  // Every role can view this page; only admins get the controls.
  const { role } = await requireRole("admin", "staff", "teacher");

  const rows = await getSchoolYears(); // newest first
  const isAdmin = role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">School Years</h1>
          <p className="text-sm text-muted-foreground">
            Manage the active school year and online applications.
          </p>
        </div>

        {isAdmin && (
          <CreateSchoolYearDialog
            suggestedName={nextSchoolYearName(rows[0]?.name)}
            onCreate={createSchoolYear}
          />
        )}
      </div>

      <SchoolYearsTable
        rows={rows}
        actions={
          isAdmin
            ? {
                onSetActive: setActiveSchoolYear,
                onSetApplicationEnabled: setApplicationEnabled,
              }
            : undefined
        }
      />
    </div>
  );
}
