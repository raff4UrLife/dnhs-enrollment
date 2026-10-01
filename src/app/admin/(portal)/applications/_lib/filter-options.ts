import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type FilterOption = { value: string; label: string };

export type FilterConfig = {
  param: string; // the name used in the URL, e.g. ?gender=Female
  label: string; // the text shown on the dropdown
  options: FilterOption[];
};

const YES_NO: FilterOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const GRADES: FilterOption[] = [7, 8, 9, 10, 11, 12].map((g) => ({
  value: String(g),
  label: `Grade ${g}`,
}));

// Loads the filter list (two of them come from the database)
export async function getFilterConfigs(): Promise<FilterConfig[]> {
  const admin = createAdminClient();

  const [strandsRes, barangaysRes] = await Promise.all([
    admin.from("strands").select("id, name").order("name"),
    admin.from("barangays").select("id, name").order("name"),
  ]);

  // If a list fails to load, show an empty dropdown instead of crashing the page
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
