// src/lib/sections/final-average-action.ts
"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { AuthError, requireRole } from "@/lib/auth/require-role";
import { diffValues, writeAuditLog } from "@/lib/audit/write-audit-log";
import type { RosterActionResult } from "./types";

// Saves (or clears) the final average of one enrollment.
// Pass value = null to clear it. Admin and staff only.
export async function updateFinalAverage(
  enrollmentId: string,
  value: number | null,
): Promise<RosterActionResult> {
  try {
    const actor = await requireRole("admin", "staff");

    if (!enrollmentId || typeof enrollmentId !== "string") {
      return { ok: false, error: "Missing enrollment." };
    }

    // Validate: empty (clear) or a number from 0 to 100, kept to 2 decimals.
    let next: number | null = null;
    if (value !== null) {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return { ok: false, error: "Enter a valid number." };
      }
      if (value < 0 || value > 100) {
        return { ok: false, error: "Final average must be 0 to 100." };
      }
      next = Math.round(value * 100) / 100;
    }

    const admin = createAdminClient();

    const { data: current, error: loadError } = await admin
      .from("enrollments")
      .select("id, learner_id, school_year_id, final_average")
      .eq("id", enrollmentId)
      .maybeSingle();

    if (loadError) {
      console.error("[final-average] load failed:", loadError.message);
      return { ok: false, error: "Could not load the enrollment." };
    }
    if (!current) {
      return { ok: false, error: "Enrollment not found." };
    }

    const previous =
      current.final_average === null ? null : Number(current.final_average);

    // Nothing changed: skip the write and the log.
    if (previous === next) return { ok: true };

    const { error: updateError } = await admin
      .from("enrollments")
      .update({ final_average: next })
      .eq("id", enrollmentId);

    if (updateError) {
      console.error("[final-average] update failed:", updateError.message);
      return { ok: false, error: "Could not save the final average." };
    }

    const { oldValues, newValues } = diffValues(
      { final_average: previous },
      { final_average: next },
    );

    await writeAuditLog({
      entityType: "enrollment",
      entityId: enrollmentId,
      action: "updated",
      actor,
      learnerId: current.learner_id,
      schoolYearId: current.school_year_id,
      oldValues,
      newValues,
    });

    revalidatePath("/admin/sections");
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message };
    }
    console.error("[final-average] unexpected error:", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
