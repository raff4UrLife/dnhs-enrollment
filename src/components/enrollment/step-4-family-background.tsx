//STEP 4
import {
  Field,
  FieldGroup,
  Label,
  Input,
  Select,
  Checkbox,
} from "@/components/ui/form-fields";
import type { ApplicationFormData } from "@/lib/enrollment/types";
import { SPED_CATEGORIES } from "@/lib/enrollment/reference-data";

interface StepProps {
  data: ApplicationFormData;
  onChange: (patch: Partial<ApplicationFormData>) => void;
  errors?: Record<string, string>;
}

const YES_NO = [
  { value: "false", label: "No" },
  { value: "true", label: "Yes" },
];

export function Step4FamilyBackground({
  data,
  onChange,
  errors = {},
}: StepProps) {
  return (
    <div className="space-y-10">
      <FieldGroup title="Parent / guardian information">
        <Field>
          <Label htmlFor="father_last_name">Father's last name</Label>
          <Input
            id="father_last_name"
            value={data.father_last_name}
            onChange={(e) => onChange({ father_last_name: e.target.value })}
          />
        </Field>
        <Field>
          <Label htmlFor="father_first_name">Father's first name</Label>
          <Input
            id="father_first_name"
            value={data.father_first_name}
            onChange={(e) => onChange({ father_first_name: e.target.value })}
          />
        </Field>
        <Field>
          <Label htmlFor="father_contact_number">Father's contact number</Label>
          <Input
            id="father_contact_number"
            value={data.father_contact_number}
            onChange={(e) =>
              onChange({ father_contact_number: e.target.value })
            }
          />
        </Field>

        <Field>
          <Label htmlFor="mother_last_name">Mother's last name</Label>
          <Input
            id="mother_last_name"
            value={data.mother_last_name}
            onChange={(e) => onChange({ mother_last_name: e.target.value })}
          />
        </Field>
        <Field>
          <Label htmlFor="mother_first_name">Mother's first name</Label>
          <Input
            id="mother_first_name"
            value={data.mother_first_name}
            onChange={(e) => onChange({ mother_first_name: e.target.value })}
          />
        </Field>
        <Field>
          <Label htmlFor="mother_contact_number">Mother's contact number</Label>
          <Input
            id="mother_contact_number"
            value={data.mother_contact_number}
            onChange={(e) =>
              onChange({ mother_contact_number: e.target.value })
            }
          />
        </Field>

        <Field>
          <Label htmlFor="guardian_last_name">
            Guardian's last name (if applicable)
          </Label>
          <Input
            id="guardian_last_name"
            value={data.guardian_last_name}
            onChange={(e) => onChange({ guardian_last_name: e.target.value })}
          />
        </Field>
        <Field>
          <Label htmlFor="guardian_first_name">Guardian's first name</Label>
          <Input
            id="guardian_first_name"
            value={data.guardian_first_name}
            onChange={(e) => onChange({ guardian_first_name: e.target.value })}
          />
        </Field>
        <Field>
          <Label htmlFor="guardian_contact_number">
            Guardian's contact number
          </Label>
          <Input
            id="guardian_contact_number"
            value={data.guardian_contact_number}
            onChange={(e) =>
              onChange({ guardian_contact_number: e.target.value })
            }
          />
        </Field>
      </FieldGroup>

      <FieldGroup title="Special needs">
        <Field>
          <Label htmlFor="is_sped">
            Is the learner under the Special Needs Education Program?
          </Label>
          <Select
            id="is_sped"
            value={String(data.is_sped)}
            onChange={(e) =>
              onChange({
                is_sped: e.target.value === "true",
                sped_category_id:
                  e.target.value === "true" ? data.sped_category_id : null,
              })
            }
          >
            {YES_NO.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label htmlFor="has_pwd_id">Does the learner have a PWD ID?</Label>
          <Select
            id="has_pwd_id"
            value={String(data.has_pwd_id)}
            onChange={(e) =>
              onChange({ has_pwd_id: e.target.value === "true" })
            }
          >
            {YES_NO.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        {data.is_sped && (
          <Field full error={errors.sped_category_id}>
            <p className="text-sm font-medium text-primary">
              Check only 1, either from a1 or a2
            </p>

            <div className="mt-4">
              <p className="text-sm font-medium text-white">
                a1. With Diagnostics from licensed Medical Specialists
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {SPED_CATEGORIES.filter(
                  (c) => c.category === "diagnostics",
                ).map((item) => (
                  <Checkbox
                    key={item.id}
                    label={item.name}
                    checked={data.sped_category_id === item.id}
                    onChange={(e) =>
                      onChange({
                        sped_category_id: e.target.checked ? item.id : null,
                      })
                    }
                  />
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium text-white">
                a2. With Manifestations
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {SPED_CATEGORIES.filter(
                  (c) => c.category === "manifestations",
                ).map((item) => (
                  <Checkbox
                    key={item.id}
                    label={item.name}
                    checked={data.sped_category_id === item.id}
                    onChange={(e) =>
                      onChange({
                        sped_category_id: e.target.checked ? item.id : null,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          </Field>
        )}
      </FieldGroup>
      <FieldGroup title="Academic standing (used for sectioning)">
        <Field error={errors.average}>
          <Label htmlFor="average" required>
            General average (previous school year)
          </Label>
          <Input
            id="average"
            type="number"
            min={0}
            max={100}
            step={0.01}
            placeholder="e.g. 88.40"
            value={data.average ?? ""}
            error={errors.average}
            onChange={(e) =>
              onChange({
                average: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
          <p className="text-xs text-white/50">
            This will be verified against your Form 138 upon submission of
            original documents.
          </p>
        </Field>
      </FieldGroup>
    </div>
  );
}

export function getStep4Errors(data: ApplicationFormData) {
  const errors: Record<string, string> = {};

  if (data.average === null || data.average < 0 || data.average > 100)
    errors.average = "A valid general average (0–100) is required.";

  return errors;
}

export function isStep4Valid(data: ApplicationFormData) {
  return Object.keys(getStep4Errors(data)).length === 0;
}
