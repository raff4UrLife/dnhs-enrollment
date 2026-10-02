//src/app/admin/(portal)/applications/_lib/queries.ts
// (only the start of getApplications changes)
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ApplicationFilters } from "./search-params";
import {
  PAGE_SIZE,
  type ApplicationRow,
  type ApplicationsResult,
} from "./types";

const COLUMNS =
  "id, lrn, last_name, first_name, middle_name, grade_level, gender, status, strands ( name )";

// The join can come back as an object or a one-item array
type RawRow = Omit<ApplicationRow, "strand_name"> & {
  strands: { name: string } | { name: string }[] | null;
};

export async function getApplications(
  f: ApplicationFilters,
): Promise<ApplicationsResult> {
  const admin = createAdminClient();

  // The school year picked in the filter, or the active one when none is picked
  let schoolYearId: string | null = f.schoolYear;

  if (!schoolYearId) {
    const { data: year } = await admin
      .from("school_years")
      .select("id")
      .eq("is_active", true)
      .maybeSingle();
    schoolYearId = year?.id ?? null;
  }

  // No school year picked and none active: nothing to show
  if (!schoolYearId) return { rows: [], total: 0, page: 1 };
  const yearId: string = schoolYearId;

  async function run(page: number) {
    let query = admin
      .from("applications")
      .select(COLUMNS, { count: "exact" })
      .eq("school_year_id", yearId);

    // Every word must match LRN or one of the name columns,
    // so "juan cruz" finds Cruz, Juan
    for (const word of f.q.split(" ").filter(Boolean).slice(0, 5)) {
      const p = `%${word}%`;
      query = query.or(
        `lrn.ilike.${p},last_name.ilike.${p},first_name.ilike.${p},middle_name.ilike.${p}`,
      );
    }

    if (f.grade !== null) query = query.eq("grade_level", f.grade);
    if (f.strand) query = query.eq("strand_id", f.strand);
    if (f.barangay) query = query.eq("current_barangay_id", f.barangay);
    if (f.gender) query = query.eq("gender", f.gender);
    if (f.fourPs !== null) query = query.eq("is_4ps_beneficiary", f.fourPs);
    if (f.sped !== null) query = query.eq("is_sped", f.sped);
    if (f.indigenous !== null) query = query.eq("is_indigenous", f.indigenous);
    if (f.channel) query = query.eq("channel", f.channel);
    if (f.status) query = query.eq("status", f.status);

    const from = (page - 1) * PAGE_SIZE;
    return query
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true })
      .order("id", { ascending: true }) // keeps the order stable between pages
      .range(from, from + PAGE_SIZE - 1);
  }

  let page = f.page;
  let res = await run(page);

  // Page number past the end (edited URL, or rows were deleted): go to page 1
  if (res.error?.code === "PGRST103" && page > 1) {
    page = 1;
    res = await run(1);
  }
  if (res.error) throw new Error("Could not load applications.");

  const rows: ApplicationRow[] = ((res.data ?? []) as unknown as RawRow[]).map(
    ({ strands, ...r }) => {
      const s = Array.isArray(strands) ? strands[0] : strands;
      return { ...r, strand_name: s?.name ?? null };
    },
  );

  return { rows, total: res.count ?? 0, page };
}
