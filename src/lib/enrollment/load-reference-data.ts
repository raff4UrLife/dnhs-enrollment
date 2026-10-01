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
};

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

  return {
    schoolYear: schoolYear.data,
    tracks: tracks.data ?? [],
    strands: strands.data ?? [],
    modalities: modalities.data ?? [],
    barangays: barangays.data ?? [],
    spedCategories: (sped.data ?? []) as ReferenceData["spedCategories"],
    // The table has no "required" column; all three documents are required
    documentTypes: (docs.data ?? []).map((d) => ({
      id: d.id,
      name: d.name,
      required: true,
    })),
  };
}
