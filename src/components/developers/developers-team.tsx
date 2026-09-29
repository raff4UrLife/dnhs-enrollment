"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const developers = [
  { name: "Grace Alibio", role: "QA Tester", image: "/assets/grace.png" },
  {
    name: "Jashmine Marie Roa",
    role: "UI/UX Designer",
    image: "/assets/jash.jpg",
  },
  {
    name: "Raffy Maluya",
    role: "Team Leader/Programmer",
    image: "/assets/raff.png",
  },
  { name: "Marvie Tamayo", role: "System Analyst", image: "/assets/marv.jpeg" },
  { name: "Rachel Bandol", role: "QA Tester", image: "/assets/logo.png" },
];

export function Developers() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const closeLightbox = useCallback(() => setActiveIndex(null), []);

  const showPrev = useCallback(() => {
    setActiveIndex((current) =>
      current === null
        ? null
        : (current - 1 + developers.length) % developers.length,
    );
  }, []);

  const showNext = useCallback(() => {
    setActiveIndex((current) =>
      current === null ? null : (current + 1) % developers.length,
    );
  }, []);

  useEffect(() => {
    if (activeIndex === null) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, closeLightbox, showPrev, showNext]);

  const active = activeIndex !== null ? developers[activeIndex] : null;

  return (
    <section className="relative isolate flex min-h-150 items-center overflow-hidden">
      <Image
        src="/assets/gate-hero.jpg"
        alt="Dimasalang National High School main entrance"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />

      <div className="absolute inset-0 bg-linear-to-t from-secondary via-secondary/70 to-secondary/10" />

      <div className="relative z-10 flex w-full flex-col items-center px-6 py-16">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm md:text-4xl">
            Developers Behind The Work
          </h1>

          <div className="mx-auto mt-3 h-1 w-full rounded-full bg-primary" />
        </div>

        {/* Mobile + Tablet: 1 column
            Desktop: 5 columns */}
        <div className="mx-auto grid w-full grid-cols-1 gap-6 md:max-w-5xl md:grid-cols-5">
          {developers.map((dev, index) => (
            <button
              key={dev.name}
              type="button"
              onClick={() => setActiveIndex(index)}
              className="group mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-xl border border-primary/20 bg-secondary/40 shadow-md backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-xl hover:shadow-primary/20 cursor-pointer md:mx-0 md:max-w-none"
            >
              {/* Mobile + Tablet: controlled height
                  Desktop: square image */}
              <div className="relative h-84 w-full overflow-hidden sm:h-80 md:aspect-square md:h-auto">
                <Image
                  src={dev.image}
                  alt={dev.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  sizes="(max-width: 767px) 100vw, 200px"
                />
              </div>

              <div className="flex min-h-28 flex-col items-center justify-center bg-secondary px-3 py-3 text-center">
                <p className="text-sm font-semibold text-white sm:text-base">
                  {dev.name}
                </p>

                <p className="text-xs font-medium text-primary/90">
                  {dev.role}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4"
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-6 top-6 cursor-pointer text-white/80 hover:text-white"
            aria-label="Close"
          >
            <X size={32} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              showPrev();
            }}
            className="absolute left-4 cursor-pointer text-white/80 hover:text-white sm:left-8"
            aria-label="Previous"
          >
            <ChevronLeft size={40} />
          </button>

          <div
            className="relative flex max-h-[80vh] w-full max-w-lg flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-xl">
              <Image
                src={active.image}
                alt={active.name}
                fill
                className="object-cover"
                sizes="500px"
              />
            </div>

            <p className="mt-4 text-lg font-medium text-white">{active.name}</p>

            <p className="text-sm text-white/70">{active.role}</p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              showNext();
            }}
            className="absolute right-4 cursor-pointer text-white/80 hover:text-white sm:right-8"
            aria-label="Next"
          >
            <ChevronRight size={40} />
          </button>
        </div>
      )}
    </section>
  );
}
