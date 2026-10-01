// src/lib/enrollment/application-row.ts
import "server-only";
import type { ApplicationFormData } from "@/lib/enrollment/types";

export type BuildRowResult =
  | { ok: true; row: Record<string, unknown> }
  | { ok: false; error: string };

// Server actions receive whatever the browser sends, so every value is re-checked here.
const s = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
};
const b = (v: unknown): boolean => v === true;
const n = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

const TEXT_FIELDS = [
  "last_name",
  "first_name",
  "middle_name",
  "extension_name",
  "psa_birth_certificate_no",
  "place_of_birth",
  "religion",
  "mother_tongue",
  "last_school_year_completed",
  "last_school_attended",
  "last_school_id",
  "current_house_no",
  "current_street",
  "current_barangay_other",
  "current_municipality_city",
  "current_province",
  "current_country",
  "current_zip_code",
  "permanent_house_no",
  "permanent_street",
  "permanent_barangay",
  "permanent_municipality_city",
  "permanent_province",
  "permanent_country",
  "permanent_zip_code",
  "father_last_name",
  "father_first_name",
  "father_middle_name",
  "father_contact_number",
  "mother_last_name",
  "mother_first_name",
  "mother_middle_name",
  "mother_contact_number",
  "guardian_last_name",
  "guardian_first_name",
  "guardian_middle_name",
  "guardian_contact_number",
] as const;

export function buildApplicationRow(
  raw: unknown,
  schoolYearId: string,
): BuildRowResult {
  const input = (raw ?? {}) as Partial<
    Record<keyof ApplicationFormData, unknown>
  >;
  const err = (error: string): BuildRowResult => ({ ok: false, error });

  // Step 1
  const grade = n(input.grade_level);
  if (grade === null || ![7, 8, 9, 10, 11, 12].includes(grade))
    return err("Please choose a valid grade level.");

  const type = input.application_type;
  if (type !== "new" && type !== "transfer")
    return err("Please choose new or transfer student.");

  const isSHS = grade >= 11;
  const semester = n(input.semester);
  const trackId = s(input.track_id);
  const strandId = s(input.strand_id);
  if (isSHS) {
    if (!trackId || !strandId)
      return err("Track and strand are required for Grades 11 and 12.");
    if (semester !== 1 && semester !== 2)
      return err("Please choose a semester.");
  }

  // Step 2
  const lastName = s(input.last_name);
  const firstName = s(input.first_name);
  if (!lastName || !firstName)
    return err("Learner's first and last name are required.");

  const birthdate = s(input.birthdate);
  if (
    !birthdate ||
    !/^\d{4}-\d{2}-\d{2}$/.test(birthdate) ||
    Number.isNaN(Date.parse(birthdate))
  ) {
    return err("Please enter a valid birthdate.");
  }
  if (Date.parse(birthdate) > Date.now())
    return err("Birthdate cannot be in the future.");

  const gender = input.gender;
  if (gender !== "Male" && gender !== "Female")
    return err("Please choose a gender.");

  const lrn = s(input.lrn);
  if (!lrn || !/^\d{12}$/.test(lrn))
    return err("LRN must be exactly 12 digits.");

  const average = n(input.average);
  if (average === null || average < 0 || average > 100)
    return err("Please enter a valid general average (0 to 100).");

  if (type === "transfer" && !s(input.last_school_attended)) {
    return err("Last school attended is required for transfer students.");
  }

  // Step 3
  if (!s(input.current_barangay_id) && !s(input.current_barangay_other)) {
    return err("Please choose a barangay or type it in.");
  }

  // Step 4
  const isSped = b(input.is_sped);
  const spedCategoryId = s(input.sped_category_id);
  if (isSped && !spedCategoryId) return err("Please choose a SPED category.");

  const email = s(input.email);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return err("Please enter a valid email address.");

  const isIndigenous = b(input.is_indigenous);
  const is4ps = b(input.is_4ps_beneficiary);

  const row: Record<string, unknown> = {
    school_year_id: schoolYearId,
    grade_level: grade,
    application_type: type,
    semester: isSHS ? semester : null,
    track_id: isSHS ? trackId : null,
    strand_id: isSHS ? strandId : null,
    birthdate,
    gender,
    lrn,
    average,
    email,
    learning_modality_id: s(input.learning_modality_id),
    current_barangay_id: s(input.current_barangay_id),
    last_grade_level_completed: n(input.last_grade_level_completed),
    is_indigenous: isIndigenous,
    indigenous_specification: isIndigenous
      ? s(input.indigenous_specification)
      : null,
    is_4ps_beneficiary: is4ps,
    four_ps_household_id: is4ps ? s(input.four_ps_household_id) : null,
    permanent_same_as_current: b(input.permanent_same_as_current),
    is_sped: isSped,
    sped_category_id: isSped ? spedCategoryId : null,
    has_pwd_id: b(input.has_pwd_id),
  };

  for (const field of TEXT_FIELDS) row[field] = s(input[field]);

  return { ok: true, row };
}
