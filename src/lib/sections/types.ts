// src/lib/sections/types.ts
// Shared shapes for the Section Rosters feature.
// Plain, serializable data only (no Supabase types), so the same objects can
// come from the server loader or from the offline IndexedDB cache.

export type RosterSection = {
  id: string;
  name: string; // sections.section_name
  teacherName: string;
  gradeLevel: number;
  strandLabel: string | null; // null for Grades 7-10
  sectionOrder: number;
  capacity: number; // sections.capacity (soft cap, usually 40)
  studentCount: number;
};

export type RosterStudent = {
  enrollmentId: string;
  learnerId: string;
  lrn: string;
  studentId: string | null;
  lastName: string;
  firstName: string;
  middleName: string | null;
  extensionName: string | null;
  gender: string | null;
  average: number; // entry average, used for sectioning
  finalAverage: number | null; // entered at year end
  sectionId: string;
  sectionManual: boolean; // true = admin/staff moved the learner by hand
};

export type RosterData = {
  schoolYearId: string;
  schoolYearLabel: string;
  sections: RosterSection[];
  students: RosterStudent[];
};

// Who can change what on the page. Teachers get both as false.
export type RosterPermissions = {
  canEditFinalAverage: boolean;
  canOverrideSection: boolean;
};

// Return shape shared by the two server actions.
export type RosterActionResult = { ok: true } | { ok: false; error: string };
