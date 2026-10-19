// src/components/sections/roster-row.tsx
"use client";

import { ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  RosterActionResult,
  RosterPermissions,
  RosterStudent,
} from "@/lib/sections/types";
import { FinalAverageCell } from "./final-average-cell";

type RosterRowProps = {
  student: RosterStudent;
  number: number; // display number (1, 2, 3...), worked out by the table, never stored
  sectionName: string;
  sectionOrder: number | null; // sections.section_order, null if the section isn't found
  strandLabel?: string | null; // strand of the learner's section, null for Grades 7-10
  showStrand?: boolean; // the table turns this on when any row has a strand (Grades 11-12)
  permissions: RosterPermissions;
  // Passed down from the page (updateFinalAverage). No server code is imported here.
  onSaveFinalAverage: (
    enrollmentId: string,
    value: number | null,
  ) => Promise<RosterActionResult>;
  // Opens the move dialog for this learner.
  onMove: (student: RosterStudent) => void;
};

function formatName(s: RosterStudent): string {
  const middle = s.middleName ? ` ${s.middleName.charAt(0)}.` : "";
  const ext = s.extensionName ? ` ${s.extensionName}` : "";
  return `${s.lastName}, ${s.firstName}${middle}${ext}`;
}

// One <tr> of the roster. The column order must match roster-table.tsx.
export function RosterRow({
  student,
  number,
  sectionName,
  sectionOrder,
  strandLabel = null,
  showStrand = false,
  permissions,
  onSaveFinalAverage,
  onMove,
}: RosterRowProps) {
  const name = formatName(student);

  return (
    <tr className="border-b last:border-0 hover:bg-muted/40">
      <td className="px-3 py-2 text-sm text-muted-foreground">{number}</td>

      <td className="px-3 py-2 font-mono text-sm">{student.lrn}</td>

      <td className="px-3 py-2 text-sm font-medium">{name}</td>

      <td className="px-3 py-2 text-sm">{student.gender ?? "—"}</td>

      <td className="px-3 py-2 text-right text-sm">
        {student.average.toFixed(2)}
      </td>

      <td className="px-3 py-2 text-right text-sm">
        <FinalAverageCell
          // A new key makes the cell restart when a different learner lands on this row.
          key={student.enrollmentId}
          enrollmentId={student.enrollmentId}
          value={student.finalAverage}
          canEdit={permissions.canEditFinalAverage}
          onSave={onSaveFinalAverage}
        />
      </td>

      {showStrand && (
        <td className="px-3 py-2 text-sm">{strandLabel ?? "—"}</td>
      )}

      <td className="px-3 py-2 text-sm">
        <div className="flex items-center gap-2">
          <span>{sectionName}</span>
          {student.sectionManual && (
            <span
              title="Moved by hand by admin or staff"
              className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-300"
            >
              Manual
            </span>
          )}
        </div>
      </td>

      <td className="px-3 py-2 text-center text-sm text-muted-foreground">
        {sectionOrder ?? "—"}
      </td>

      {permissions.canOverrideSection && (
        <td className="px-3 py-2 text-right">
          <Button
            type="button"
            size="sm"
            className="bg-sky-500"
            aria-label={`Move ${name} to another section`}
            onClick={() => onMove(student)}
          >
            <ArrowRightLeft className="size-4" />
            Move
          </Button>
        </td>
      )}
    </tr>
  );
}
