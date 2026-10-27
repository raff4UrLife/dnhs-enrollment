// src/app/admin/(portal)/school-years/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionResult = { ok: true } | { ok: false; error: string };

function refresh() {
  revalidatePath("/admin/school-years");
  // The public form reads the active year and application_enabled live.
  revalidatePath("/enrollment-form");
}

// Makes one school year the active one. Only one can be active at a time.
export async function setActiveSchoolYear(id: string): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = createAdminClient();

  // Turn the chosen year on first, then turn the others off, so a failure
  // in between can never leave the system with no active year.
  const { error: onError } = await supabase
    .from("school_years")
    .update({ is_active: true })
    .eq("id", id);

  if (onError) {
    return { ok: false, error: "Could not set the active school year." };
  }

  const { error: offError } = await supabase
    .from("school_years")
    .update({ is_active: false })
    .neq("id", id);

  if (offError) {
    return {
      ok: false,
      error: "Could not switch off the previous school year.",
    };
  }

  refresh();
  return { ok: true };
}

// Opens or closes online pre-enrollment for one school year.
export async function setApplicationEnabled(
  id: string,
  enabled: boolean,
): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("school_years")
    .update({ application_enabled: enabled })
    .eq("id", id);

  if (error) {
    return { ok: false, error: "Could not update the application setting." };
  }

  refresh();
  return { ok: true };
}

export type CreateSchoolYearResult =
  | { ok: true; copiedSections: number }
  | { ok: false; error: string };

// Creates a new school year (inactive, applications closed) and copies the
// sections of the latest earlier year into it. No learners are copied.
export async function createSchoolYear(
  name: string,
): Promise<CreateSchoolYearResult> {
  await requireRole("admin");
  const supabase = createAdminClient();

  const trimmed = name.trim();
  const match = /^(\d{4})-(\d{4})$/.exec(trimmed);
  if (!match || Number(match[2]) !== Number(match[1]) + 1) {
    return {
      ok: false,
      error:
        "Use the format 2027-2028 (the second year is the first plus one).",
    };
  }

  // Duplicate check
  const { data: existing, error: existingError } = await supabase
    .from("school_years")
    .select("id")
    .eq("name", trimmed)
    .maybeSingle();

  if (existingError) {
    return { ok: false, error: "Could not check existing school years." };
  }
  if (existing) {
    return { ok: false, error: `School year ${trimmed} already exists.` };
  }

  // Latest year before the new one is the source of the sections
  const { data: previous, error: previousError } = await supabase
    .from("school_years")
    .select("id")
    .lt("name", trimmed)
    .order("name", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (previousError) {
    return { ok: false, error: "Could not find the previous school year." };
  }

  // Create the new year (defaults: is_active false, application_enabled false)
  const { data: created, error: createError } = await supabase
    .from("school_years")
    .insert({ name: trimmed })
    .select("id")
    .single();

  if (createError || !created) {
    return { ok: false, error: "Could not create the school year." };
  }

  let copiedSections = 0;

  if (previous) {
    const { data: oldSections, error: sectionsError } = await supabase
      .from("sections")
      .select(
        "grade_level, track_id, strand_id, section_name, teacher_name, section_order, capacity, status, min_average",
      )
      .eq("school_year_id", previous.id);

    if (sectionsError) {
      await supabase.from("school_years").delete().eq("id", created.id);
      return { ok: false, error: "Could not read the previous sections." };
    }

    if (oldSections && oldSections.length > 0) {
      // One bulk insert, not one query per section
      const { error: copyError } = await supabase
        .from("sections")
        .insert(oldSections.map((s) => ({ ...s, school_year_id: created.id })));

      if (copyError) {
        // Undo the new year so nothing is left half-created
        await supabase.from("school_years").delete().eq("id", created.id);
        return { ok: false, error: "Could not copy the sections." };
      }
      copiedSections = oldSections.length;
    }
  }

  refresh();
  return { ok: true, copiedSections };
}
