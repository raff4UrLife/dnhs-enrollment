// src/app/admin/applications/walk-in-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireRole, AuthError } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildApplicationRow } from "@/lib/enrollment/application-row";
import type { ApplicationFormData } from "@/lib/enrollment/types";

export type WalkInDraftResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * Step 1 of the New page: saves the walk-in as a PENDING application and
 * returns its id. Nothing is approved here. The browser then uploads the
 * photo and documents, and calls approveApplication last, so the learner
 * record gets the profile picture.
 */
export async function createWalkInDraft(
  input: ApplicationFormData,
): Promise<WalkInDraftResult> {
  try {
    // Only active admin/staff can encode walk-ins
    await requireRole("admin", "staff");
    const admin = createAdminClient();

    // Walk-ins go into the active school year, even if online applications are switched off
    const { data: schoolYear, error: syErr } = await admin
      .from("school_years")
      .select("id")
      .eq("is_active", true)
      .maybeSingle();
    if (syErr) {
      console.error("[createWalkInDraft] step=school-year", syErr);
      return { ok: false, error: "Could not check the active school year." };
    }
    if (!schoolYear)
      return { ok: false, error: "There is no active school year." };

    // Same validation as the public form
    const built = buildApplicationRow(input, schoolYear.id);
    if (!built.ok) return { ok: false, error: built.error };

    const id = crypto.randomUUID();

    // Channel and status are set here, never taken from the form
    const { error: insertErr } = await admin.from("applications").insert({
      ...built.row,
      id,
      channel: "walk-in",
      status: "pending", // becomes 'approved' later through approveApplication
      reviewed_by: null,
      reviewed_at: null,
      expires_at: null,
    });
    if (insertErr) {
      console.error("[createWalkInDraft] step=insert", insertErr);
      if (insertErr.code === "23505") {
        return {
          ok: false,
          error: "This LRN already has an application on file.",
        };
      }
      return { ok: false, error: "Could not save the walk-in application." };
    }

    revalidatePath("/admin/applications");
    return { ok: true, id };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    console.error("[createWalkInDraft] unexpected", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
