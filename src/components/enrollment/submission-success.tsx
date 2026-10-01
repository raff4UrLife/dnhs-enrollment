// src/components/enrollment/submission-success.tsx
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubmissionSuccessProps {
  notUploaded?: string[];
}

export function SubmissionSuccess({
  notUploaded = [],
}: SubmissionSuccessProps) {
  return (
    <section className="relative isolate flex min-h-[70vh] items-center justify-center overflow-hidden">
      <Image
        src="/assets/gate-hero.jpg"
        alt="Dimasalang National High School main entrance"
        fill
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-linear-to-t from-secondary via-secondary/70 to-secondary/10" />

      <div className="relative mx-auto max-w-md px-6 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
        <h1 className="mt-4 text-2xl font-semibold text-white">
          Application submitted
        </h1>
        <p className="mt-3 text-white/70">
          Your application has been received and is marked{" "}
          <strong className="text-white">pending</strong>. Please bring your
          original requirements to the school for verification.
        </p>

        {notUploaded.length > 0 && (
          <div className="mt-5 rounded-md border border-primary/40 bg-primary/10 p-4 text-left">
            <p className="text-sm font-medium text-white">
              These files could not be uploaded:
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm text-white/80">
              {notUploaded.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-white/70">
              Your application is still saved. Please bring these to the school
              together with your originals.
            </p>
          </div>
        )}

        <Button
          render={<Link href="/" />}
          variant="outline"
          size="lg"
          className="mt-6"
        >
          Return to home
        </Button>
      </div>
    </section>
  );
}
