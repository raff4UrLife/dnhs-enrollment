// src/app/admin/(portal)/applications/_lib/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { AuthError, requireRole } from "@/lib/auth/require-role";
import {
  approveApplicationCore,
  type ApproveResult,
} from "@/lib/enrollment/approve";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function approveApplication(
  applicationId: string,
): Promise<ApproveResult> {
  // Never trust the client: check the id again here
  if (typeof applicationId !== "string" || !UUID_RE.test(applicationId)) {
    return { ok: false, error: "Invalid application." };
  }

  try {
    // Only admin and staff can approve (teachers are view-only)
    const staff = await requireRole("admin", "staff");
    const admin = createAdminClient();

    // Same logic as walk-ins: learner + section + enrollment, then status, then email
    const result = await approveApplicationCore(admin, applicationId, staff.id);

    if (result.ok) revalidatePath("/admin/applications");
    return result;
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    console.error("[approveApplication] unexpected", applicationId, err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
