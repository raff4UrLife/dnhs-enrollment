// src/components/enrollment/step-2-learner-information.tsx
import {
  Field,
  FieldGroup,
  Label,
  Input,
  Select,
} from "@/components/ui/form-fields";
import { useReference } from "@/lib/enrollment/reference-context";
import type { ApplicationFormData } from "@/lib/enrollment/types";

interface StepProps {
  data: ApplicationFormData;
  onChange: (patch: Partial<ApplicationFormData>) => void;
  errors?: Record<string, string>;
}

const YES_NO = [
  { value: "false", label: "No" },
  { value: "true", label: "Yes" },
];

export function Step2LearnerInformation({
  data,
  onChange,
  errors = {},
}: StepProps) {
  const { tracks, strands, modalities } = useReference();

  const isSHS = data.grade_level === 11 || data.grade_level === 12;
  const isTransfer = data.application_type === "transfer";
  const availableStrands = strands.filter((s) => s.track_id === data.track_id);

  return (
    <div className="space-y-10">
      <FieldGroup title="Learner's name">
        <Field error={errors.last_name}>
          <Label htmlFor="last_name" required>
            Last name
          </Label>
          <Input
            id="last_name"
            value={data.last_name}
            error={errors.last_name}
            onChange={(e) => onChange({ last_name: e.target.value })}
          />
        </Field>
        <Field error={errors.first_name}>
          <Label htmlFor="first_name" required>
            First name
          </Label>
          <Input
            id="first_name"
            value={data.first_name}
            error={errors.first_name}
            onChange={(e) => onChange({ first_name: e.target.value })}
          />
        </Field>
        <Field>
          <Label htmlFor="middle_name">Middle name</Label>
          <Input
            id="middle_name"
            value={data.middle_name}
            onChange={(e) => onChange({ middle_name: e.target.value })}
          />
        </Field>
        <Field>
          <Label htmlFor="extension_name">Extension (Jr., III, etc.)</Label>
          <Input
            id="extension_name"
            value={data.extension_name}
            onChange={(e) => onChange({ extension_name: e.target.value })}
          />
        </Field>
      </FieldGroup>

      <FieldGroup title="Personal information">
        <Field error={errors.birthdate}>
          <Label htmlFor="birthdate" required>
            Birthdate
          </Label>
          <Input
            id="birthdate"
            type="date"
            value={data.birthdate}
            error={errors.birthdate}
            onChange={(e) => onChange({ birthdate: e.target.value })}
          />
        </Field>
        <Field error={errors.gender}>
          <Label htmlFor="gender" required>
            Gender
          </Label>
          <Select
            id="gender"
            value={data.gender ?? ""}
            error={errors.gender}
            onChange={(e) =>
              onChange({
                gender: e.target.value as ApplicationFormData["gender"],
              })
            }
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </Select>
        </Field>
        <Field>
          <Label htmlFor="psa_birth_certificate_no">
            PSA / Birth certificate no.
          </Label>
          <Input
            id="psa_birth_certificate_no"
            value={data.psa_birth_certificate_no}
            onChange={(e) =>
              onChange({ psa_birth_certificate_no: e.target.value })
            }
          />
        </Field>
        <Field error={errors.lrn}>
          <Label htmlFor="lrn" required>
            Learner Reference Number (LRN)
          </Label>
          <Input
            id="lrn"
            value={data.lrn}
            error={errors.lrn}
            onChange={(e) => onChange({ lrn: e.target.value })}
          />
        </Field>
        <Field>
          <Label htmlFor="place_of_birth">Place of birth</Label>
          <Input
            id="place_of_birth"
            value={data.place_of_birth}
            onChange={(e) => onChange({ place_of_birth: e.target.value })}
          />
        </Field>
        <Field>
          <Label htmlFor="religion">Religion</Label>
          <Input
            id="religion"
            value={data.religion}
            onChange={(e) => onChange({ religion: e.target.value })}
          />
        </Field>
        <Field>
          <Label htmlFor="mother_tongue">Mother tongue</Label>
          <Input
            id="mother_tongue"
            value={data.mother_tongue}
            onChange={(e) => onChange({ mother_tongue: e.target.value })}
          />
        </Field>
        <Field error={errors.learning_modality_id}>
          <Label htmlFor="learning_modality" required>
            Learning modality
          </Label>
          <Select
            id="learning_modality"
            value={data.learning_modality_id ?? ""}
            error={errors.learning_modality_id}
            onChange={(e) =>
              onChange({ learning_modality_id: e.target.value || null })
            }
          >
            <option value="">Select learning modality</option>
            {modalities.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>
      </FieldGroup>

      {isSHS && (
        <FieldGroup title="Senior High School track & strand">
          <Field error={errors.track_id}>
            <Label htmlFor="track_id" required>
              Track
            </Label>
            <Select
              id="track_id"
              value={data.track_id ?? ""}
              error={errors.track_id}
              onChange={(e) =>
                onChange({ track_id: e.target.value || null, strand_id: null })
              }
            >
              <option value="">Select track</option>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field error={errors.strand_id}>
            <Label htmlFor="strand_id" required>
              Strand
            </Label>
            <Select
              id="strand_id"
              value={data.strand_id ?? ""}
              error={errors.strand_id}
              onChange={(e) => onChange({ strand_id: e.target.value || null })}
              disabled={!data.track_id}
            >
              <option value="">
                {data.track_id ? "Select strand" : "Select a track first"}
              </option>
              {availableStrands.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field error={errors.semester}>
            <Label htmlFor="semester" required>
              Semester
            </Label>
            <Select
              id="semester"
              value={data.semester ?? ""}
              error={errors.semester}
              onChange={(e) =>
                onChange({
                  semester: e.target.value ? Number(e.target.value) : null,
                })
              }
            >
              <option value="">Select semester</option>
              <option value="1">1st Semester</option>
              <option value="2">2nd Semester</option>
            </Select>
          </Field>
        </FieldGroup>
      )}

      {isTransfer && (
        <FieldGroup title="Previous school (for transferees)">
          <Field error={errors.last_grade_level_completed}>
            <Label htmlFor="last_grade_level_completed" required>
              Last grade level completed
            </Label>
            <Select
              id="last_grade_level_completed"
              value={data.last_grade_level_completed ?? ""}
              error={errors.last_grade_level_completed}
              onChange={(e) =>
                onChange({
                  last_grade_level_completed: e.target.value
                    ? Number(e.target.value)
                    : null,
                })
              }
            >
              <option value="">Select grade level</option>
              {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="last_school_year_completed">
              Last school year completed
            </Label>
            <Input
              id="last_school_year_completed"
              placeholder="e.g. 2025-2026"
              value={data.last_school_year_completed}
              onChange={(e) =>
                onChange({ last_school_year_completed: e.target.value })
              }
            />
          </Field>
          <Field full error={errors.last_school_attended}>
            <Label htmlFor="last_school_attended" required>
              Last school attended
            </Label>
            <Input
              id="last_school_attended"
              value={data.last_school_attended}
              error={errors.last_school_attended}
              onChange={(e) =>
                onChange({ last_school_attended: e.target.value })
              }
            />
          </Field>
          <Field>
            <Label htmlFor="last_school_id">School ID (if known)</Label>
            <Input
              id="last_school_id"
              value={data.last_school_id}
              onChange={(e) => onChange({ last_school_id: e.target.value })}
            />
          </Field>
        </FieldGroup>
      )}

      <FieldGroup title="Indigenous Peoples & 4Ps">
        <Field>
          <Label htmlFor="is_indigenous">
            Is the learner an Indigenous Person?
          </Label>
          <Select
            id="is_indigenous"
            value={String(data.is_indigenous)}
            onChange={(e) =>
              onChange({ is_indigenous: e.target.value === "true" })
            }
          >
            {YES_NO.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        {data.is_indigenous && (
          <Field>
            <Label htmlFor="indigenous_specification">Please specify</Label>
            <Input
              id="indigenous_specification"
              value={data.indigenous_specification}
              onChange={(e) =>
                onChange({ indigenous_specification: e.target.value })
              }
            />
          </Field>
        )}
        <Field>
          <Label htmlFor="is_4ps_beneficiary">
            Is the learner a 4Ps beneficiary?
          </Label>
          <Select
            id="is_4ps_beneficiary"
            value={String(data.is_4ps_beneficiary)}
            onChange={(e) =>
              onChange({ is_4ps_beneficiary: e.target.value === "true" })
            }
          >
            {YES_NO.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        {data.is_4ps_beneficiary && (
          <Field>
            <Label htmlFor="four_ps_household_id">4Ps household ID</Label>
            <Input
              id="four_ps_household_id"
              value={data.four_ps_household_id}
              onChange={(e) =>
                onChange({ four_ps_household_id: e.target.value })
              }
            />
          </Field>
        )}
      </FieldGroup>
    </div>
  );
}

export function getStep2Errors(data: ApplicationFormData) {
  const errors: Record<string, string> = {};

  if (data.last_name.trim() === "") errors.last_name = "Last name is required.";
  if (data.first_name.trim() === "")
    errors.first_name = "First name is required.";
  if (data.birthdate === "") errors.birthdate = "Birthdate is required.";
  if (data.gender === null) errors.gender = "Gender is required.";
  if (data.lrn.trim() === "") errors.lrn = "LRN is required.";
  else if (!/^\d{12}$/.test(data.lrn.trim()))
    errors.lrn = "LRN must be exactly 12 digits.";
  if (data.learning_modality_id === null)
    errors.learning_modality_id = "Learning modality is required.";

  if (data.grade_level === 11 || data.grade_level === 12) {
    if (data.track_id === null) errors.track_id = "Track is required.";
    if (data.strand_id === null) errors.strand_id = "Strand is required.";
    if (data.semester === null) errors.semester = "Semester is required.";
  }

  if (data.application_type === "transfer") {
    if (data.last_grade_level_completed === null)
      errors.last_grade_level_completed =
        "Last grade level completed is required.";
    if (data.last_school_attended.trim() === "")
      errors.last_school_attended = "Last school attended is required.";
  }

  return errors;
}

export function isStep2Valid(data: ApplicationFormData) {
  return Object.keys(getStep2Errors(data)).length === 0;
}
