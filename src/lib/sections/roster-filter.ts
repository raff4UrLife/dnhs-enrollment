// src/lib/sections/roster-filter.ts
// Pure helper (no server or React imports): the same logic runs on the page
// and in the offline preview.
import type { RosterSection, RosterStudent } from "./types";

// Same shape as PickerValue in section-picker.tsx. Declared here so this
// file doesn't import from a client component.
export type RosterScope = {
  grade: string;
  strand: string; // "" = all strands
  sectionId: string; // "" = all sections
};

export type RosterFilterInput = {
  students: RosterStudent[];
  sections: RosterSection[];
  scope: RosterScope;
  search: string;
  missingOnly: boolean;
};

export type RosterFilterResult = {
  students: RosterStudent[]; // what the table shows (before pagination)
  missingCount: number; // no final average, within the scope and search
};

function fullName(student: RosterStudent): string {
  return [
    student.lastName,
    student.firstName,
    student.middleName,
    student.extensionName,
  ]
    .filter(Boolean)
    .join(" ");
}

// Every typed word must appear somewhere in the LRN, student ID or name,
// so "dela cruz juan" and "juan cruz" both work. Case-insensitive.
function matchesSearch(student: RosterStudent, words: string[]): boolean {
  if (words.length === 0) return true;
  const haystack =
    `${student.lrn} ${student.studentId ?? ""} ${fullName(student)}`.toLowerCase();
  return words.every((word) => haystack.includes(word));
}

export function filterRoster({
  students,
  sections,
  scope,
  search,
  missingOnly,
}: RosterFilterInput): RosterFilterResult {
  const sectionById = new Map(sections.map((s) => [s.id, s]));
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);

  // Grade, strand, section and search come first. The missing toggle is applied
  // after, so the count always shows how many the toggle would reveal.
  const inScope = students.filter((student) => {
    const section = sectionById.get(student.sectionId);
    if (!section) return false;
    if (String(section.gradeLevel) !== scope.grade) return false;
    if (scope.strand && section.strandLabel !== scope.strand) return false;
    if (scope.sectionId && student.sectionId !== scope.sectionId) return false;
    return matchesSearch(student, words);
  });

  const missingCount = inScope.filter((s) => s.finalAverage === null).length;

  return {
    students: missingOnly
      ? inScope.filter((s) => s.finalAverage === null)
      : inScope,
    missingCount,
  };
}
