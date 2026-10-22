// src/app/admin/(portal)/manage-sections/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AuthError,
  requireRole,
  type CurrentStaff,
} from "@/lib/auth/require-role";
import { diffValues, writeAuditLog } from "@/lib/audit/write-audit-log";

export type SectionInput = {
  gradeLevel: number;
  strandId: string | null; // required for Grades 11-12, ignored for 7-10
  sectionName: string;
  teacherName: string;
  sectionOrder: number;
  capacity: number;
};

export type SectionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

type SectionFields = {
  grade_level: number;
  track_id: string | null;
  strand_id: string | null;
  section_name: string;
  teacher_name: string;
  section_order: number;
  capacity: number;
};

const fail = (error: string) => ({ ok: false as const, error });

// Admin only. Returns the signed-in admin or a message to show.
async function getAdmin(): Promise<
  { staff: CurrentStaff } | { error: string }
> {
  try {
    return { staff: await requireRole("admin") };
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    throw err;
  }
}

// Checks the form values and works out the track from the chosen strand.
async function buildFields(
  input: SectionInput,
): Promise<{ ok: true; fields: SectionFields } | { ok: false; error: string }> {
  const sectionName = input.sectionName.trim();
  const teacherName = input.teacherName.trim();

  if (!sectionName) return fail("Enter the section name.");
  if (sectionName.length > 100) {
    return fail("Section name must be 100 characters or less.");
  }
  if (!teacherName) return fail("Enter the adviser's name.");
  if (teacherName.length > 100) {
    return fail("Adviser name must be 100 characters or less.");
  }
  if (
    !Number.isInteger(input.gradeLevel) ||
    input.gradeLevel < 7 ||
    input.gradeLevel > 12
  ) {
    return fail("Choose a grade level from 7 to 12.");
  }
  if (!Number.isInteger(input.sectionOrder) || input.sectionOrder < 1) {
    return fail("Section order must be a whole number of 1 or more.");
  }
  if (!Number.isInteger(input.capacity) || input.capacity < 1) {
    return fail("Capacity must be a whole number of 1 or more.");
  }

  let strandId: string | null = null;
  let trackId: string | null = null;

  if (input.gradeLevel >= 11) {
    if (!input.strandId) return fail("Choose a strand for Grades 11 and 12.");

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("strands")
      .select("id, track_id")
      .eq("id", input.strandId)
      .maybeSingle();

    if (error) {
      console.error("[sections] strand lookup failed:", error.message);
      return fail("Could not check the strand. Please try again.");
    }
    if (!data) return fail("That strand no longer exists.");

    strandId = data.id as string;
    trackId = (data.track_id as string | null) ?? null;
  }

  return {
    ok: true,
    fields: {
      grade_level: input.gradeLevel,
      track_id: trackId,
      strand_id: strandId,
      section_name: sectionName,
      teacher_name: teacherName,
      section_order: input.sectionOrder,
      capacity: input.capacity,
    },
  };
}

// Counts every enrollment row (any status), because the database blocks
// changes and deletes for all of them, not only the active ones.
async function countEnrollments(sectionId: string): Promise<number | null> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("section_id", sectionId);

  if (error) {
    console.error("[sections] enrollment count failed:", error.message);
    return null;
  }
  return count ?? 0;
}

function pickFields(row: Record<string, unknown>): SectionFields {
  return {
    grade_level: row.grade_level as number,
    track_id: (row.track_id as string | null) ?? null,
    strand_id: (row.strand_id as string | null) ?? null,
    section_name: row.section_name as string,
    teacher_name: row.teacher_name as string,
    section_order: row.section_order as number,
    capacity: row.capacity as number,
  };
}

// function refresh() {
//   revalidatePath("/admin/sections");
//   revalidatePath("/admin/sections/manage");
// }

function refresh() {
  revalidatePath("/admin/manage-sections");
  revalidatePath("/admin/sections");
}

const DUPLICATE_NAME =
  "A section with that name already exists for this grade level and school year.";

