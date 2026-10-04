// src/lib/enrollment/section-data.ts
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SectionCandidate } from "@/lib/enrollment/sectioning";

export type SectionScope = {
  schoolYearId: string;
  gradeLevel: number;
  trackId: string | null; // null for Grades 7 to 10
  strandId: string | null; // null for Grades 7 to 10
};

export type LoadSectionsResult =
  | { ok: true; candidates: SectionCandidate[] } // may be empty
  | { ok: false; error: string };

/**
 * Loads the active sections for one school year + grade (+ track and strand
 * for Senior High), each with how many learners are currently enrolled in it.
 */
export async function loadSectionCandidates(
  admin: SupabaseClient,
  scope: SectionScope,
): Promise<LoadSectionsResult> {
  let query = admin
    .from("sections")
    .select("id, section_order, min_average, capacity")
    .eq("school_year_id", scope.schoolYearId)
    .eq("grade_level", scope.gradeLevel)
    .eq("status", "active");
  query = scope.trackId
    ? query.eq("track_id", scope.trackId)
    : query.is("track_id", null);
  query = scope.strandId
    ? query.eq("strand_id", scope.strandId)
    : query.is("strand_id", null);

  const { data: sections, error: sectionErr } = await query;
  if (sectionErr) {
    console.error("[section-data] step=load-sections", sectionErr);
    return { ok: false, error: "Could not load sections." };
  }
  if (!sections || sections.length === 0) return { ok: true, candidates: [] };

  // Only learners still enrolled count toward a section's size
  const { data: enrolled, error: countErr } = await admin
    .from("enrollments")
    .select("section_id")
    .in(
      "section_id",
      sections.map((s) => s.id),
    )
    .eq("status", "enrolled");
  if (countErr) {
    console.error("[section-data] step=count-enrollments", countErr);
    return { ok: false, error: "Could not count section enrollments." };
  }

  const counts = new Map<string, number>();
  for (const row of enrolled ?? []) {
    counts.set(row.section_id, (counts.get(row.section_id) ?? 0) + 1);
  }

  const candidates: SectionCandidate[] = sections.map((s) => ({
    id: s.id,
    sectionOrder: s.section_order,
    minAverage: s.min_average === null ? null : Number(s.min_average),
    capacity: s.capacity,
    count: counts.get(s.id) ?? 0,
  }));

  return { ok: true, candidates };
}
