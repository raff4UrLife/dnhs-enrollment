// src/components/enrollment/enrollment-wizard.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { StepTabs } from "@/components/enrollment/step-tabs";
import {
  Step1ApplicationType,
  getStep1Errors,
  isStep1Valid,
} from "@/components/enrollment/step-1-application-type";

import {
  INITIAL_APPLICATION_FORM,
  INITIAL_APPLICATION_FILES,
  type ApplicationFormData,
  type ApplicationFiles,
} from "@/lib/enrollment/types";

import { useReference } from "@/lib/enrollment/reference-context";
import { submitApplication } from "@/app/enrollment-form/actions";
import { uploadApplicationFiles } from "@/lib/enrollment/upload-files";

import {
  Step2LearnerInformation,
  getStep2Errors,
  isStep2Valid,
} from "@/components/enrollment/step-2-learner-information";

import {
  Step3Address,
  getStep3Errors,
  isStep3Valid,
} from "@/components/enrollment/step-3-address";

import {
  Step4FamilyBackground,
  getStep4Errors,
  isStep4Valid,
} from "@/components/enrollment/step-4-family-background";

import { Step5Review } from "@/components/enrollment/step-6-review";
import { SubmissionSuccess } from "@/components/enrollment/submission-success";
import {
  Step5Documents,
  isStep6Valid,
} from "@/components/enrollment/step-5-documents";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Application Type" },
  { label: "Learner Information" },
  { label: "Address" },
  { label: "Family & Background" },
  { label: "Documents & Photo" },
  { label: "Review & Submit" },
];

const STEP_ERROR_GETTERS: Record<
  number,
  (data: ApplicationFormData) => Record<string, string>
> = {
  0: getStep1Errors,
  1: getStep2Errors,
  2: getStep3Errors,
  3: getStep4Errors,
};

