// src/lib/school-years/data.ts
import { createAdminClient } from "@/lib/supabase/admin";

// Plain row shape shared by the online page and the offline page.
// Offline code should use `import type { SchoolYearRow }` so none of
// the server code below ends up in the client bundle.
export type SchoolYearRow = {
  id: string;
  name: string; // e.g. "2026-2027"
  is_active: boolean;
  application_enabled: boolean;
};

// Loads every school year, newest first. No role check here: the page
// that calls this does the role check, same as the other loaders.
export async function getSchoolYears(): Promise<SchoolYearRow[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("school_years")
    .select("id, name, is_active, application_enabled")
    .order("name", { ascending: false });

  if (error) {
    throw new Error(`Could not load school years: ${error.message}`);
  }

  return data ?? [];
}
