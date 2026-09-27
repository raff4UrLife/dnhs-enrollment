//page.tsx
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
  type ApplicationFormData,
} from "@/lib/enrollment/types";

import { ACTIVE_SCHOOL_YEAR } from "@/lib/enrollment/reference-data";

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

import { Step5Review } from "@/components/enrollment/step-5-review";
import { SubmissionSuccess } from "@/components/enrollment/submission-success";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Application Type" },
  { label: "Learner Information" },
  { label: "Address" },
  { label: "Family & Background" },
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

export default function EnrollmentFormPage() {
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
            : certified;

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

  if (submitted) {
    return <SubmissionSuccess />;
  }

  if (!ACTIVE_SCHOOL_YEAR.application_enabled) {
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
            Online pre-enrollment for {ACTIVE_SCHOOL_YEAR.name} is not open
            right now. Please check back later or visit the school directly.
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
        <p className="text-sm font-medium tracking-wide text-primary">
          Application · SY {ACTIVE_SCHOOL_YEAR.name}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Enrollment Application Form
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
            <Step5Review
              data={data}
              onViewStep={openView}
              certified={certified}
              onCertifiedChange={setCertified}
            />
          )}
        </div>

        <div
          className={cn(
            "mt-10 flex border-t border-white/15 pt-6",
            currentStep === 0 ? "justify-end" : "justify-between",
          )}
        >
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            >
              Back
            </Button>
          )}
          <Button
            disabled={!canContinue}
            onClick={() => {
              if (currentStep === STEPS.length - 1) {
                // TODO: replace with a real Supabase insert into `applications`
                // once the schema is deployed — this is a placeholder submit.
                setSubmitted(true);
              } else {
                setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1));
              }
            }}
          >
            {currentStep === STEPS.length - 1
              ? "Submit Application"
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
          </DialogBody>

          <DialogFooter>
            <Button onClick={handleDone}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
