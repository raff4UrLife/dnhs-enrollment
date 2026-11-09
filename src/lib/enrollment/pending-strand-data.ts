// src/lib/enrollment/pending-strand-data.ts
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type PendingStrandRow = {
  enrollmentId: string;
  learnerId: string;
  lrn: string | null;
  lastName: string;
  firstName: string;
  middleName: string | null;
  gradeLevel: number;
  average: number;
};

export type PendingStrandResult =
  | {
      ok: true;
      schoolYear: { id: string; name: string };
      rows: PendingStrandRow[];
    }
  | { ok: false; error: string };

type RawRow = {
  id: string;
  learner_id: string;
  grade_level: number;
  average: number | string;
  learners: {
    lrn: string | null;
    last_name: string;
    first_name: string;
    middle_name: string | null;
  };
};

// Active school year's Senior High enrollments that still have no strand
// (learners promoted from Grade 10). Only active learners are listed.
export async function loadPendingStrand(): Promise<PendingStrandResult> {
  const supabase = createAdminClient();

  // Live fetch: never hardcode the active year
  const { data: year, error: yearError } = await supabase
    .from("school_years")
    .select("id, name")
    .eq("is_active", true)
    .maybeSingle();

  if (yearError) {
    console.error("[pending-strand] read active year failed:", yearError);
    return { ok: false, error: "Could not read the active school year." };
  }
  if (!year) {
    return { ok: false, error: "There is no active school year." };
  }

  const { data, error } = await supabase
    .from("enrollments")
    .select(
      "id, learner_id, grade_level, average, learners!inner(lrn, last_name, first_name, middle_name)",
    )
    .eq("school_year_id", year.id)
    .eq("status", "enrolled")
    .in("grade_level", [11, 12])
    .is("strand_id", null)
    .eq("learners.status", "active")
    .order("last_name", { referencedTable: "learners", ascending: true })
    .range(0, 999);

  if (error) {
    console.error("[pending-strand] read enrollments failed:", error);
    return { ok: false, error: "Could not read the enrollments." };
  }

  const rows = ((data ?? []) as unknown as RawRow[]).map((row) => ({
    enrollmentId: row.id,
    learnerId: row.learner_id,
    lrn: row.learners.lrn,
    lastName: row.learners.last_name,
    firstName: row.learners.first_name,
    middleName: row.learners.middle_name,
    gradeLevel: row.grade_level,
    average: Number(row.average),
  }));

  return { ok: true, schoolYear: { id: year.id, name: year.name }, rows };
}
