// src/lib/school-years/promotion-data.ts
import { createAdminClient } from "@/lib/supabase/admin";

export type PreviousEnrollment = {
  learnerId: string;
  gradeLevel: number;
  trackId: string | null;
  strandId: string | null;
  entryAverage: number;
  finalAverage: number | null;
};

export type LoadPreviousResult =
  | { ok: true; rows: PreviousEnrollment[] }
  | { ok: false; error: string };

type RawRow = {
  learner_id: string;
  grade_level: number;
  track_id: string | null;
  strand_id: string | null;
  average: number | string;
  final_average: number | string | null;
};

const PAGE_SIZE = 1000; // Supabase returns at most 1000 rows per request

// Loads last year's enrollments of ACTIVE learners only. Inactive learners
// are not promoted and do not enter the new school year.
export async function loadPreviousEnrollments(
  previousSchoolYearId: string,
): Promise<LoadPreviousResult> {
  const supabase = createAdminClient();
  const rows: PreviousEnrollment[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("enrollments")
      .select(
        "learner_id, grade_level, track_id, strand_id, average, final_average, learners!inner(status)",
      )
      .eq("school_year_id", previousSchoolYearId)
      .eq("learners.status", "active")
      .order("id")
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      return { ok: false, error: "Could not read the previous enrollments." };
    }

    const page = (data ?? []) as unknown as RawRow[];

    for (const row of page) {
      rows.push({
        learnerId: row.learner_id,
        gradeLevel: row.grade_level,
        trackId: row.track_id,
        strandId: row.strand_id,
        entryAverage: Number(row.average),
        finalAverage:
          row.final_average === null ? null : Number(row.final_average),
      });
    }

    if (page.length < PAGE_SIZE) break;
  }

  return { ok: true, rows };
}
