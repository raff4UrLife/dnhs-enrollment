// src/lib/sections/manage-data.ts
// Server-only loader for the admin Manage Sections page.
// It does NOT check roles: the page calls getCurrentStaff first, then this.
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const PAGE_SIZE = 1000; // Supabase returns at most 1000 rows per request

export type ManageSchoolYear = {
  id: string;
  label: string;
  isActive: boolean;
};

export type ManageStrand = {
  id: string;
  name: string;
  trackName: string | null;
};

export type ManageSection = {
  id: string;
  name: string;
  teacherName: string;
  gradeLevel: number;
  strandId: string | null;
  strandLabel: string | null;
  sectionOrder: number;
  capacity: number;
  // Every enrollment row in this section, any status. The database blocks
  // changing a section's grade/strand or deleting it while this is above 0.
  enrollmentCount: number;
};

export type ManageData = {
  schoolYearId: string;
  schoolYearLabel: string;
  schoolYears: ManageSchoolYear[];
  strands: ManageStrand[];
  sections: ManageSection[];
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

type SchoolYearRow = {
  id: string;
  name: string;
  is_active: boolean;
};

type StrandRow = {
  id: string;
  name: string;
  track_id: string | null;
};

// Uses the given school year, or the active one when none is given.
async function getSchoolYear(schoolYearId?: string) {
  const admin = createAdminClient();
  let query = admin.from("school_years").select("id, name");
  query = schoolYearId
    ? query.eq("id", schoolYearId)
    : query.eq("is_active", true);

  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw new Error(`school_years: ${error.message}`);
  if (!data) return null;

  const row = data as { id: string; name: string };
  return { id: row.id, label: row.name };
}

// Every school year for the dropdown, newest first.
async function fetchSchoolYears(): Promise<ManageSchoolYear[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("school_years")
    .select("id, name, is_active")
    .order("name", { ascending: false });

  if (error) throw new Error(`school_years list: ${error.message}`);

  return ((data ?? []) as SchoolYearRow[]).map((row) => ({
    id: row.id,
    label: row.name,
    isActive: row.is_active,
  }));
}

// Strands for the Grade 11-12 dropdown, grouped by track name.
async function fetchStrands(): Promise<ManageStrand[]> {
  const admin = createAdminClient();
  const [strandsRes, tracksRes] = await Promise.all([
    admin.from("strands").select("id, name, track_id"),
    admin.from("tracks").select("id, name"),
  ]);

  if (strandsRes.error) {
    throw new Error(`strands: ${strandsRes.error.message}`);
  }
  if (tracksRes.error) {
    throw new Error(`tracks: ${tracksRes.error.message}`);
  }

  const trackNames = new Map(
    (tracksRes.data ?? []).map((t) => [t.id as string, t.name as string]),
  );

  return ((strandsRes.data ?? []) as StrandRow[])
    .map((s) => ({
      id: s.id,
      name: s.name,
      trackName: s.track_id ? (trackNames.get(s.track_id) ?? null) : null,
    }))
    .sort(
      (a, b) =>
        (a.trackName ?? "").localeCompare(b.trackName ?? "") ||
        a.name.localeCompare(b.name),
    );
}

// Counts enrollments per section, any status, reading page by page so a
// big school year is never cut off at 1000 rows.
async function fetchEnrollmentCounts(schoolYearId: string) {
  const admin = createAdminClient();
  const counts = new Map<string, number>();

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await admin
      .from("enrollments")
      .select("id, section_id")
      .eq("school_year_id", schoolYearId)
      .order("id")
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(`enrollments: ${error.message}`);

    const page = (data ?? []) as { id: string; section_id: string }[];
    for (const row of page) {
      counts.set(row.section_id, (counts.get(row.section_id) ?? 0) + 1);
    }
    if (page.length < PAGE_SIZE) break;
  }

  return counts;
}

export async function loadManageData(
  schoolYearId?: string,
): Promise<ManageData | null> {
  const year = await getSchoolYear(schoolYearId);
  if (!year) return null;

  const admin = createAdminClient();

  const [sectionsRes, strands, counts, schoolYears] = await Promise.all([
    admin
      .from("sections")
      .select(
        "id, grade_level, strand_id, section_name, teacher_name, section_order, capacity",
      )
      .eq("school_year_id", year.id),
    fetchStrands(),
    fetchEnrollmentCounts(year.id),
    fetchSchoolYears(),
  ]);

  if (sectionsRes.error) {
    throw new Error(`sections: ${sectionsRes.error.message}`);
  }

  const strandNames = new Map(strands.map((s) => [s.id, s.name]));

  // Sections, ordered by grade, then strand, then section_order.
  const sections: ManageSection[] = ((sectionsRes.data ?? []) as SectionRow[])
    .map((s) => ({
      id: s.id,
      name: s.section_name,
      teacherName: s.teacher_name,
      gradeLevel: s.grade_level,
      strandId: s.strand_id,
      strandLabel: s.strand_id ? (strandNames.get(s.strand_id) ?? null) : null,
      sectionOrder: s.section_order,
      capacity: s.capacity,
      enrollmentCount: counts.get(s.id) ?? 0,
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
    schoolYears,
    strands,
    sections,
  };
}
