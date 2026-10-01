// src/app/enrollment-form/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildApplicationRow } from "@/lib/enrollment/application-row";
import type { ApplicationFormData } from "@/lib/enrollment/types";

export type SubmitResult =
  | { ok: true; applicationId: string }
  | { ok: false; error: string };

export async function submitApplication(
  input: ApplicationFormData,
): Promise<SubmitResult> {
  try {
    const admin = createAdminClient();

    // 1) Live check: is there an active school year that accepts applications?
    const { data: schoolYear, error: syErr } = await admin
      .from("school_years")
      .select("id, application_enabled")
      .eq("is_active", true)
      .maybeSingle();

    if (syErr) {
      console.error("[submitApplication] step=school-year", syErr);
      return {
        ok: false,
        error: "Could not check the enrollment period. Please try again.",
      };
    }
    if (!schoolYear || !schoolYear.application_enabled) {
      return { ok: false, error: "Online applications are currently closed." };
    }

    // 2) Validate and clean the form data (server never trusts the browser)
    const built = buildApplicationRow(input, schoolYear.id);
    if (!built.ok) return { ok: false, error: built.error };

    // 3) Pending applications expire after settings.pending_application_expiry_days
    const { data: settings, error: settingsErr } = await admin
      .from("settings")
      .select("pending_application_expiry_days")
      .eq("id", 1)
      .maybeSingle();

    let expiresAt: string | null = null;
    if (settingsErr || !settings) {
      console.error(
        "[submitApplication] step=settings (saving without expiry)",
        settingsErr,
      );
    } else {
      const days = settings.pending_application_expiry_days as number;
      expiresAt = new Date(
        Date.now() + days * 24 * 60 * 60 * 1000,
      ).toISOString();
    }

    // 4) Save. Channel and status are set here, never taken from the form.
    const id = crypto.randomUUID();
    const { error: insertErr } = await admin.from("applications").insert({
      ...built.row,
      id,
      channel: "online",
      status: "pending",
      reviewed_by: null,
      reviewed_at: null,
      expires_at: expiresAt,
    });

    if (insertErr) {
      console.error("[submitApplication] step=insert", insertErr);
      if (insertErr.code === "23505") {
        return {
          ok: false,
          error: "This LRN already has an application on file.",
        };
      }
      return {
        ok: false,
        error: "Could not submit your application. Please try again.",
      };
    }

    revalidatePath("/admin/applications");
    return { ok: true, applicationId: id };
  } catch (err) {
    console.error("[submitApplication] unexpected", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
