// src/app/admin/(portal)/school-years/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { promoteLearners } from "@/lib/school-years/promote-learners";

export type ActionResult = { ok: true } | { ok: false; error: string };

function refresh() {
  revalidatePath("/admin/school-years");
  // The public form reads the active year and application_enabled live.
  revalidatePath("/enrollment-form");
}

// Makes one school year the active one. Only one can be active at a time:
// the current active year is switched off automatically, and online
// applications are closed for every year except the new active one.
export async function setActiveSchoolYear(id: string): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = createAdminClient();

  // Remember the current active year so we can put it back if anything fails
  const { data: current, error: currentError } = await supabase
    .from("school_years")
    .select("id")
    .eq("is_active", true)
    .neq("id", id);

  if (currentError) {
    console.error("[school-years] read active failed:", currentError);
    return { ok: false, error: "Could not read the current active year." };
  }

  const previousIds = (current ?? []).map((row) => row.id);

  // 1. Switch the old active year off first
  if (previousIds.length > 0) {
    const { error: offError } = await supabase
      .from("school_years")
      .update({ is_active: false })
      .in("id", previousIds);

    if (offError) {
      console.error("[school-years] switch off failed:", offError);
      return {
        ok: false,
        error: "Could not switch off the previous school year.",
      };
    }
  }

  // 2. Then switch the chosen year on
  const { error: onError } = await supabase
    .from("school_years")
    .update({ is_active: true })
    .eq("id", id);

  if (onError) {
    console.error("[school-years] set active failed:", onError);
    // Put the old year back so the system is never left with no active year
    if (previousIds.length > 0) {
      await supabase
        .from("school_years")
        .update({ is_active: true })
        .in("id", previousIds);
    }
    return { ok: false, error: "Could not set the active school year." };
  }

  // 3. Only the active year may accept online applications, so close all
  //    the others (this also cleans up any that were left open before)
  const { error: closeError } = await supabase
    .from("school_years")
    .update({ application_enabled: false })
    .neq("id", id);

  refresh();

  if (closeError) {
    console.error("[school-years] close others failed:", closeError);
    return {
      ok: false,
      error:
        "The active year was changed, but online applications of the other years could not be closed.",
    };
  }

  return { ok: true };
}

// Opens or closes online pre-enrollment. Only the active school year can be
// opened; closing is always allowed.
export async function setApplicationEnabled(
  id: string,
  enabled: boolean,
): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = createAdminClient();

  if (enabled) {
    const { data: year, error: yearError } = await supabase
      .from("school_years")
      .select("is_active")
      .eq("id", id)
      .maybeSingle();

    if (yearError || !year) {
      return { ok: false, error: "Could not find that school year." };
    }
    if (!year.is_active) {
      return {
        ok: false,
        error: "Only the active school year can accept online applications.",
      };
    }
  }

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
  | {
      ok: true;
      copiedSections: number;
      promoted: number;
      retained: number;
      graduated: number;
      needsStrand: number;
    }
  | { ok: false; error: string };

// Removes a half-created year. Its enrollments are already cleaned up by
// promoteLearners when it fails; sections are removed first in case the
// foreign key does not cascade.
async function undoNewYear(
  supabase: ReturnType<typeof createAdminClient>,
  schoolYearId: string,
) {
  await supabase.from("sections").delete().eq("school_year_id", schoolYearId);
  await supabase.from("school_years").delete().eq("id", schoolYearId);
}

// Creates a new school year (inactive, applications closed), copies the
// sections of the latest earlier year into it, then moves last year's
// active learners into it (promoted, retained or graduated).
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

  // Latest year before the new one is the source of sections and learners
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
      await undoNewYear(supabase, created.id);
      return { ok: false, error: "Could not read the previous sections." };
    }

    if (oldSections && oldSections.length > 0) {
      // One bulk insert, not one query per section
      const { error: copyError } = await supabase
        .from("sections")
        .insert(oldSections.map((s) => ({ ...s, school_year_id: created.id })));

      if (copyError) {
        await undoNewYear(supabase, created.id);
        return { ok: false, error: "Could not copy the sections." };
      }
      copiedSections = oldSections.length;
    }
  }

  // Move last year's active learners into the new year. Needs the new
  // sections to exist, so it runs after the copy above.
  let promoted = 0;
  let retained = 0;
  let graduated = 0;
  let needsStrand = 0;

  if (previous) {
    const result = await promoteLearners(previous.id, created.id);
    if (!result.ok) {
      await undoNewYear(supabase, created.id);
      return { ok: false, error: result.error };
    }
    ({ promoted, retained, graduated, needsStrand } = result);
  }

  refresh();
  return {
    ok: true,
    copiedSections,
    promoted,
    retained,
    graduated,
    needsStrand,
  };
}
