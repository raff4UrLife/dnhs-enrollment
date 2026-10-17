// src/components/sections/export-button.tsx
"use client";

import { Download } from "lucide-react";
import type { RosterSection, RosterStudent } from "@/lib/sections/types";
import { buildRosterCsv, rosterFileName } from "@/lib/sections/roster-export";
import type { RosterScope } from "@/lib/sections/roster-filter";

type ExportButtonProps = {
  // Every learner that matches the pickers and filters (all pages, not only
  // the 20 on screen). The export sorts them by section itself.
  students: RosterStudent[];
  sections: RosterSection[];
  schoolYearLabel: string;
  scope: RosterScope; // used only for the file name
};

// Downloads the current selection as a CSV. Nothing here talks to the server,
// so it works online and in the offline preview, and for all roles.
export function ExportButton({
  students,
  sections,
  schoolYearLabel,
  scope,
}: ExportButtonProps) {
  const empty = students.length === 0;

  function handleExport() {
    if (empty) return;

    const section = scope.sectionId
      ? sections.find((s) => s.id === scope.sectionId)
      : undefined;

    const fileName = rosterFileName({
      schoolYear: schoolYearLabel,
      grade: scope.grade,
      strand: scope.strand,
      sectionName: section?.name ?? null,
    });

    const csv = buildRosterCsv(students, sections);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();

    // Free the temporary file after the browser has started the download.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={empty}
      title={
        empty
          ? "No learners to export"
          : `Export ${students.length} learners to CSV`
      }
      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-input bg-white px-3 text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Download className="size-4" />
      Export CSV
    </button>
  );
}
