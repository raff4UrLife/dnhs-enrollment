import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    title: "Fill out the online pre-enrollment form",
    description:
      "Submit your name, grade level, strand, barangay, contact number, and guardian information. No account is required.",
  },
  {
    title: "Your application is marked as pending",
    description:
      "Once submitted, your application is saved and awaits review by the school registrar.",
  },
  {
    title: "Submit your original requirements at school",
    description:
      "Bring your original documents (e.g. report card, PSA birth certificate) to Dimasalang National High School for verification. Walk-in applicants are also welcome to apply directly at the registrar's office.",
  },
  {
    title: "Your application is reviewed and confirmed",
    description:
      "The registrar verifies your submitted information against your original documents and confirms your application.",
  },
  {
    title: "You're officially enrolled",
    description:
      "Once confirmed, your student record is created automatically and you are assigned to a grade level, strand, and section.",
  },
];

export default function AboutPage() {
  return (
    <section className="relative isolate overflow-hidden">
      <Image
        src="/assets/gate-hero.jpg"
        alt="Dimasalang National High School main entrance"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      {/* <div className="absolute inset-0 bg-secondary/90" /> */}
      <div className="absolute inset-0 bg-linear-to-t from-secondary via-secondary/70 to-secondary/10" />

      <div className="relative mx-auto max-w-4xl px-6 py-24">
        <h1 className="mt-2 text-4xl font-semibold text-white">
          The DNHS Online Enrollment System
        </h1>
        <p className="mt-6 max-w-2xl text-white/80">
          Dimasalang National High School built this system to make
          pre-enrollment faster and easier for students and parents, while
          keeping the final verification process personal and secure. You can
          start your application online in a few minutes — official enrollment
          is still confirmed in person, with your original documents at the
          school.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Button render={<Link href="/enrollment-form" />} size="lg">
            Enroll Now
          </Button>
        </div>

        <h2 className="mt-16 text-2xl font-semibold text-white">
          How enrollment works?
        </h2>

        <ol className="mt-8 space-y-8">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-serif text-sm font-semibold text-primary-foreground">
                {index + 1}
              </span>
              <div>
                <h3 className="font-medium text-white">{step.title}</h3>
                <p className="mt-1 text-sm text-white/70">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
