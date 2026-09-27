//Step 3
import {
  Field,
  FieldGroup,
  Label,
  Input,
  Select,
  Checkbox,
} from "@/components/ui/form-fields";
import { DIMASALANG_BARANGAYS } from "@/lib/enrollment/reference-data";
import type { ApplicationFormData } from "@/lib/enrollment/types";

interface StepProps {
  data: ApplicationFormData;
  onChange: (patch: Partial<ApplicationFormData>) => void;
  errors?: Record<string, string>;
}

export function Step3Address({ data, onChange, errors = {} }: StepProps) {
  return (
    <div className="space-y-10">
      <FieldGroup title="Current address">
        <Field>
          <Label htmlFor="current_house_no">House no. / Street</Label>
          <Input
            id="current_house_no"
            value={data.current_house_no}
            onChange={(e) => onChange({ current_house_no: e.target.value })}
          />
        </Field>

        <Field error={errors.current_barangay_id}>
          <Label htmlFor="current_barangay">
            Barangay (if within Dimasalang)
          </Label>
          <Select
            id="current_barangay"
            value={data.current_barangay_id ?? ""}
            error={errors.current_barangay_id}
            onChange={(e) =>
              onChange({
                current_barangay_id: e.target.value || null,
                current_barangay_other: e.target.value
                  ? ""
                  : data.current_barangay_other,
              })
            }
          >
            <option value="">Select barangay</option>
            {DIMASALANG_BARANGAYS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field>
          <Label htmlFor="current_barangay_other">
            Specify if outside Dimasalang
          </Label>
          <Input
            id="current_barangay_other"
            placeholder="e.g. Rizal"
            value={data.current_barangay_other}
            onChange={(e) =>
              onChange({
                current_barangay_other: e.target.value,
                current_barangay_id: e.target.value
                  ? null
                  : data.current_barangay_id,
              })
            }
          />
        </Field>

        {/* <Field full>
          <Label htmlFor="current_barangay_other" required>
            Please specify your barangay and municipality/city
          </Label>
          <Input
            id="current_barangay_other"
            placeholder="e.g. Barangay Rizal, Sorsogon City"
            value={data.current_barangay_other}
            onChange={(e) =>
              onChange({ current_barangay_other: e.target.value })
            }
          />
        </Field> */}

        <Field error={errors.current_municipality_city}>
          <Label htmlFor="current_municipality_city" required>
            Municipality / City
          </Label>
          <Input
            id="current_municipality_city"
            value={data.current_municipality_city}
            error={errors.current_municipality_city}
            onChange={(e) =>
              onChange({ current_municipality_city: e.target.value })
            }
          />
        </Field>
        <Field>
          <Label htmlFor="current_province" required>
            Province
          </Label>
          <Input
            id="current_province"
            value={data.current_province}
            onChange={(e) => onChange({ current_province: e.target.value })}
          />
        </Field>
        <Field>
          <Label htmlFor="current_zip_code" required>
            ZIP code
          </Label>
          <Input
            id="current_zip_code"
            value={data.current_zip_code}
            onChange={(e) => onChange({ current_zip_code: e.target.value })}
          />
        </Field>
      </FieldGroup>

      <Checkbox
        label="Permanent address is the same as current address"
        checked={data.permanent_same_as_current}
        onChange={(e) =>
          onChange({ permanent_same_as_current: e.target.checked })
        }
      />

      {!data.permanent_same_as_current && (
        <FieldGroup title="Permanent address">
          <Field>
            <Label htmlFor="permanent_house_no">House no. / Street</Label>
            <Input
              id="permanent_house_no"
              value={data.permanent_house_no}
              onChange={(e) => onChange({ permanent_house_no: e.target.value })}
            />
          </Field>
          <Field>
            <Label htmlFor="permanent_barangay">Barangay</Label>
            <Input
              id="permanent_barangay"
              value={data.permanent_barangay}
              onChange={(e) => onChange({ permanent_barangay: e.target.value })}
            />
          </Field>
          <Field>
            <Label htmlFor="permanent_municipality_city">
              Municipality / City
            </Label>
            <Input
              id="permanent_municipality_city"
              value={data.permanent_municipality_city}
              onChange={(e) =>
                onChange({ permanent_municipality_city: e.target.value })
              }
            />
          </Field>
          <Field>
            <Label htmlFor="permanent_province">Province</Label>
            <Input
              id="permanent_province"
              value={data.permanent_province}
              onChange={(e) => onChange({ permanent_province: e.target.value })}
            />
          </Field>
          <Field>
            <Label htmlFor="permanent_zip_code">ZIP code</Label>
            <Input
              id="permanent_zip_code"
              value={data.permanent_zip_code}
              onChange={(e) => onChange({ permanent_zip_code: e.target.value })}
            />
          </Field>
        </FieldGroup>
      )}
    </div>
  );
}

export function getStep3Errors(data: ApplicationFormData) {
  const errors: Record<string, string> = {};

  const hasBarangay =
    data.current_barangay_id !== null ||
    data.current_barangay_other.trim() !== "";
  if (!hasBarangay) errors.current_barangay_id = "Barangay is required.";

  if (data.current_municipality_city.trim() === "")
    errors.current_municipality_city = "Municipality / City is required.";

  return errors;
}

export function isStep3Valid(data: ApplicationFormData) {
  return Object.keys(getStep3Errors(data)).length === 0;
}
