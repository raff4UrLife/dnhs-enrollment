// src/lib/sections/roster-data.ts
// Server-only loader for the Section Rosters page.
// It does NOT check roles: the page calls requireRole first, then this.
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RosterData, RosterSection, RosterStudent } from "./types";

const PAGE_SIZE = 1000; // Supabase returns at most 1000 rows per request

type LearnerJoin = {
  lrn: string;
  student_id: string | null;
  last_name: string;
  first_name: string;
  middle_name: string | null;
  extension_name: string | null;
  gender: string | null;
};

type EnrollmentRow = {
  id: string;
  learner_id: string;
  section_id: string;
  average: number | string;
  final_average: number | string | null;
  section_manual: boolean;
  learners: LearnerJoin | null;
};

type SectionRow = {
  id: string;
  grade_level: number;
  strand_id: string | null;
  section_name: string;
  teacher_name: string;
  section_order: number;
  capacity: number;
};

// Uses the given school year, or the active one when none is given.
async function getSchoolYear(schoolYearId?: string) {
  const admin = createAdminClient();
  let query = admin.from("school_years").select("*");
  query = schoolYearId
    ? query.eq("id", schoolYearId)
    : query.eq("is_active", true);

  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw new Error(`school_years: ${error.message}`);
  if (!data) return null;

  const row = data as { id: string; name: string };
  return { id: row.id, label: row.name };
}

// Reads enrollments page by page so a big school year is never cut off at 1000.
async function fetchEnrollments(schoolYearId: string) {
  const admin = createAdminClient();
  const rows: EnrollmentRow[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await admin
      .from("enrollments")
      .select(
        "id, learner_id, section_id, average, final_average, section_manual, " +
          "learners(lrn, student_id, last_name, first_name, middle_name, extension_name, gender)",
      )
      .eq("school_year_id", schoolYearId)
      .not("status", "in", "(dropped,transferred)")
      .order("id")
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(`enrollments: ${error.message}`);

    const page = (data ?? []) as unknown as EnrollmentRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  return rows;
}

export async function loadRosterData(
  schoolYearId?: string,
): Promise<RosterData | null> {
  const year = await getSchoolYear(schoolYearId);
  if (!year) return null;

  const admin = createAdminClient();

  const [sectionsRes, strandsRes, enrollmentRows] = await Promise.all([
    admin
      .from("sections")
      .select(
        "id, grade_level, strand_id, section_name, teacher_name, section_order, capacity",
      )
      .eq("school_year_id", year.id),
    admin.from("strands").select("id, name"),
    fetchEnrollments(year.id),
  ]);

  if (sectionsRes.error) {
    throw new Error(`sections: ${sectionsRes.error.message}`);
  }
  if (strandsRes.error) {
    throw new Error(`strands: ${strandsRes.error.message}`);
  }

  const strandNames = new Map(
    (strandsRes.data ?? []).map((s) => [s.id as string, s.name as string]),
  );

  // Students, sorted by last name then first name.
  const students: RosterStudent[] = enrollmentRows
    .filter((row) => row.learners !== null)
    .map((row) => {
      const learner = row.learners as LearnerJoin;
      return {
        enrollmentId: row.id,
        learnerId: row.learner_id,
        lrn: learner.lrn,
        studentId: learner.student_id,
        lastName: learner.last_name,
        firstName: learner.first_name,
        middleName: learner.middle_name,
        extensionName: learner.extension_name,
        gender: learner.gender,
        average: Number(row.average),
        finalAverage:
          row.final_average === null ? null : Number(row.final_average),
        sectionId: row.section_id,
        sectionManual: row.section_manual,
      };
    })
    .sort(
      (a, b) =>
        a.lastName.localeCompare(b.lastName) ||
        a.firstName.localeCompare(b.firstName),
    );

  // Head count per section.
  const counts = new Map<string, number>();
  for (const student of students) {
    counts.set(student.sectionId, (counts.get(student.sectionId) ?? 0) + 1);
  }

  // Sections, ordered by grade, then strand, then section_order.
  const sections: RosterSection[] = ((sectionsRes.data ?? []) as SectionRow[])
    .map((s) => ({
      id: s.id,
      name: s.section_name,
      teacherName: s.teacher_name,
      gradeLevel: s.grade_level,
      strandLabel: s.strand_id ? (strandNames.get(s.strand_id) ?? null) : null,
      sectionOrder: s.section_order,
      capacity: s.capacity,
      studentCount: counts.get(s.id) ?? 0,
    }))
    .sort(
      (a, b) =>
        a.gradeLevel - b.gradeLevel ||
        (a.strandLabel ?? "").localeCompare(b.strandLabel ?? "") ||
        a.sectionOrder - b.sectionOrder,
    );

  return {
    schoolYearId: year.id,
    schoolYearLabel: year.label,
    sections,
    students,
  };
}
