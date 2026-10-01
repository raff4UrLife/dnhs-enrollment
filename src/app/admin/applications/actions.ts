// src/app/admin/applications/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireRole, AuthError } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  approveApplicationCore,
  type ApproveResult,
} from "@/lib/enrollment/approve";
import { buildApplicationRow } from "@/lib/enrollment/application-row";
import type { ApplicationFormData } from "@/lib/enrollment/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function approveApplication(
  applicationId: string,
): Promise<ApproveResult> {
  try {
    // Only active admin/staff can approve (teachers are rejected)
    const staff = await requireRole("admin", "staff");
    const admin = createAdminClient();

    const result = await approveApplicationCore(admin, applicationId, staff.id);

    if (result.ok) revalidatePath("/admin/applications");
    return result;
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    console.error("[approveApplication] unexpected", applicationId, err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

// clientId is optional: the offline queue can mint a UUID in the browser so a retried sync never creates a duplicate.
export async function createWalkInApplication(
  input: ApplicationFormData,
  clientId?: string,
): Promise<ApproveResult> {
  try {
    // Only active admin/staff can encode walk-ins
    const staff = await requireRole("admin", "staff");
    const admin = createAdminClient();

    // 1) Walk-ins go into the active school year, even if online applications are switched off
    const { data: schoolYear, error: syErr } = await admin
      .from("school_years")
      .select("id")
      .eq("is_active", true)
      .maybeSingle();

    if (syErr) {
      console.error("[createWalkInApplication] step=school-year", syErr);
      return { ok: false, error: "Could not check the active school year." };
    }
    if (!schoolYear)
      return { ok: false, error: "There is no active school year." };

    // 2) Same validation as the public form
    const built = buildApplicationRow(input, schoolYear.id);
    if (!built.ok) return { ok: false, error: built.error };

    const id =
      clientId && UUID_RE.test(clientId) ? clientId : crypto.randomUUID();

    // 3) Save the application. Channel and status are set here, never taken from the form.
    const { error: insertErr } = await admin.from("applications").insert({
      ...built.row,
      id,
      channel: "walk-in",
      status: "pending", // becomes 'approved' inside approveApplicationCore
      reviewed_by: null,
      reviewed_at: null,
      expires_at: null,
    });

    if (insertErr) {
      console.error("[createWalkInApplication] step=insert", insertErr);
      if (insertErr.code === "23505") {
        return {
          ok: false,
          error: "This LRN already has an application on file.",
        };
      }
      return { ok: false, error: "Could not save the walk-in application." };
    }

    // 4) Approve right away: learner + section + enrollment
    const result = await approveApplicationCore(admin, id, staff.id);

    if (!result.ok) {
      // Remove the half-done application so the same LRN can be re-encoded after fixing the problem
      const { error: cleanupErr } = await admin
        .from("applications")
        .delete()
        .eq("id", id);
      if (cleanupErr)
        console.error(
          "[createWalkInApplication] cleanup failed",
          id,
          cleanupErr,
        );
      return result;
    }

    revalidatePath("/admin/applications");
    return { ok: true, message: "Walk-in encoded, approved, and enrolled." };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    console.error("[createWalkInApplication] unexpected", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
