// src/lib/enrollment/form-from-row.ts
import {
  INITIAL_APPLICATION_FORM,
  type ApplicationFormData,
} from "@/lib/enrollment/types";

type Row = Record<string, unknown>;

const str = (v: unknown): string => (typeof v === "string" ? v : "");

// uuid columns: a non-empty string or null
const id = (v: unknown): string | null =>
  typeof v === "string" && v !== "" ? v : null;

// numbers can arrive as strings from numeric columns
const num = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const x = Number(v);
    return Number.isFinite(x) ? x : null;
  }
  return null;
};

export function formFromRow(row: Row): ApplicationFormData {
  const out: Record<string, unknown> = { ...INITIAL_APPLICATION_FORM };

  // Every text field in the form: null in the database becomes ""
  for (const [key, initial] of Object.entries(INITIAL_APPLICATION_FORM)) {
    if (typeof initial === "string") out[key] = str(row[key]);
  }

  // Dates can come back with a time part; the date input wants YYYY-MM-DD
  out.birthdate = str(row.birthdate).slice(0, 10);

  out.grade_level = num(row.grade_level);
  out.semester = num(row.semester);
  out.last_grade_level_completed = num(row.last_grade_level_completed);
  out.average = num(row.average);

  out.application_type =
    row.application_type === "new" || row.application_type === "transfer"
      ? row.application_type
      : null;
  out.gender =
    row.gender === "Male" || row.gender === "Female" ? row.gender : null;

  out.learning_modality_id = id(row.learning_modality_id);
  out.track_id = id(row.track_id);
  out.strand_id = id(row.strand_id);
  out.current_barangay_id = id(row.current_barangay_id);
  out.sped_category_id = id(row.sped_category_id);

  out.is_indigenous = row.is_indigenous === true;
  out.is_4ps_beneficiary = row.is_4ps_beneficiary === true;
  out.permanent_same_as_current = row.permanent_same_as_current === true;
  out.is_sped = row.is_sped === true;
  out.has_pwd_id = row.has_pwd_id === true;

  return out as unknown as ApplicationFormData;
}
