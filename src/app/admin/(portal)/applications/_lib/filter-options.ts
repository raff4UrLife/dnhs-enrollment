// src/app/admin/(portal)/applications/_lib/filter-options.ts
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type FilterOption = { value: string; label: string };

export type FilterConfig = {
  param: string; // the name used in the URL, e.g. ?gender=Female
  label: string; // the text shown on the dropdown
  options: FilterOption[];
  // Selected when the URL has no value. A filter with a default has no "All"
  defaultValue?: string;
};

const YES_NO: FilterOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const GRADES: FilterOption[] = [7, 8, 9, 10, 11, 12].map((g) => ({
  value: String(g),
  label: `Grade ${g}`,
}));

// Loads the filter list (three of them come from the database)
export async function getFilterConfigs(): Promise<FilterConfig[]> {
  const admin = createAdminClient();

  const [yearsRes, strandsRes, barangaysRes] = await Promise.all([
    admin
      .from("school_years")
      .select("id, name, is_active")
      .order("name", { ascending: false }), // newest school year first
    admin.from("strands").select("id, name").order("name"),
    admin.from("barangays").select("id, name").order("name"),
  ]);

  // If a list fails to load, show an empty dropdown instead of crashing the page
  const years = yearsRes.data ?? [];
  const schoolYears: FilterOption[] = years.map((y) => ({
    value: y.id,
    label: y.name,
  }));
  const activeYearId = years.find((y) => y.is_active)?.id;

  const strands: FilterOption[] = (strandsRes.data ?? []).map((s) => ({
    value: s.id,
    label: s.name,
  }));
  const barangays: FilterOption[] = (barangaysRes.data ?? []).map((b) => ({
    value: b.id,
    label: b.name,
  }));

  return [
    {
      param: "schoolyear",
      label: "School year",
      options: schoolYears,
      defaultValue: activeYearId,
    },
    {
      param: "status",
      label: "Status",
      options: [
        { value: "pending", label: "Pending" },
        { value: "approved", label: "Approved" },
      ],
    },
    { param: "grade", label: "Grade level", options: GRADES },
    { param: "strand", label: "Strand", options: strands },
    {
      param: "gender",
      label: "Gender",
      options: [
        { value: "Male", label: "Male" },
        { value: "Female", label: "Female" },
      ],
    },
    { param: "barangay", label: "Barangay", options: barangays },
    { param: "fourps", label: "4Ps member", options: YES_NO },
    { param: "sped", label: "SPED", options: YES_NO },
    { param: "indigenous", label: "Indigenous", options: YES_NO },
    {
      param: "channel",
      label: "Channel",
      options: [
        { value: "online", label: "Online" },
        { value: "walk-in", label: "Walk-in" },
      ],
    },
  ];
}
