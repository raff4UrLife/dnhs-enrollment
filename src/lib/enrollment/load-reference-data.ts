// src/lib/enrollment/load-reference-data.ts
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DocumentType } from "@/lib/enrollment/types";

export type ReferenceData = {
  schoolYear: { id: string; name: string; application_enabled: boolean } | null;
  tracks: { id: string; name: string }[];
  strands: { id: string; track_id: string; name: string }[];
  modalities: { id: string; name: string }[];
  barangays: { id: string; name: string }[];
  spedCategories: {
    id: string;
    category: "diagnostics" | "manifestations";
    name: string;
  }[];
  documentTypes: DocumentType[];
  // strand id -> grade numbers (e.g. [12]) that have a section in the active school year
  strandGrades: Record<string, number[]>;
};

// Works whether grade_level is stored as 12 or as "Grade 12"
function toGradeNumber(value: unknown): number | null {
  const n = parseInt(String(value).replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

export async function loadReferenceData(): Promise<ReferenceData> {
  const admin = createAdminClient();

  const [schoolYear, tracks, strands, modalities, barangays, sped, docs] =
    await Promise.all([
      // Live check: never cached, so admin changes show on the form immediately
      admin
        .from("school_years")
        .select("id, name, application_enabled")
        .eq("is_active", true)
        .maybeSingle(),
      admin.from("tracks").select("id, name").order("name"),
      admin.from("strands").select("id, track_id, name").order("name"),
      admin.from("learning_modalities").select("id, name").order("name"),
      admin.from("barangays").select("id, name").order("name"),
      admin
        .from("sped_categories")
        .select("id, category, name")
        .order("category")
        .order("name"),
      admin
        .from("document_types")
        .select("id, name")
        .order("created_at")
        .order("name"),
    ]);

  const failed = [
    ["school_years", schoolYear.error],
    ["tracks", tracks.error],
    ["strands", strands.error],
    ["learning_modalities", modalities.error],
    ["barangays", barangays.error],
    ["sped_categories", sped.error],
    ["document_types", docs.error],
  ].filter(([, error]) => error);

  if (failed.length > 0) {
    console.error("[loadReferenceData] failed tables:", failed);
    throw new Error("Could not load the form data.");
  }

  // Which grades each strand has sections for, in the active school year only.
  // ASSUMPTION: table "sections" with columns school_year_id, strand_id, grade_level.
  const strandGrades: Record<string, number[]> = {};
  if (schoolYear.data) {
    const sections = await admin
      .from("sections")
      .select("strand_id, grade_level")
      .eq("school_year_id", schoolYear.data.id)
      .not("strand_id", "is", null);

    if (sections.error) {
      console.error("[loadReferenceData] failed tables:", [
        ["sections", sections.error],
      ]);
      throw new Error("Could not load the form data.");
    }

    for (const row of sections.data ?? []) {
      const grade = toGradeNumber(row.grade_level);
      if (!row.strand_id || grade === null) continue;
      const list = (strandGrades[row.strand_id] ??= []);
      if (!list.includes(grade)) list.push(grade);
    }
    for (const id of Object.keys(strandGrades)) {
      strandGrades[id].sort((a, b) => a - b);
    }
  }

  return {
    schoolYear: schoolYear.data,
    tracks: tracks.data ?? [],
    strands: strands.data ?? [],
    modalities: modalities.data ?? [],
    barangays: barangays.data ?? [],
    spedCategories: (sped.data ?? []) as ReferenceData["spedCategories"],
    strandGrades,
    // The table has no "required" column; all three documents are required
    documentTypes: (docs.data ?? []).map((d) => ({
      id: d.id,
      name: d.name,
      required: true,
    })),
  };
}
