// src/lib/sections/override-section-action.ts
"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { AuthError, requireRole } from "@/lib/auth/require-role";
import { diffValues, writeAuditLog } from "@/lib/audit/write-audit-log";
import type { RosterActionResult } from "./types";

// Moves one learner to another section by hand. Admin and staff only.
// Sets section_manual = true so the learner is marked as moved manually.
// A full section (40 or more) is allowed: the warning is shown in the dialog.
export async function overrideSection(
  enrollmentId: string,
  newSectionId: string,
  note?: string,
): Promise<RosterActionResult> {
  try {
    const actor = await requireRole("admin", "staff");

    if (!enrollmentId || !newSectionId) {
      return { ok: false, error: "Missing enrollment or section." };
    }

    const admin = createAdminClient();

    const { data: enrollment, error: enrollmentError } = await admin
      .from("enrollments")
      .select(
        "id, learner_id, school_year_id, section_id, grade_level, strand_id, section_manual",
      )
      .eq("id", enrollmentId)
      .maybeSingle();

    if (enrollmentError) {
      console.error(
        "[override] load enrollment failed:",
        enrollmentError.message,
      );
      return { ok: false, error: "Could not load the enrollment." };
    }
    if (!enrollment) {
      return { ok: false, error: "Enrollment not found." };
    }

    // Same section: nothing to do.
    if (enrollment.section_id === newSectionId) return { ok: true };

    const { data: sections, error: sectionsError } = await admin
      .from("sections")
      .select("id, school_year_id, grade_level, strand_id, section_name")
      .in("id", [enrollment.section_id, newSectionId]);

    if (sectionsError) {
      console.error("[override] load sections failed:", sectionsError.message);
      return { ok: false, error: "Could not load the sections." };
    }

    const oldSection = sections?.find((s) => s.id === enrollment.section_id);
    const newSection = sections?.find((s) => s.id === newSectionId);

    if (!newSection) {
      return { ok: false, error: "Section not found." };
    }

    // The new section must be the same school year, grade level and strand.
    if (newSection.school_year_id !== enrollment.school_year_id) {
      return {
        ok: false,
        error: "That section is in a different school year.",
      };
    }
    if (newSection.grade_level !== enrollment.grade_level) {
      return {
        ok: false,
        error: "That section is in a different grade level.",
      };
    }
    if ((newSection.strand_id ?? null) !== (enrollment.strand_id ?? null)) {
      return { ok: false, error: "That section is in a different strand." };
    }

    const { error: updateError } = await admin
      .from("enrollments")
      .update({ section_id: newSectionId, section_manual: true })
      .eq("id", enrollmentId);

    if (updateError) {
      console.error("[override] update failed:", updateError.message);
      return { ok: false, error: "Could not move the learner." };
    }

    const { oldValues, newValues } = diffValues(
      {
        section_id: enrollment.section_id,
        section_name: oldSection?.section_name ?? null,
        section_manual: enrollment.section_manual,
      },
      {
        section_id: newSectionId,
        section_name: newSection.section_name,
        section_manual: true,
      },
    );

    await writeAuditLog({
      entityType: "enrollment",
      entityId: enrollmentId,
      action: "section_changed",
      actor,
      learnerId: enrollment.learner_id,
      schoolYearId: enrollment.school_year_id,
      oldValues,
      newValues,
      note: note?.trim() ? note.trim().slice(0, 300) : null,
    });

    revalidatePath("/admin/sections");
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message };
    }
    console.error("[override] unexpected error:", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
