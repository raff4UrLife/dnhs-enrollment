//step-5-review.tsx
import { Checkbox } from "@/components/ui/form-fields";
import {
  TRACKS,
  STRANDS,
  LEARNING_MODALITIES,
  DIMASALANG_BARANGAYS,
} from "@/lib/enrollment/reference-data";
import type { ApplicationFormData } from "@/lib/enrollment/types";
import { Button } from "@/components/ui/button";

interface StepProps {
  data: ApplicationFormData;
  onViewStep: (step: number) => void;
  certified: boolean;
  onCertifiedChange: (value: boolean) => void;
}

function lookupName<T extends { id: string; name: string }>(
  list: T[],
  id: string | null,
) {
  return list.find((item) => item.id === id)?.name ?? "—";
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-white/50">{label}</span>
      <span className="text-right text-white">{value || "—"}</span>
    </div>
  );
}

function ReviewSection({
  title,
  stepIndex,
  onViewStep,
  children,
}: {
  title: string;
  stepIndex: number;
  onViewStep: (step: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-white/15 bg-secondary/70 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-white/15 pb-2">
        <h3 className="font-serif text-sm font-semibold text-white">{title}</h3>
        <Button
          className="text-primary"
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onViewStep(stepIndex)}
        >
          View
        </Button>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function Step5Review({
  data,
  onViewStep,
  certified,
  onCertifiedChange,
}: StepProps) {
  const barangayName = data.current_barangay_id
    ? lookupName(DIMASALANG_BARANGAYS, data.current_barangay_id)
    : data.current_barangay_other || "—";

  return (
    <div className="space-y-6">
      <p className="text-white/70">
        Please review your application before submitting. Submitting creates a{" "}
        <strong className="text-white">pending application</strong> — it does
        not enroll the learner yet. You must still bring your original
        requirements to the school for verification before your enrollment is
        confirmed.
      </p>

      <ReviewSection
        title="Application Type"
        stepIndex={0}
        onViewStep={onViewStep}
      >
        <ReviewRow
          label="Grade level"
          value={data.grade_level ? `Grade ${data.grade_level}` : "—"}
        />
        <ReviewRow
          label="Applicant type"
          value={
            data.application_type === "new"
              ? "New Student"
              : data.application_type === "transfer"
                ? "Transferee"
                : "—"
          }
        />
      </ReviewSection>

      <ReviewSection
        title="Learner Information"
        stepIndex={1}
        onViewStep={onViewStep}
      >
        <ReviewRow
          label="Name"
          value={[data.last_name, data.first_name, data.middle_name]
            .filter(Boolean)
            .join(", ")}
        />
        <ReviewRow label="Birthdate" value={data.birthdate} />
        <ReviewRow label="Gender" value={data.gender ?? "—"} />
        <ReviewRow label="LRN" value={data.lrn} />
        <ReviewRow
          label="Learning modality"
          value={lookupName(LEARNING_MODALITIES, data.learning_modality_id)}
        />
        {(data.grade_level === 11 || data.grade_level === 12) && (
          <>
            <ReviewRow
              label="Track"
              value={lookupName(TRACKS, data.track_id)}
            />
            <ReviewRow
              label="Strand"
              value={lookupName(STRANDS, data.strand_id)}
            />
          </>
        )}
      </ReviewSection>

      <ReviewSection title="Address" stepIndex={2} onViewStep={onViewStep}>
        <ReviewRow label="Barangay" value={barangayName} />
        <ReviewRow
          label="Municipality / City"
          value={data.current_municipality_city}
        />
      </ReviewSection>

      <ReviewSection
        title="Family & Background"
        stepIndex={3}
        onViewStep={onViewStep}
      >
        <ReviewRow
          label="Father"
          value={[data.father_last_name, data.father_first_name]
            .filter(Boolean)
            .join(", ")}
        />
        <ReviewRow
          label="Mother"
          value={[data.mother_last_name, data.mother_first_name]
            .filter(Boolean)
            .join(", ")}
        />
        <ReviewRow
          label="General average"
          value={data.average !== null ? String(data.average) : "—"}
        />
      </ReviewSection>

      <Checkbox
        label="I certify that the information provided is true and correct."
        checked={certified}
        onChange={(e) => onCertifiedChange(e.target.checked)}
      />
    </div>
  );
}