export async function createSection(
  schoolYearId: string,
  input: SectionInput,
): Promise<SectionResult> {
  const auth = await getAdmin();
  if ("error" in auth) return fail(auth.error);

  const built = await buildFields(input);
  if (!built.ok) return built;

  try {
    const admin = createAdminClient();

    const { data: year, error: yearError } = await admin
      .from("school_years")
      .select("id")
      .eq("id", schoolYearId)
      .maybeSingle();
    if (yearError || !year) return fail("That school year was not found.");

    const { data, error } = await admin
      .from("sections")
      .insert({ school_year_id: schoolYearId, ...built.fields })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") return fail(DUPLICATE_NAME);
      console.error("[sections] create failed:", error.message);
      return fail("Could not add the section. Nothing was saved.");
    }

    await writeAuditLog({
      entityType: "section",
      entityId: data.id as string,
      action: "create",
      actor: auth.staff,
      schoolYearId,
      newValues: built.fields,
    });

    refresh();
    return { ok: true, id: data.id as string };
  } catch (err) {
    console.error("[sections] create error:", err);
    return fail("Something went wrong. Nothing was saved.");
  }
}

export async function updateSection(
  sectionId: string,
  input: SectionInput,
): Promise<SectionResult> {
  const auth = await getAdmin();
  if ("error" in auth) return fail(auth.error);

  const built = await buildFields(input);
  if (!built.ok) return built;

  try {
    const admin = createAdminClient();

    const { data: existing, error: loadError } = await admin
      .from("sections")
      .select("*")
      .eq("id", sectionId)
      .maybeSingle();
    if (loadError) {
      console.error("[sections] load failed:", loadError.message);
      return fail("Could not load the section. Please try again.");
    }
    if (!existing) return fail("That section no longer exists.");

    const before = pickFields(existing as Record<string, unknown>);
    const { oldValues, newValues } = diffValues(before, built.fields);
    if (Object.keys(newValues).length === 0) {
      return { ok: true, id: sectionId }; // nothing changed
    }

    // Grade and strand decide where learners belong, so they stay fixed
    // while the section has learners.
    const gradeOrStrandChanged =
      before.grade_level !== built.fields.grade_level ||
      before.strand_id !== built.fields.strand_id;
    if (gradeOrStrandChanged) {
      const enrolled = await countEnrollments(sectionId);
      if (enrolled === null) {
        return fail("Could not check the learners in this section.");
      }
      if (enrolled > 0) {
        return fail(
          "The grade level and strand cannot be changed while learners are in this section. Move them to another section first.",
        );
      }
    }

    const { error } = await admin
      .from("sections")
      .update(built.fields)
      .eq("id", sectionId);

    if (error) {
      if (error.code === "23505") return fail(DUPLICATE_NAME);
      console.error("[sections] update failed:", error.message);
      return fail("Could not save the changes. Nothing was changed.");
    }

    await writeAuditLog({
      entityType: "section",
      entityId: sectionId,
      action: "update",
      actor: auth.staff,
      schoolYearId: existing.school_year_id as string,
      oldValues,
      newValues,
    });

    refresh();
    return { ok: true, id: sectionId };
  } catch (err) {
    console.error("[sections] update error:", err);
    return fail("Something went wrong. Nothing was changed.");
  }
}

export async function deleteSection(sectionId: string): Promise<SectionResult> {
  const auth = await getAdmin();
  if ("error" in auth) return fail(auth.error);

  try {
    const admin = createAdminClient();

    const { data: existing, error: loadError } = await admin
      .from("sections")
      .select("*")
      .eq("id", sectionId)
      .maybeSingle();
    if (loadError) {
      console.error("[sections] load failed:", loadError.message);
      return fail("Could not load the section. Please try again.");
    }
    if (!existing) return fail("That section was already deleted.");

    const enrolled = await countEnrollments(sectionId);
    if (enrolled === null) {
      return fail("Could not check the learners in this section.");
    }
    if (enrolled > 0) {
      return fail(
        `This section still has ${enrolled} enrollment record${enrolled === 1 ? "" : "s"}. Move the learners to another section first.`,
      );
    }

    const { error } = await admin.from("sections").delete().eq("id", sectionId);
    if (error) {
      console.error("[sections] delete failed:", error.message);
      return fail("Could not delete the section.");
    }

    await writeAuditLog({
      entityType: "section",
      entityId: sectionId,
      action: "delete",
      actor: auth.staff,
      schoolYearId: existing.school_year_id as string,
      oldValues: pickFields(existing as Record<string, unknown>),
    });

    refresh();
    return { ok: true, id: sectionId };
  } catch (err) {
    console.error("[sections] delete error:", err);
    return fail("Something went wrong. Nothing was deleted.");
  }
}
