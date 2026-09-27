import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative isolate flex min-h-150 items-end overflow-hidden">
      <Image
        src="/assets/gate-hero.jpg"
        alt="Dimasalang National High School main entrance"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />

      <div className="absolute inset-0 bg-linear-to-t from-secondary via-secondary/70 to-secondary/10" />

      <div className="relative mx-auto w-full max-w-6xl px-6 pb-20 md:pb-24 lg:pb-16 pt-32">
        <h1 className="mt-3 max-w-xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
          A public high school built on generations of learning.
        </h1>

        <p className="mt-4 max-w-md text-base text-white/80">
          Begin your pre-enrollment online and complete your requirements at
          school — no account needed to get started.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Button render={<Link href="/enrollment-form" />} size="lg">
            Start Application
          </Button>

          <Button render={<Link href="/about" />} variant="outline" size="lg">
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
}
