// src/components/sections/section-picker.tsx
"use client";

import { useMemo } from "react";
import type { RosterSection } from "@/lib/sections/types";
import { SelectField, type SelectOption } from "./select-field";

// The selection lives in the parent (plain React state), so this also works offline.
// grade: "" is never used, strand: "" = all strands, sectionId: "" = all sections.
export type PickerValue = {
  grade: string;
  strand: string;
  sectionId: string;
};

type SectionPickerProps = {
  sections: RosterSection[];
  value: PickerValue;
  onChange: (next: PickerValue) => void;
};

// Starting selection: the lowest grade, all sections.
export function defaultPickerValue(sections: RosterSection[]): PickerValue {
  const grades = sections.map((s) => s.gradeLevel);
  const first = grades.length > 0 ? Math.min(...grades) : "";
  return { grade: String(first), strand: "", sectionId: "" };
}

export function SectionPicker({
  sections,
  value,
  onChange,
}: SectionPickerProps) {
  const gradeOptions = useMemo<SelectOption[]>(() => {
    const grades = [...new Set(sections.map((s) => s.gradeLevel))].sort(
      (a, b) => a - b,
    );
    return grades.map((g) => ({ value: String(g), label: `Grade ${g}` }));
  }, [sections]);

  const gradeSections = useMemo(
    () => sections.filter((s) => String(s.gradeLevel) === value.grade),
    [sections, value.grade],
  );

  // Only Grades 11-12 have strands.
  const strandOptions = useMemo<SelectOption[]>(() => {
    const labels = new Set<string>();
    for (const s of gradeSections) {
      if (s.strandLabel) labels.add(s.strandLabel);
    }
    return [...labels]
      .sort((a, b) => a.localeCompare(b))
      .map((label) => ({ value: label, label }));
  }, [gradeSections]);

  const showStrand = strandOptions.length > 0;

  const sectionOptions = useMemo<SelectOption[]>(
    () =>
      gradeSections
        .filter((s) => !value.strand || s.strandLabel === value.strand)
        .map((s) => ({
          value: s.id,
          label: `${s.name} (${s.studentCount}/${s.capacity})`,
        })),
    [gradeSections, value.strand],
  );

  return (
    <div
      className={
        showStrand ? "grid gap-3 sm:grid-cols-3" : "grid gap-3 sm:grid-cols-2"
      }
    >
      <SelectField
        label="Grade level"
        value={value.grade}
        options={gradeOptions}
        onChange={(grade) => onChange({ grade, strand: "", sectionId: "" })}
      />

      {showStrand && (
        <SelectField
          label="Strand"
          value={value.strand}
          options={strandOptions}
          placeholder="All strands"
          active={value.strand !== ""}
          onChange={(strand) =>
            onChange({ grade: value.grade, strand, sectionId: "" })
          }
        />
      )}

      <SelectField
        label="Section"
        value={value.sectionId}
        options={sectionOptions}
        placeholder="All sections"
        active={value.sectionId !== ""}
        onChange={(sectionId) => onChange({ ...value, sectionId })}
      />
    </div>
  );
}
