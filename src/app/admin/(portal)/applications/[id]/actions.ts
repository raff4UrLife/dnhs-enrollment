// src/app/admin/(portal)/applications/[id]/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { getCurrentStaff } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildApplicationRow } from "@/lib/enrollment/application-row";

export type SaveResult = { ok: true } | { ok: false; error: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function updateApplication(
  id: string,
  raw: unknown,
): Promise<SaveResult> {
  // Admin and staff only; teachers are view-only
  const staff = await getCurrentStaff();
  if (!staff || (staff.role !== "admin" && staff.role !== "staff")) {
    return {
      ok: false,
      error: "You do not have permission to edit applications.",
    };
  }

  if (!UUID_RE.test(id)) return { ok: false, error: "Application not found." };

  const admin = createAdminClient();

  // Load the current row: it must exist and still be pending
  const { data: current, error: loadError } = await admin
    .from("applications")
    .select("id, status, school_year_id")
    .eq("id", id)
    .maybeSingle();

  if (loadError) return { ok: false, error: "Could not load the application." };
  if (!current) return { ok: false, error: "Application not found." };
  if (current.status !== "pending") {
    return {
      ok: false,
      error: "Only pending applications can be edited.",
    };
  }

  // Same validation as the public form; the school year stays as it was
  const built = buildApplicationRow(raw, current.school_year_id);
  if (!built.ok) return { ok: false, error: built.error };

  // The status check is repeated here so a row approved a moment ago
  // (by someone else) is never overwritten
  const { data: updated, error } = await admin
    .from("applications")
    .update(built.row)
    .eq("id", id)
    .eq("status", "pending")
    .select("id");

  if (error) {
    // 23505 = unique violation (the LRN unique index)
    if (error.code === "23505") {
      return { ok: false, error: "LRN already has an application on file." };
    }
    return {
      ok: false,
      error: "Could not save the changes. Please try again.",
    };
  }
  if (!updated || updated.length === 0) {
    return {
      ok: false,
      error:
        "This application was already approved, so it can no longer be edited.",
    };
  }

  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${id}`);
  return { ok: true };
}
