// src/lib/sections/gender-balance.ts
// Pure helpers (no server or React imports), so they work in the dialog
// and in the offline preview from the same loaded roster data.
import type { RosterStudent } from "./types";

export type GenderCounts = {
  male: number;
  female: number;
  other: number;
  total: number;
};

type GenderKey = "male" | "female" | "other";

export function normalizeGender(gender: string | null): GenderKey {
  const value = gender?.trim().toLowerCase();
  if (value === "male") return "male";
  if (value === "female") return "female";
  return "other";
}

const emptyCounts = (): GenderCounts => ({
  male: 0,
  female: 0,
  other: 0,
  total: 0,
});

// Male / female / total for a list of students.
export function countGenders(students: RosterStudent[]): GenderCounts {
  const counts = emptyCounts();
  for (const student of students) {
    counts[normalizeGender(student.gender)] += 1;
    counts.total += 1;
  }
  return counts;
}

// One pass over everything: section id -> counts. Sections with no students
// are not in the map, so read it with getCounts().
export function countsBySection(
  students: RosterStudent[],
): Map<string, GenderCounts> {
  const map = new Map<string, GenderCounts>();
  for (const student of students) {
    const counts = map.get(student.sectionId) ?? emptyCounts();
    counts[normalizeGender(student.gender)] += 1;
    counts.total += 1;
    map.set(student.sectionId, counts);
  }
  return map;
}

export function getCounts(
  map: Map<string, GenderCounts>,
  sectionId: string,
): GenderCounts {
  return map.get(sectionId) ?? emptyCounts();
}

// How uneven a section is: |male - female|. 0 = perfectly even.
export function genderGap(counts: GenderCounts): number {
  return Math.abs(counts.male - counts.female);
}

function withChange(
  counts: GenderCounts,
  gender: GenderKey,
  delta: 1 | -1,
): GenderCounts {
  return {
    ...counts,
    [gender]: counts[gender] + delta,
    total: counts.total + delta,
  };
}

export type MovePreview = {
  source: { before: GenderCounts; after: GenderCounts };
  target: { before: GenderCounts; after: GenderCounts };
  overCapacity: boolean; // target would go past its capacity (a warning only)
  targetBalance: "better" | "worse" | "same"; // effect on the target section
  sourceBalance: "better" | "worse" | "same"; // effect on the section being left
};

function compareGap(before: GenderCounts, after: GenderCounts) {
  const diff = genderGap(after) - genderGap(before);
  if (diff < 0) return "better";
  if (diff > 0) return "worse";
  return "same";
}

// What happens to both sections if this student moves.
// capacity = the target section's capacity (usually 40).
export function previewMove(
  counts: Map<string, GenderCounts>,
  student: RosterStudent,
  targetSectionId: string,
  capacity: number,
): MovePreview {
  const gender = normalizeGender(student.gender);

  const sourceBefore = getCounts(counts, student.sectionId);
  const targetBefore = getCounts(counts, targetSectionId);

  const sourceAfter = withChange(sourceBefore, gender, -1);
  const targetAfter = withChange(targetBefore, gender, 1);

  return {
    source: { before: sourceBefore, after: sourceAfter },
    target: { before: targetBefore, after: targetAfter },
    overCapacity: targetAfter.total > capacity,
    targetBalance: compareGap(targetBefore, targetAfter),
    sourceBalance: compareGap(sourceBefore, sourceAfter),
  };
}