export function EnrollmentWizard() {
  const { schoolYear, documentTypes } = useReference();

  const [currentStep, setCurrentStep] = useState(0);
  const [viewingStep, setViewingStep] = useState<number | null>(null);
  const [viewingErrors, setViewingErrors] = useState<Record<string, string>>(
    {},
  );
  const [data, setData] = useState<ApplicationFormData>(
    INITIAL_APPLICATION_FORM,
  );

  const [certified, setCertified] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Names of files that did not reach the server (applicant brings them to school)
  const [notUploaded, setNotUploaded] = useState<string[]>([]);

  const [files, setFiles] = useState<ApplicationFiles>(
    INITIAL_APPLICATION_FILES,
  );
  const updateFiles = (patch: Partial<ApplicationFiles>) =>
    setFiles((prev) => ({ ...prev, ...patch }));

  const updateData = (patch: Partial<ApplicationFormData>) =>
    setData((prev) => ({ ...prev, ...patch }));

  const canContinue =
    currentStep === 0
      ? isStep1Valid(data)
      : currentStep === 1
        ? isStep2Valid(data)
        : currentStep === 2
          ? isStep3Valid(data)
          : currentStep === 3
            ? isStep4Valid(data)
            : currentStep === 4
              ? isStep6Valid(files, data, documentTypes)
              : certified;
  // console.log("step 2 errors:", getStep2Errors(data)); // TEMPORARY, delete after testing
  const openView = (step: number) => {
    setViewingErrors({});
    setViewingStep(step);
  };

  const closeView = () => {
    setViewingStep(null);
    setViewingErrors({});
  };

  const handleDone = () => {
    if (viewingStep === null) return;
    const getErrors = STEP_ERROR_GETTERS[viewingStep];
    const errors = getErrors ? getErrors(data) : {};
    if (Object.keys(errors).length > 0) {
      setViewingErrors(errors);
      return;
    }
    closeView();
  };

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      // 1) Save the application (server validates and sets channel/status)
      const result = await submitApplication(data);
      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }

      // 2) Upload the photo and documents. The application is already saved,
      //    so a failure here never cancels it; we only tell the applicant what to bring.
      const upload = await uploadApplicationFiles(result.applicationId, files);

      const missing = new Set<string>();
      const nameFor = (key: string) =>
        key === "profile"
          ? "Profile picture"
          : (documentTypes.find((d) => d.id === key)?.name ?? "A document");

      if (upload.ok) {
        upload.failedKeys.forEach((key) => missing.add(nameFor(key)));
        upload.rejected.forEach((item) =>
          missing.add(
            item === "profile picture"
              ? "Profile picture"
              : nameFor(item.split(".")[0]),
          ),
        );
      } else {
        if (files.profile_picture) missing.add("Profile picture");
        for (const d of documentTypes) {
          if (files.documents[d.id]) missing.add(d.name);
        }
      }

      setNotUploaded([...missing]);
      setSubmitted(true);
    } catch (err) {
      console.error("[EnrollmentWizard] submit failed", err);
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return <SubmissionSuccess notUploaded={notUploaded} />;
  }

  if (!schoolYear || !schoolYear.application_enabled) {
    return (
      <section className="relative isolate flex min-h-[60vh] items-center justify-center overflow-hidden">
        <Image
          src="/assets/gate-hero.jpg"
          alt="Dimasalang National High School main entrance"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-secondary/90" />
        <div className="relative mx-auto max-w-md px-6 text-center">
          <h1 className="text-2xl font-semibold text-white">
            Applications are currently closed
          </h1>
          <p className="mt-3 text-white/70">
            Online pre-enrollment
            {schoolYear ? ` for ${schoolYear.name}` : ""} is not open right now.
            Please check back later or visit the school directly.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative isolate overflow-hidden">
      <Image
        src="/assets/gate-hero.jpg"
        alt="Dimasalang National High School main entrance"
        fill
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-linear-to-t from-secondary via-secondary/70 to-secondary/10" />

      <div className="relative mx-auto max-w-4xl px-6 py-16">
        {/* <p className="text-sm font-medium tracking-wide text-primary">
          Application · SY {schoolYear.name}
        </p> */}
        <h1 className="mt-2 text-3xl font-semibold text-white">
          {/* Enrollment Application Form */}
          Application · SY {schoolYear.name}
        </h1>

        <div className="mt-8">
          <StepTabs steps={STEPS} currentStep={currentStep} />
        </div>

        <div className="mt-10">
          {currentStep === 0 && (
            <Step1ApplicationType data={data} onChange={updateData} />
          )}
          {currentStep === 1 && (
            <Step2LearnerInformation data={data} onChange={updateData} />
          )}
          {currentStep === 2 && (
            <Step3Address data={data} onChange={updateData} />
          )}
          {currentStep === 3 && (
            <Step4FamilyBackground data={data} onChange={updateData} />
          )}
          {currentStep === 4 && (
            <Step5Documents
              files={files}
              onChange={updateFiles}
              data={data}
              onDataChange={updateData}
            />
          )}
          {currentStep === 5 && (
            <Step5Review
              data={data}
              files={files}
              onViewStep={openView}
              certified={certified}
              onCertifiedChange={setCertified}
            />
          )}
        </div>

        {submitError && (
          <p className="mt-6 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {submitError}
          </p>
        )}

        <div
          className={cn(
            "mt-10 flex border-t border-white/15 pt-6",
            currentStep === 0 ? "justify-end" : "justify-between",
          )}
        >
          {currentStep > 0 && (
            <Button
              variant="outline"
              disabled={submitting}
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            >
              Back
            </Button>
          )}
          <Button
            disabled={!canContinue || submitting}
            onClick={() => {
              if (currentStep === STEPS.length - 1) {
                void handleSubmit();
              } else {
                setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1));
              }
            }}
          >
            {currentStep === STEPS.length - 1
              ? submitting
                ? "Submitting..."
                : "Submit Application"
              : "Continue"}
          </Button>
        </div>
      </div>

      <Dialog
        open={viewingStep !== null}
        onOpenChange={(open) => {
          if (!open) closeView();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {viewingStep !== null ? STEPS[viewingStep].label : ""}
            </DialogTitle>
          </DialogHeader>

          <DialogBody>
            {viewingStep === 0 && (
              <Step1ApplicationType
                data={data}
                onChange={updateData}
                errors={viewingErrors}
              />
            )}
            {viewingStep === 1 && (
              <Step2LearnerInformation
                data={data}
                onChange={updateData}
                errors={viewingErrors}
              />
            )}
            {viewingStep === 2 && (
              <Step3Address
                data={data}
                onChange={updateData}
                errors={viewingErrors}
              />
            )}
            {viewingStep === 3 && (
              <Step4FamilyBackground
                data={data}
                onChange={updateData}
                errors={viewingErrors}
              />
            )}
            {viewingStep === 4 && (
              <Step5Documents
                files={files}
                onChange={updateFiles}
                data={data}
                onDataChange={updateData}
              />
            )}
          </DialogBody>

          <DialogFooter>
            <Button onClick={handleDone}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
