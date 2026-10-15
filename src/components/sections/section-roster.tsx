// src/components/sections/section-roster.tsx
"use client";

import { useMemo, useState } from "react";
import type {
  RosterActionResult,
  RosterData,
  RosterPermissions,
} from "@/lib/sections/types";
import { countsBySection } from "@/lib/sections/gender-balance";
import { filterRoster } from "@/lib/sections/roster-filter";
import { OverrideSectionDialog } from "./override-section-dialog";
import { RosterTable } from "./roster-table";
import { RosterToolbar } from "./roster-toolbar";
import {
  SectionPicker,
  defaultPickerValue,
  type PickerValue,
} from "./section-picker";

type SectionRosterProps = {
  data: RosterData;
  permissions: RosterPermissions;
  // The page passes the server actions. The offline preview passes nothing
  // and sets both permissions to false, so nothing here needs the server.
  onSaveFinalAverage?: (
    enrollmentId: string,
    value: number | null,
  ) => Promise<RosterActionResult>;
  onOverrideSection?: (
    enrollmentId: string,
    newSectionId: string,
    note?: string,
  ) => Promise<RosterActionResult>;
};

const NOT_AVAILABLE = async (): Promise<RosterActionResult> => ({
  ok: false,
  error: "This action is not available right now.",
});

// Owns all the screen state (selection, search, filter, page, dialog) and
// composes the picker, toolbar, table and move dialog.
export function SectionRoster({
  data,
  permissions,
  onSaveFinalAverage = NOT_AVAILABLE,
  onOverrideSection = NOT_AVAILABLE,
}: SectionRosterProps) {
  const [scope, setScope] = useState<PickerValue>(() =>
    defaultPickerValue(data.sections),
  );
  const [search, setSearch] = useState("");
  const [missingOnly, setMissingOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [movingId, setMovingId] = useState<string | null>(null);

  // Gender counts for every section, used by the move dialog.
  const counts = useMemo(() => countsBySection(data.students), [data.students]);

  const result = useMemo(
    () =>
      filterRoster({
        students: data.students,
        sections: data.sections,
        scope,
        search,
        missingOnly,
      }),
    [data.students, data.sections, scope, search, missingOnly],
  );

  // Looked up by id so the dialog always sees fresh data after a refresh.
  const movingStudent = movingId
    ? (data.students.find((s) => s.enrollmentId === movingId) ?? null)
    : null;

  // Every change to what is shown goes back to page 1.
  function changeScope(next: PickerValue) {
    setScope(next);
    setPage(1);
  }
  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }
  function changeMissingOnly(value: boolean) {
    setMissingOnly(value);
    setPage(1);
  }

  if (data.sections.length === 0) {
    return (
      <p className="rounded-lg border bg-white px-4 py-10 text-center text-sm text-muted-foreground">
        There are no sections for S.Y. {data.schoolYearLabel} yet.
      </p>
    );
  }

  const filtering = search.trim() !== "" || missingOnly;

  return (
    <div className="space-y-4">
      <SectionPicker
        sections={data.sections}
        value={scope}
        onChange={changeScope}
      />

      <RosterToolbar
        search={search}
        onSearchChange={changeSearch}
        missingOnly={missingOnly}
        onMissingOnlyChange={changeMissingOnly}
        missingCount={result.missingCount}
        showMissingFilter={permissions.canEditFinalAverage}
      />

      <RosterTable
        students={result.students}
        sections={data.sections}
        page={page}
        onPageChange={setPage}
        permissions={permissions}
        onSaveFinalAverage={onSaveFinalAverage}
        onMove={(student) => setMovingId(student.enrollmentId)}
        emptyMessage={
          filtering
            ? "No learners match your search or filter."
            : "No learners in this selection yet."
        }
      />

      {permissions.canOverrideSection && (
        <OverrideSectionDialog
          student={movingStudent}
          sections={data.sections}
          counts={counts}
          onOpenChange={(open) => {
            if (!open) setMovingId(null);
          }}
          onSave={onOverrideSection}
        />
      )}
    </div>
  );
}
