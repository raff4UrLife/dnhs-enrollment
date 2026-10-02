// src/app/admin/(portal)/applications/_components/application-form.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, Label, Input } from "@/components/ui/form-fields";
import {
  Step1ApplicationType,
  getStep1Errors,
} from "@/components/enrollment/step-1-application-type";
import {
  Step2LearnerInformation,
  getStep2Errors,
} from "@/components/enrollment/step-2-learner-information";
import {
  Step3Address,
  getStep3Errors,
} from "@/components/enrollment/step-3-address";
import {
  Step4FamilyBackground,
  getStep4Errors,
} from "@/components/enrollment/step-4-family-background";
import type { ApplicationFormData } from "@/lib/enrollment/types";
import { createWalkInApplication } from "@/app/admin/applications/actions";
import { updateApplication } from "../[id]/actions";

type Props = {
  mode: "edit" | "new";
  initialData: ApplicationFormData;
  applicationId?: string; // required in edit mode
  readOnlyReason?: string | null; // when set, the form is view-only
};

const TABS = [
  { label: "Application Type", getErrors: getStep1Errors },
  { label: "Learner Information", getErrors: getStep2Errors },
  { label: "Address", getErrors: getStep3Errors },
  { label: "Family & Background", getErrors: getStep4Errors },
];

export function ApplicationForm({
  mode,
  initialData,
  applicationId,
  readOnlyReason = null,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [data, setData] = useState<ApplicationFormData>(initialData);
  const [tab, setTab] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const updateData = (patch: Partial<ApplicationFormData>) => {
    setData((prev) => ({ ...prev, ...patch }));
    setMessage(null);
  };

  // After the first Save attempt, errors update live as the fields are fixed
  const tabErrors = TABS.map((t) => (showErrors ? t.getErrors(data) : {}));
  const errors: Record<string, string> = Object.assign({}, ...tabErrors);

  function handleSave() {
    const firstBad = TABS.findIndex(
      (t) => Object.keys(t.getErrors(data)).length > 0,
    );
    setShowErrors(true);
    if (firstBad !== -1) {
      setTab(firstBad);
      setMessage({ type: "error", text: "Please fix the highlighted fields." });
      return;
    }

    startTransition(async () => {
      try {
        const result =
          mode === "edit" && applicationId
            ? await updateApplication(applicationId, data)
            : await createWalkInApplication(data);

        if (!result.ok) {
          setMessage({ type: "error", text: result.error });
          return;
        }

        if (mode === "new") {
          router.push("/admin/applications");
        } else {
          setMessage({ type: "success", text: "Changes saved." });
          router.refresh();
        }
      } catch {
        setMessage({
          type: "error",
          text: "Something went wrong. Please try again.",
        });
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t, i) => {
          const hasError = Object.keys(tabErrors[i]).length > 0;
          return (
            <button
              key={t.label}
              type="button"
              onClick={() => setTab(i)}
              className={cn(
                "inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                tab === i
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-black/10 bg-white text-foreground hover:bg-black/5",
              )}
            >
              {t.label}
              {hasError && (
                <span className="size-2 rounded-full bg-destructive" />
              )}
            </button>
          );
        })}
      </div>

      {readOnlyReason && (
        <p className="rounded-md border border-black/10 bg-white px-4 py-3 text-sm text-muted-foreground">
          {readOnlyReason}
        </p>
      )}

      {/* Navy panel so the existing (dark-styled) steps look the same as on the public form */}
      <div className="rounded-md bg-secondary p-6 text-secondary-foreground shadow-sm">
        <fieldset disabled={!!readOnlyReason} className="min-w-0">
          {tab === 0 && (
            <Step1ApplicationType
              data={data}
              onChange={updateData}
              errors={errors}
            />
          )}
          {tab === 1 && (
            <Step2LearnerInformation
              data={data}
              onChange={updateData}
              errors={errors}
            />
          )}
          {tab === 2 && (
            <Step3Address data={data} onChange={updateData} errors={errors} />
          )}
          {tab === 3 && (
            <div className="space-y-10">
              <Step4FamilyBackground
                data={data}
                onChange={updateData}
                errors={errors}
              />
              {/* On the public form the email field sits in the Documents step */}
              <FieldGroup title="Contact">
                <Field>
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => updateData({ email: e.target.value })}
                  />
                </Field>
              </FieldGroup>
            </div>
          )}
        </fieldset>
      </div>

      {/* Footer */}
      {!readOnlyReason && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p
            className={cn(
              "text-sm",
              message?.type === "error" ? "text-destructive" : "text-green-700",
            )}
          >
            {message?.text}
          </p>
          <Button type="button" onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {mode === "edit"
              ? isPending
                ? "Saving..."
                : "Save changes"
              : isPending
                ? "Saving..."
                : "Save & Enroll Student"}
          </Button>
        </div>
      )}
    </div>
  );
}
