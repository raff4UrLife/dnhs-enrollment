// src/lib/enrollment/types.ts
export type ApplicationType = "new" | "transfer";
export type Gender = "Male" | "Female";

export interface ApplicationFormData {
  // Step 1 — Application Type
  grade_level: number | null;
  application_type: ApplicationType | null;
  semester: number | null;

  // Step 2 — Learner Information
  last_name: string;
  first_name: string;
  middle_name: string;
  extension_name: string;
  birthdate: string;
  gender: Gender | null;
  psa_birth_certificate_no: string;
  lrn: string;
  place_of_birth: string;
  religion: string;
  mother_tongue: string;
  learning_modality_id: string | null;
  is_indigenous: boolean;
  indigenous_specification: string;
  is_4ps_beneficiary: boolean;
  four_ps_household_id: string;
  track_id: string | null;
  strand_id: string | null;
  last_grade_level_completed: number | null;
  last_school_year_completed: string;
  last_school_attended: string;
  last_school_id: string;

  // Step 3 — Address
  current_house_no: string;
  current_street: string;
  current_barangay_id: string | null;
  current_barangay_other: string;
  current_municipality_city: string;
  current_province: string;
  current_country: string;
  current_zip_code: string;
  permanent_same_as_current: boolean;
  permanent_house_no: string;
  permanent_street: string;
  permanent_barangay: string;
  permanent_municipality_city: string;
  permanent_province: string;
  permanent_country: string;
  permanent_zip_code: string;

  // Step 4 — Family & Background
  father_last_name: string;
  father_first_name: string;
  father_middle_name: string;
  father_contact_number: string;
  mother_last_name: string;
  mother_first_name: string;
  mother_middle_name: string;
  mother_contact_number: string;
  guardian_last_name: string;
  guardian_first_name: string;
  guardian_middle_name: string;
  guardian_contact_number: string;
  is_sped: boolean;
  sped_category_id: string | null;
  has_pwd_id: boolean;
  average: number | null;
  email: string;
}

export const INITIAL_APPLICATION_FORM: ApplicationFormData = {
  grade_level: null,
  application_type: null,
  semester: null,
  last_name: "",
  first_name: "",
  middle_name: "",
  extension_name: "",
  birthdate: "",
  gender: null,
  psa_birth_certificate_no: "",
  lrn: "",
  place_of_birth: "",
  religion: "",
  mother_tongue: "",
  learning_modality_id: null,
  is_indigenous: false,
  indigenous_specification: "",
  is_4ps_beneficiary: false,
  four_ps_household_id: "",
  track_id: null,
  strand_id: null,
  last_grade_level_completed: null,
  last_school_year_completed: "",
  last_school_attended: "",
  last_school_id: "",
  current_house_no: "",
  current_street: "",
  current_barangay_id: null,
  current_barangay_other: "",
  current_municipality_city: "",
  current_province: "",
  current_country: "Philippines",
  current_zip_code: "",
  permanent_same_as_current: false,
  permanent_house_no: "",
  permanent_street: "",
  permanent_barangay: "",
  permanent_municipality_city: "",
  permanent_province: "",
  permanent_country: "Philippines",
  permanent_zip_code: "",
  father_last_name: "",
  father_first_name: "",
  father_middle_name: "",
  father_contact_number: "",
  mother_last_name: "",
  mother_first_name: "",
  mother_middle_name: "",
  mother_contact_number: "",
  guardian_last_name: "",
  guardian_first_name: "",
  guardian_middle_name: "",
  guardian_contact_number: "",
  is_sped: false,
  sped_category_id: null,
  has_pwd_id: false,
  average: null,
  email: "",
};

export interface DocumentType {
  id: string;
  name: string;
  required: boolean;
}

export interface ApplicationFiles {
  profile_picture: File | null;
  documents: Record<string, File | null>; // key = DocumentType id
}

export const INITIAL_APPLICATION_FILES: ApplicationFiles = {
  profile_picture: null,
  documents: {},
};
