// src/lib/enrollment/approve.ts
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

const SECTION_SOFT_CAP = 40; // recommended size, not a hard limit

const LEARNER_FIELDS = [
  "lrn",
  "psa_birth_certificate_no",
  "last_name",
  "first_name",
  "middle_name",
  "extension_name",
  "birthdate",
  "gender",
  "place_of_birth",
  "religion",
  "mother_tongue",
  "learning_modality_id",
  "is_indigenous",
  "indigenous_specification",
  "is_4ps_beneficiary",
  "four_ps_household_id",
  "current_house_no",
  "current_street",
  "current_barangay_id",
  "current_barangay_other",
  "current_municipality_city",
  "current_province",
  "current_country",
  "current_zip_code",
  "permanent_same_as_current",
  "permanent_house_no",
  "permanent_street",
  "permanent_barangay",
  "permanent_municipality_city",
  "permanent_province",
  "permanent_country",
  "permanent_zip_code",
  "father_last_name",
  "father_first_name",
  "father_middle_name",
  "father_contact_number",
  "mother_last_name",
  "mother_first_name",
  "mother_middle_name",
  "mother_contact_number",
  "guardian_last_name",
  "guardian_first_name",
  "guardian_middle_name",
  "guardian_contact_number",
  "is_sped",
  "sped_category_id",
  "has_pwd_id",
  "last_grade_level_completed",
  "last_school_year_completed",
  "last_school_attended",
  "last_school_id",
] as const;

export type ApproveResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

/**
 * Creates/updates the learner, picks a section, creates the enrollment,
 * then marks the application approved. Safe to retry.
 * Caller MUST have already checked the role (requireRole) and pass the secret-key client.
 */
export async function approveApplicationCore(
  admin: SupabaseClient,
  applicationId: string,
  reviewerId: string,
): Promise<ApproveResult> {
  const fail = (step: string, err: unknown, message: string): ApproveResult => {
    console.error(
      `[approveApplicationCore] step=${step} application=${applicationId}`,
      err,
    );
    return { ok: false, error: message };
  };

  // 1) Load the application
  const { data: app, error: appErr } = await admin
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle();

  if (appErr)
    return fail("load-application", appErr, "Could not load the application.");
  if (!app)
    return fail("load-application", "not found", "Application not found.");
  if (app.deleted_at)
    return fail(
      "load-application",
      "soft-deleted",
      "This application was removed.",
    );
  if (app.average === null || app.average === undefined) {
    return fail(
      "check-average",
      "average is null",
      "Cannot approve: general average is required for sectioning.",
    );
  }

  // 2) Already has an enrollment? Then only make sure the status is approved
  const { data: existingEnrollment, error: enrCheckErr } = await admin
    .from("enrollments")
    .select("id")
    .eq("application_id", app.id)
    .maybeSingle();
  if (enrCheckErr)
    return fail(
      "check-enrollment",
      enrCheckErr,
      "Could not check existing enrollment.",
    );

  if (!existingEnrollment) {
    // 3) Pick a section: first one with room (by section_order); if all are full, the least filled
    let sectionQuery = admin
      .from("sections")
      .select("id, section_order")
      .eq("school_year_id", app.school_year_id)
      .eq("grade_level", app.grade_level);
    sectionQuery = app.track_id
      ? sectionQuery.eq("track_id", app.track_id)
      : sectionQuery.is("track_id", null);
    sectionQuery = app.strand_id
      ? sectionQuery.eq("strand_id", app.strand_id)
      : sectionQuery.is("strand_id", null);

    const { data: sections, error: secErr } = await sectionQuery;
    if (secErr)
      return fail("load-sections", secErr, "Could not load sections.");
    if (!sections || sections.length === 0) {
      return fail(
        "load-sections",
        "none found",
        "Cannot approve: no section exists for this school year, grade level, track and strand.",
      );
    }

    const { data: enrolled, error: countErr } = await admin
      .from("enrollments")
      .select("section_id")
      .in(
        "section_id",
        sections.map((s) => s.id),
      );
    if (countErr)
      return fail(
        "count-enrollments",
        countErr,
        "Could not count section enrollments.",
      );

    const counts = new Map<string, number>();
    for (const row of enrolled ?? []) {
      counts.set(row.section_id, (counts.get(row.section_id) ?? 0) + 1);
    }

    const withRoom = sections
      .filter((s) => (counts.get(s.id) ?? 0) < SECTION_SOFT_CAP)
      .sort((a, b) => a.section_order - b.section_order);

    const chosen =
      withRoom[0] ??
      [...sections].sort(
        (a, b) =>
          (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0) ||
          a.section_order - b.section_order,
      )[0];

    // 4) Create or update the learner (keyed by LRN)
    const { data: existingLearner, error: lookupErr } = await admin
      .from("learners")
      .select("id")
      .eq("lrn", app.lrn)
      .maybeSingle();
    if (lookupErr)
      return fail(
        "lookup-learner",
        lookupErr,
        "Could not check for an existing learner.",
      );
    const learnerWasNew = !existingLearner;

    const learnerPayload: Record<string, unknown> = { status: "active" };
    for (const field of LEARNER_FIELDS) learnerPayload[field] = app[field];
    if (app.profile_picture_url)
      learnerPayload.profile_picture_url = app.profile_picture_url;

    const { data: learner, error: learnerErr } = await admin
      .from("learners")
      .upsert(learnerPayload, { onConflict: "lrn" })
      .select("id")
      .single();
    if (learnerErr || !learner) {
      return fail(
        "upsert-learner",
        learnerErr,
        "Could not save the learner record.",
      );
    }

    // 5) Create the enrollment; if it fails, undo a learner we just created
    const { error: enrollErr } = await admin.from("enrollments").insert({
      learner_id: learner.id,
      school_year_id: app.school_year_id,
      section_id: chosen.id,
      grade_level: app.grade_level,
      average: app.average,
      track_id: app.track_id,
      strand_id: app.strand_id,
      status: "enrolled",
      application_id: app.id,
      enrolled_at: new Date().toISOString(),
    });

    if (enrollErr) {
      if (learnerWasNew) {
        const { error: cleanupErr } = await admin
          .from("learners")
          .delete()
          .eq("id", learner.id);
        if (cleanupErr)
          console.error(
            "[approveApplicationCore] cleanup failed",
            learner.id,
            cleanupErr,
          );
      }
      return fail(
        "insert-enrollment",
        enrollErr,
        "Could not create the enrollment. Nothing was approved.",
      );
    }
  }

  // 6) Mark the application approved (last)
  if (app.status !== "approved") {
    const { error: updateErr } = await admin
      .from("applications")
      .update({
        status: "approved",
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", app.id);
    if (updateErr) {
      return fail(
        "mark-approved",
        updateErr,
        "Enrollment was created but the status update failed. Please click Approve again.",
      );
    }
  }

  return { ok: true, message: "Application approved and learner enrolled." };
}
