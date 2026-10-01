//src/components/enrollment/step-1-applications.tsx
import { Field, FieldGroup, Label, Select } from "@/components/ui/form-fields";
import { GRADE_LEVELS } from "@/lib/enrollment/reference-data";
import type { ApplicationFormData } from "@/lib/enrollment/types";

interface StepProps {
  data: ApplicationFormData;
  onChange: (patch: Partial<ApplicationFormData>) => void;
  errors?: Record<string, string>;
}

export function Step1ApplicationType({
  data,
  onChange,
  errors = {},
}: StepProps) {
  return (
    <FieldGroup title="Grade level & application type">
      <Field error={errors.grade_level}>
        <Label htmlFor="grade_level" required>
          Grade level applying for
        </Label>
        <Select
          id="grade_level"
          value={data.grade_level ?? ""}
          error={errors.grade_level}
          onChange={(e) =>
            onChange({
              grade_level: e.target.value ? Number(e.target.value) : null,
            })
          }
        >
          <option value="">Select grade level</option>
          {GRADE_LEVELS.map((level) => (
            <option key={level} value={level}>
              Grade {level}
            </option>
          ))}
        </Select>
      </Field>

      <Field error={errors.application_type}>
        <Label htmlFor="application_type" required>
          Applicant type
        </Label>
        <Select
          id="application_type"
          value={data.application_type ?? ""}
          error={errors.application_type}
          onChange={(e) =>
            onChange({
              application_type: e.target
                .value as ApplicationFormData["application_type"],
            })
          }
        >
          <option value="">Select applicant type</option>
          <option value="new">New Student</option>
          <option value="transfer">Transferee</option>
        </Select>
      </Field>
    </FieldGroup>
  );
}

export function getStep1Errors(data: ApplicationFormData) {
  const errors: Record<string, string> = {};

  if (data.grade_level === null)
    errors.grade_level = "Grade level is required.";
  if (data.application_type === null)
    errors.application_type = "Applicant type is required.";

  return errors;
}

export function isStep1Valid(data: ApplicationFormData) {
  return Object.keys(getStep1Errors(data)).length === 0;
}
