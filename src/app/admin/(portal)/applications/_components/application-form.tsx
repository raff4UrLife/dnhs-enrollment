// src/app/admin/(portal)/applications/_components/application-form.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { Step5Documents } from "@/components/enrollment/step-5-documents";
import { useReference } from "@/lib/enrollment/reference-context";
import {
  INITIAL_APPLICATION_FILES,
  type ApplicationFiles,
  type ApplicationFormData,
} from "@/lib/enrollment/types";
import type { ApplicationStoredFiles } from "@/lib/enrollment/application-files";
import {
  NEW_WALK_IN_PROGRESS,
  runWalkInFlow,
  type WalkInProgress,
} from "@/lib/enrollment/walk-in-flow";
import { updateApplication } from "../[id]/actions";
import { DocumentsTab } from "./documents-tab";

type Props = {
  mode: "edit" | "new";
  initialData: ApplicationFormData;
  applicationId?: string; // required in edit mode
  readOnlyReason?: string | null; // when set, the form is view-only
  files?: ApplicationStoredFiles | null; // edit mode: stored files for the Documents & Photo tab
};

const TABS = [
  { label: "Application Type", getErrors: getStep1Errors },
  { label: "Learner Information", getErrors: getStep2Errors },
  { label: "Address", getErrors: getStep3Errors },
  { label: "Family & Background", getErrors: getStep4Errors },
];

// The Documents & Photo tab comes after the form tabs
const DOCUMENTS_TAB = TABS.length;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ApplicationForm({
  mode,
  initialData,
  applicationId,
  readOnlyReason = null,
  files = null,
}: Props) {
  const router = useRouter();
  const { documentTypes } = useReference();
  const [isPending, startTransition] = useTransition();

  const [data, setData] = useState<ApplicationFormData>(initialData);
  const [tab, setTab] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  // New mode only: files chosen on this page, and how far Save & Enroll got
  const [newFiles, setNewFiles] = useState<ApplicationFiles>(
    INITIAL_APPLICATION_FILES,
  );
  const [progress, setProgress] =
    useState<WalkInProgress>(NEW_WALK_IN_PROGRESS);

  const updateData = (patch: Partial<ApplicationFormData>) => {
    setData((prev) => ({ ...prev, ...patch }));
    setMessage(null);
  };

  // A file chosen again for a slot must be uploaded again on the next Save
  function changeFiles(patch: Partial<ApplicationFiles>) {
    setNewFiles((prev) => ({ ...prev, ...patch }));
    setMessage(null);
    setProgress((p) => {
      if (p.uploaded.length === 0) return p;
      const changed = new Set<string>();
      if ("profile_picture" in patch) changed.add("photo");
      for (const id of Object.keys(patch.documents ?? {})) {
        if (patch.documents?.[id] !== newFiles.documents[id]) changed.add(id);
      }
      return { ...p, uploaded: p.uploaded.filter((k) => !changed.has(k)) };
    });
  }

  // After the first Save attempt, errors update live as the fields are fixed
  const tabErrors = TABS.map((t) => (showErrors ? t.getErrors(data) : {}));
  const errors: Record<string, string> = Object.assign({}, ...tabErrors);

  const showDocumentsTab = mode === "new" || !!files;
  const tabLabels = [
    ...TABS.map((t) => t.label),
    ...(showDocumentsTab ? ["Documents & Photo"] : []),
  ];
  const onDocumentsTab = showDocumentsTab && tab === DOCUMENTS_TAB;

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

    const email = data.email.trim();
    if (showDocumentsTab && email && !EMAIL_PATTERN.test(email)) {
      setTab(DOCUMENTS_TAB);
      setMessage({ type: "error", text: "Enter a valid email address." });
      return;
    }

    startTransition(async () => {
      try {
        if (mode === "new") {
          // Save as pending, upload the chosen files, then approve
          const result = await runWalkInFlow({
            data,
            files: newFiles,
            documentNames: Object.fromEntries(
              documentTypes.map((d) => [d.id, d.name]),
            ),
            progress,
          });
          if (!result.ok) {
            setProgress(result.progress);
            setMessage({ type: "error", text: result.error });
            return;
          }
          router.push("/admin/applications");
          return;
        }

        if (!applicationId) {
          setMessage({ type: "error", text: "Application not found." });
          return;
        }
        const result = await updateApplication(applicationId, data);
        if (!result.ok) {
          setMessage({ type: "error", text: result.error });
          return;
        }
        setMessage({ type: "success", text: "Changes saved." });
        router.refresh();
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
        {tabLabels.map((label, i) => {
          const hasError =
            i < TABS.length && Object.keys(tabErrors[i]).length > 0;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setTab(i)}
              className={cn(
                "inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                tab === i
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-black/10 bg-white text-foreground hover:bg-black/5",
              )}
            >
              {label}
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
        {!onDocumentsTab && (
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
              <Step4FamilyBackground
                data={data}
                onChange={updateData}
                errors={errors}
              />
            )}
          </fieldset>
        )}

        {/* Edit mode: files already stored, with Replace / Scan buttons */}
        {onDocumentsTab && mode === "edit" && files && applicationId && (
          <DocumentsTab
            applicationId={applicationId}
            files={files}
            data={data}
            onChange={updateData}
            readOnly={!!readOnlyReason}
          />
        )}

        {/* New mode: choose or scan files now; they upload when Save is pressed */}
        {onDocumentsTab && mode === "new" && (
          <Step5Documents
            files={newFiles}
            onChange={changeFiles}
            data={data}
            onDataChange={updateData}
          />
        )}
      </div>

      {/* Footer: also shown on the Documents & Photo tab, because the email
          field there is saved with the rest of the form */}
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
                ? "Enrolling..."
                : "Save & Enroll Student"}
          </Button>
        </div>
      )}
    </div>
  );
}
