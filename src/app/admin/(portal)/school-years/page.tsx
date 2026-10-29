// src/app/admin/(portal)/school-years/page.tsx
import { CalendarDays, Info, Inbox, Layers } from "lucide-react";
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

  const active = rows.find((row) => row.is_active);
  const applicationsOpen = active?.application_enabled ?? false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">School Years</h1>
          <div className="mt-1.5 h-1 w-full rounded-full bg-primary" />
          <p className="mt-2 text-sm text-muted-foreground">
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

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl bg-secondary p-5 text-secondary-foreground shadow-sm">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white/10">
            <CalendarDays className="size-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-secondary-foreground/70">
              Current school year
            </p>
            <p className="truncate text-2xl font-bold text-primary">
              {active ? active.name : "None set"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
            <Inbox className="size-5 text-secondary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Online applications
            </p>
            <p
              className={
                applicationsOpen
                  ? "text-2xl font-bold text-secondary"
                  : "text-2xl font-bold text-muted-foreground"
              }
            >
              {active ? (applicationsOpen ? "Open" : "Closed") : "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
            <Layers className="size-5 text-secondary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total school years
            </p>
            <p className="text-2xl font-bold text-secondary">{rows.length}</p>
          </div>
        </div>
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

      {/* Info note */}
      <div className="flex items-start gap-3 rounded-xl border border-secondary/15 bg-secondary/5 px-4 py-3 text-sm text-secondary">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          Only one school year can be active. Closing online applications stops
          new submissions.
        </p>
      </div>
    </div>
  );
}
