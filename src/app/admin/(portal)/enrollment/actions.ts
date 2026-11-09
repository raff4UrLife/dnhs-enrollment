// src/app/admin/(portal)/enrollment/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { AuthError, requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { pickSection } from "@/lib/enrollment/sectioning";
import { loadSectionCandidates } from "@/lib/enrollment/section-data";
import { writeAuditLog } from "@/lib/audit/write-audit-log";

export type SetStrandResult =
  | { ok: true; sectioned: boolean }
  | { ok: false; error: string };

// Sets the strand (and its track) of a Grade 11/12 learner who was promoted
// without one, then sections the learner by average.
export async function setEnrollmentStrand(
  enrollmentId: string,
  strandId: string,
): Promise<SetStrandResult> {
  let staff;
  try {
    staff = await requireRole("admin", "staff");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const supabase = createAdminClient();

  // 1. The enrollment must exist, be Senior High and still have no strand
  const { data: enrollment, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("id, learner_id, school_year_id, grade_level, average, strand_id")
    .eq("id", enrollmentId)
    .maybeSingle();

  if (enrollmentError || !enrollment) {
    console.error("[enrollment] read enrollment failed:", enrollmentError);
    return { ok: false, error: "Could not find that enrollment." };
  }
  if (enrollment.grade_level < 11) {
    return { ok: false, error: "Only Grade 11 and 12 learners have a strand." };
  }
  if (enrollment.strand_id) {
    return {
      ok: false,
      error: "This learner already has a strand. Refresh the page.",
    };
  }

  // 2. The strand gives us the track
  const { data: strand, error: strandError } = await supabase
    .from("strands")
    .select("id, track_id")
    .eq("id", strandId)
    .maybeSingle();

  if (strandError || !strand) {
    console.error("[enrollment] read strand failed:", strandError);
    return { ok: false, error: "Could not find that strand." };
  }

  // 3. Pick the section by average (fresh counts, so earlier picks count)
  const loaded = await loadSectionCandidates(supabase, {
    schoolYearId: enrollment.school_year_id,
    gradeLevel: enrollment.grade_level,
    trackId: strand.track_id,
    strandId: strand.id,
  });
  if (!loaded.ok) return { ok: false, error: loaded.error };

  const sectionId = pickSection(loaded.candidates, Number(enrollment.average));

  // 4. Save. The strand_id IS NULL guard stops two admins from
  //    overwriting each other.
  const { data: updated, error: updateError } = await supabase
    .from("enrollments")
    .update({
      track_id: strand.track_id,
      strand_id: strand.id,
      section_id: sectionId,
    })
    .eq("id", enrollmentId)
    .is("strand_id", null)
    .select("id");

  if (updateError) {
    console.error("[enrollment] update failed:", updateError);
    return { ok: false, error: "Could not save the strand." };
  }
  if (!updated || updated.length === 0) {
    return {
      ok: false,
      error: "This learner was already updated. Refresh the page.",
    };
  }

  // 5. Audit log (never blocks the action)
  await writeAuditLog({
    entityType: "enrollment",
    entityId: enrollmentId,
    action: "strand_set",
    actor: staff,
    learnerId: enrollment.learner_id,
    schoolYearId: enrollment.school_year_id,
    oldValues: { track_id: null, strand_id: null, section_id: null },
    newValues: {
      track_id: strand.track_id,
      strand_id: strand.id,
      section_id: sectionId,
    },
    note: sectionId ? null : "No section available",
  });

  revalidatePath("/admin/enrollment");
  revalidatePath("/admin/sections");
  return { ok: true, sectioned: sectionId !== null };
}
