"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { AuthError, requireRole } from "@/lib/auth/require-role";

export type ApproveResult = { ok: true } | { ok: false; error: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function approveApplication(
  applicationId: string,
): Promise<ApproveResult> {
  // Never trust the client: check the id again here
  if (typeof applicationId !== "string" || !UUID_RE.test(applicationId)) {
    return { ok: false, error: "Invalid application." };
  }

  // Only admin and staff can approve (teachers are view-only)
  let staff;
  try {
    staff = await requireRole("admin", "staff");
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: e.message };
    return { ok: false, error: "Something went wrong. Try again." };
  }

  const admin = createAdminClient();

  // Only a row that is still pending gets updated, so two people approving
  // the same application can't overwrite each other's review
  const { data, error } = await admin
    .from("applications")
    .update({
      status: "approved",
      reviewed_by: staff.id,
      reviewed_at: new Date().toISOString(),
      expires_at: null, // approved applications must never expire
    })
    .eq("id", applicationId)
    .eq("status", "pending")
    .select("id");

  if (error) {
    return { ok: false, error: "Could not approve. Try again." };
  }
  if (!data || data.length === 0) {
    return {
      ok: false,
      error: "This application was already approved or no longer exists.",
    };
  }

  revalidatePath("/admin/applications");
  return { ok: true };
}
