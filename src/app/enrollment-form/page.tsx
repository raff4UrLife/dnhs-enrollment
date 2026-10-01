// src/app/enrollment-form/page.tsx
import Image from "next/image";
import { EnrollmentWizard } from "@/components/enrollment/enrollment-wizard";
import { ReferenceProvider } from "@/lib/enrollment/reference-context";
import {
  loadReferenceData,
  type ReferenceData,
} from "@/lib/enrollment/load-reference-data";

// Always fetch fresh, so an admin closing applications shows up right away
export const dynamic = "force-dynamic";

export default async function EnrollmentFormPage() {
  let reference: ReferenceData | null = null;

  try {
    reference = await loadReferenceData();
  } catch (err) {
    console.error("[EnrollmentFormPage] could not load reference data", err);
  }

  if (!reference) {
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
            The form is temporarily unavailable
          </h1>
          <p className="mt-3 text-white/70">
            Please try again in a few minutes, or visit the school directly.
          </p>
        </div>
      </section>
    );
  }

  return (
    <ReferenceProvider value={reference}>
      <EnrollmentWizard />
    </ReferenceProvider>
  );
}
